import type { CustomerProfile } from "@/domain/account/entities/customer-profile";

export interface CustomerRepository {
  getById(customerId: string): Promise<CustomerProfile | null>;
  upsert(profile: CustomerProfile): Promise<void>;
}
