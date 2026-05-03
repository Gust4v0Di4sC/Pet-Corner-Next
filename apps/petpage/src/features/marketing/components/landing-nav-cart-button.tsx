"use client";

import { useQuery } from "@tanstack/react-query";
import { CartPanelDrawer } from "@/features/marketing/components/cart-panel-drawer";
import { GuestCartButton } from "@/features/marketing/components/guest-cart-button";

type CustomerSessionSummary = {
  customerId: string;
};

type SessionResponse = {
  session?: {
    customerId?: unknown;
  } | null;
};

async function readCustomerSession(): Promise<CustomerSessionSummary | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as SessionResponse | null;
  const customerId =
    typeof payload?.session?.customerId === "string" ? payload.session.customerId.trim() : "";

  return customerId ? { customerId } : null;
}

export function LandingNavCartButton() {
  const { data: session } = useQuery({
    queryKey: ["customer-session", "landing-navbar"],
    queryFn: readCustomerSession,
    staleTime: 30_000,
  });

  if (session?.customerId) {
    return <CartPanelDrawer customerId={session.customerId} />;
  }

  return <GuestCartButton />;
}
