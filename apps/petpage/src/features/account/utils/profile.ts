import type { CustomerProfile } from "@/features/account/types/customer-profile";

export function formatCustomerDisplayName(profile: CustomerProfile): string {
  return profile.name.trim() || profile.email;
}
