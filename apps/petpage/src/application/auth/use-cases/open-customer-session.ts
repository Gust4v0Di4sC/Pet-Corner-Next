import type { CustomerSession } from "@/domain/auth/entities/customer-session";
import type { AuthRepository } from "@/domain/auth/repositories/auth-repository";
import type { OpenCustomerSessionInput } from "@/application/auth/dtos/session.dto";

export class OpenCustomerSession {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: OpenCustomerSessionInput): Promise<CustomerSession> {
    return this.authRepository.openSession(input);
  }
}
