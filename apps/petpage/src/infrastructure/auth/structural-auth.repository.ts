import type { CustomerSession } from "@/domain/auth/entities/customer-session";
import type { AuthRepository, OpenSessionInput } from "@/domain/auth/repositories/auth-repository";

export class StructuralAuthRepository implements AuthRepository {
  async openSession(input: OpenSessionInput): Promise<CustomerSession> {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * 7);

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
