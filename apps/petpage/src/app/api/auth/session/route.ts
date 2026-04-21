import { NextResponse } from "next/server";
import { StructuralAuthRepository } from "@/infrastructure/auth/structural-auth.repository";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
} from "@/infrastructure/auth/session-constants";
import {
  createSessionCookieValue,
} from "@/infrastructure/auth/session-cookie";
import { sanitizeRedirectPath } from "@/utils/shared/route";

type SessionPayload = {
  customerId?: string;
  name?: string;
  email?: string;
  next?: string;
};

function buildSessionPayload(input: SessionPayload): SessionPayload {
  return {
    customerId: input.customerId || "customer-structural",
    name: input.name || "Customer",
    email: input.email || "customer@example.com",
    next: sanitizeRedirectPath(input.next, "/profile"),
  };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isFormRequest =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let payload: SessionPayload;
  if (isFormRequest) {
    const form = await request.formData();
    payload = {
      customerId: String(form.get("customerId") || ""),
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      next: String(form.get("next") || ""),
    };
  } else {
    payload = (await request.json().catch(() => ({}))) as SessionPayload;
  }

  const authRepository = new StructuralAuthRepository();
  const normalized = buildSessionPayload(payload);
  const session = await authRepository.openSession({
    customerId: normalized.customerId!,
    email: normalized.email!,
    name: normalized.name,
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
