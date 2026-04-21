import type { CustomerSession } from "@/domain/auth/entities/customer-session";

export function isSessionExpired(session: CustomerSession, now = new Date()): boolean {
  return new Date(session.expiresAt).getTime() <= now.getTime();
}
