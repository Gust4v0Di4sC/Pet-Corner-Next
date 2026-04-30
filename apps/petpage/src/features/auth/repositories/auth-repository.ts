import type { CustomerSession } from "@/features/auth/types/customer-session";

export type OpenSessionInput = {
  customerId: string;
  email: string;
  name?: string;
};

export interface AuthRepository {
  openSession(input: OpenSessionInput): Promise<CustomerSession>;
  closeSession(customerId: string): Promise<void>;
}
