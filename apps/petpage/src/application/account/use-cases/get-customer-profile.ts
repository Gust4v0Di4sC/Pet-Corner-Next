import type { CustomerProfile } from "@/domain/account/entities/customer-profile";
import type { CustomerRepository } from "@/domain/account/repositories/customer-repository";

export class GetCustomerProfile {
  constructor(private readonly customerRepository: CustomerRepository) {}

  execute(customerId: string): Promise<CustomerProfile | null> {
    return this.customerRepository.getById(customerId);
  }
}
