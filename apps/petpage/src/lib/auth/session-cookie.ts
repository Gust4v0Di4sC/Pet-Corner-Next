import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CustomerSession } from "@/features/auth/types/customer-session";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-constants";

const SIGNED_SESSION_VERSION = "v1";
const DEVELOPMENT_SIGNING_SECRET_ENV_NAMES = [
  "CUSTOMER_SESSION_SECRET",
  "AUTH_SESSION_SECRET",
  "NEXTAUTH_SECRET",
] as const;

function readSigningSecret(): string {
  const customerSessionSecret = process.env.CUSTOMER_SESSION_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!customerSessionSecret) {
      throw new Error(
        "CUSTOMER_SESSION_SECRET precisa estar configurada para assinar sessoes em producao."
      );
    }

    return customerSessionSecret;
  }

  const secret = DEVELOPMENT_SIGNING_SECRET_ENV_NAMES.map((name) =>
    process.env[name]?.trim()
  ).find(Boolean);

  if (!secret) {
    throw new Error(
      "CUSTOMER_SESSION_SECRET, AUTH_SESSION_SECRET ou NEXTAUTH_SECRET precisa estar configurada para assinar sessoes."
    );
  }

  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", readSigningSecret()).update(payload).digest("base64url");
}

function hasValidSignature(payload: string, signature: string): boolean {
  const expectedSignature = signPayload(payload);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function createSessionCookieValue(session: CustomerSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${SIGNED_SESSION_VERSION}.${payload}.${signPayload(payload)}`;
}

export function readSignedSessionCookieValue(cookieValue: string): string | null {
  const [version, payload, signature] = cookieValue.split(".");

  if (version !== SIGNED_SESSION_VERSION || !payload || !signature) {
    return null;
  }

  try {
    return hasValidSignature(payload, signature)
      ? Buffer.from(payload, "base64url").toString("utf-8")
      : null;
  } catch {
    return null;
  }
}

export { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_SECONDS };
