import type { CustomerSession } from "@/domain/auth/entities/customer-session";
import type { AuthRepository, OpenSessionInput } from "@/domain/auth/repositories/auth-repository";
import { CUSTOMER_SESSION_MAX_AGE_SECONDS } from "@/infrastructure/auth/session-constants";

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
