import type { CustomerSession } from "@/features/auth/types/customer-session";
import type { AuthRepository, OpenSessionInput } from "@/features/auth/repositories/auth-repository";
import { CUSTOMER_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-constants";

export class StructuralAuthRepository implements AuthRepository {
  async openSession(input: OpenSessionInput): Promise<CustomerSession> {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000);

    return {
      customerId: input.customerId,
      email: input.email,
      name: input.name,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async closeSession(customerId: string): Promise<void> {
    void customerId;
    return;
  }
}
