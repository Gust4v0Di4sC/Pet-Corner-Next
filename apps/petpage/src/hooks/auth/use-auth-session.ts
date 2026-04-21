"use client";

import { useMemo } from "react";
import type { CustomerSession } from "@/domain/auth/entities/customer-session";

export function useAuthSession(session: CustomerSession | null) {
  return useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.customerId),
    }),
    [session]
  );
}
