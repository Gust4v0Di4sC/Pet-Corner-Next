"use client";

import { useMemo } from "react";
import type { CustomerProfile } from "@/domain/account/entities/customer-profile";

export function useCustomerProfile(profile: CustomerProfile | null) {
  return useMemo(
    () => ({
      profile,
      hasProfile: Boolean(profile?.customerId),
    }),
    [profile]
  );
}
