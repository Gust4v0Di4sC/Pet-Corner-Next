import type { CustomerProfile } from "@/domain/account/entities/customer-profile";

export function formatCustomerDisplayName(profile: CustomerProfile): string {
  return profile.name.trim() || profile.email;
}
