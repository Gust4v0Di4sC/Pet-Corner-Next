import type { CustomerSession } from "@/features/auth/types/customer-session";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-constants";

export function createSessionCookieValue(session: CustomerSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_SECONDS };
