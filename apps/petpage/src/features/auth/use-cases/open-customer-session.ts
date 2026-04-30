import type { CustomerSession } from "@/features/auth/types/customer-session";
import type { AuthRepository } from "@/features/auth/repositories/auth-repository";
import type { OpenCustomerSessionInput } from "@/features/auth/dtos/session.dto";

export class OpenCustomerSession {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: OpenCustomerSessionInput): Promise<CustomerSession> {
    return this.authRepository.openSession(input);
  }
}
