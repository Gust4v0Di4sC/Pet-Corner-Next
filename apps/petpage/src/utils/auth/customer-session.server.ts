import "server-only";
import { cookies } from "next/headers";
import type { CustomerSession } from "@/domain/auth/entities/customer-session";
import { CUSTOMER_SESSION_COOKIE } from "@/infrastructure/auth/session-constants";
import { isSessionExpired } from "@/utils/auth/session";

function hasValidDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isCustomerSession(value: unknown): value is CustomerSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<CustomerSession>;
  return (
    typeof session.customerId === "string" &&
    session.customerId.trim().length > 0 &&
    typeof session.email === "string" &&
    session.email.trim().length > 0 &&
    (typeof session.name === "undefined" || typeof session.name === "string") &&
    typeof session.issuedAt === "string" &&
    hasValidDate(session.issuedAt) &&
    typeof session.expiresAt === "string" &&
    hasValidDate(session.expiresAt)
  );
}

export function parseCustomerSessionCookieValue(
  cookieValue: string | null | undefined
): CustomerSession | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const decodedPayload = Buffer.from(cookieValue, "base64url").toString("utf-8");
    const parsedPayload = JSON.parse(decodedPayload) as unknown;

    if (!isCustomerSession(parsedPayload)) {
      return null;
    }

    if (isSessionExpired(parsedPayload)) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

export async function readServerCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  return parseCustomerSessionCookieValue(cookieValue);
}
