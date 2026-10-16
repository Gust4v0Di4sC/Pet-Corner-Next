import "server-only";
import { cookies } from "next/headers";
import type { CustomerSession } from "@/features/auth/types/customer-session";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth/session-constants";
import { getFirebaseServerAuth } from "@/lib/firebase/firebase-server";

export async function readServerCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!cookieValue) return null;
  const claims = await getFirebaseServerAuth().verifySessionCookie(cookieValue, true).catch(() => null);
  if (!claims?.uid || typeof claims.email !== "string" || !claims.exp || !claims.iat) return null;
  return {
    customerId: claims.uid,
    email: claims.email,
    name: typeof claims.name === "string" ? claims.name : undefined,
    issuedAt: new Date(claims.iat * 1000).toISOString(),
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  } satisfies CustomerSession;
}
