import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { z } from "zod";
import { StructuralAuthRepository } from "@/lib/auth/structural-auth.repository";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-constants";
import {
  createSessionCookieValue,
} from "@/lib/auth/session-cookie";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getFirebaseServerApp } from "@/lib/firebase/firebase-server";
import { sanitizeRedirectPath } from "@/lib/routing/route";

type SessionPayload = {
  name: string;
  next: string;
};

function readBearerToken(request: Request): string {
  const authorizationHeader = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  return match?.[1]?.trim() || "";
}

export async function GET() {
  const session = await readServerCustomerSession();
  return NextResponse.json({ ok: true, session });
}

const emailValidationSchema = z.string().email();
const sessionPayloadSchema = z
  .object({
    name: z.string().optional().default(""),
    next: z.string().optional().default(""),
  })
  .transform((input): SessionPayload => {
    const normalizedName = input.name.trim();

    return {
      name: normalizedName,
      next: sanitizeRedirectPath(input.next, "/profile"),
    };
  });

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isFormRequest =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let payload: unknown;
  if (isFormRequest) {
    const form = await request.formData();
    payload = {
      customerId: String(form.get("customerId") || ""),
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      next: String(form.get("next") || ""),
    };
  } else {
    payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const parsedPayload = sessionPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const [firstIssue] = parsedPayload.error.issues;
    return NextResponse.json(
      {
        ok: false,
        error: firstIssue?.message || "Payload de sessao invalido.",
      },
      { status: 400 }
    );
  }

  const idToken = readBearerToken(request);
  if (!idToken) {
    return NextResponse.json(
      { ok: false, error: "Token de autenticacao ausente." },
      { status: 401 }
    );
  }

  const decodedToken = await getAuth(getFirebaseServerApp())
    .verifyIdToken(idToken)
    .catch(() => null);

  if (!decodedToken?.uid) {
    return NextResponse.json(
      { ok: false, error: "Token de autenticacao invalido." },
      { status: 401 }
    );
  }

  const tokenEmail = typeof decodedToken.email === "string" ? decodedToken.email.trim().toLowerCase() : "";
  if (!emailValidationSchema.safeParse(tokenEmail).success) {
    return NextResponse.json(
      { ok: false, error: "Email autenticado invalido." },
      { status: 401 }
    );
  }

  const tokenName = typeof decodedToken.name === "string" ? decodedToken.name.trim() : "";
  const authRepository = new StructuralAuthRepository();
  const normalized = parsedPayload.data;
  const session = await authRepository.openSession({
    customerId: decodedToken.uid,
    email: tokenEmail,
    name: tokenName || normalized.name || "Cliente Pet Corner",
  });

  const nextPath = sanitizeRedirectPath(normalized.next, "/profile");
  const cookieValue = createSessionCookieValue(session);

  if (isFormRequest) {
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set(CUSTOMER_SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  }

  const response = NextResponse.json({ ok: true, nextPath, session });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
