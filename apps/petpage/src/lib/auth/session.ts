import type { CustomerSession } from "@/features/auth/types/customer-session";

export function isSessionExpired(session: CustomerSession, now = new Date()): boolean {
  return new Date(session.expiresAt).getTime() <= now.getTime();
}
