import type { CustomerProfile } from "@/features/account/types/customer-profile";

export interface CustomerRepository {
  getById(customerId: string): Promise<CustomerProfile | null>;
  upsert(profile: CustomerProfile): Promise<void>;
}
