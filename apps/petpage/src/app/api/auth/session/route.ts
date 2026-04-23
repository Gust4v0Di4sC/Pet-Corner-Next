import { NextResponse } from "next/server";
import { z } from "zod";
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
  customerId: string;
  name: string;
  email: string;
  next: string;
};

const emailValidationSchema = z.string().email();
const sessionPayloadSchema = z
  .object({
    customerId: z.string().optional().default(""),
    name: z.string().optional().default(""),
    email: z.string().optional().default(""),
    next: z.string().optional().default(""),
  })
  .superRefine((input, context) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }

    if (!emailValidationSchema.safeParse(normalizedEmail).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email de sessao invalido.",
      });
    }
  })
  .transform((input): SessionPayload => {
    const normalizedCustomerId = input.customerId.trim();
    const normalizedName = input.name.trim();
    const normalizedEmail = input.email.trim().toLowerCase();

    return {
      customerId: normalizedCustomerId || "customer-structural",
      name: normalizedName || "Customer",
      email: normalizedEmail || "customer@example.com",
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

  const authRepository = new StructuralAuthRepository();
  const normalized = parsedPayload.data;
  const session = await authRepository.openSession({
    customerId: normalized.customerId,
    email: normalized.email,
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
