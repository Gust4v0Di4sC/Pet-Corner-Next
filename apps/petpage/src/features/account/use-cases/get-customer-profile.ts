import type { CustomerProfile } from "@/features/account/types/customer-profile";
import type { CustomerRepository } from "@/features/account/repositories/customer-repository";

export class GetCustomerProfile {
  constructor(private readonly customerRepository: CustomerRepository) {}

  execute(customerId: string): Promise<CustomerProfile | null> {
    return this.customerRepository.getById(customerId);
  }
}
