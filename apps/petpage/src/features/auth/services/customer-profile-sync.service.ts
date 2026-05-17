"use client";

import { upsertCustomerProfile } from "@/features/account/services/firebase-customer.adapter";

export type CustomerIdentityInput = {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerId?: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

function mapProvider(providerId?: string): "password" | "google.com" | "microsoft.com" | "unknown" {
  if (providerId === "password") return "password";
  if (providerId === "google.com") return "google.com";
  if (providerId === "microsoft.com") return "microsoft.com";
  return "unknown";
}

export async function syncCustomerProfile(
  identity: CustomerIdentityInput,
  fallbackName: string
): Promise<void> {
  const normalizedEmail = identity.email?.trim();
  if (!normalizedEmail) {
    return;
  }

  try {
    await upsertCustomerProfile({
      customerId: identity.uid,
      email: normalizedEmail,
      name: identity.displayName || fallbackName,
      provider: mapProvider(identity.providerId),
    });
  } catch (error) {
    // The profile sync must not block auth/session bootstrap.
    console.warn("Customer profile sync skipped:", error);
  }
}

