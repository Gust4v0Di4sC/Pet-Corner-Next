"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { User } from "@phosphor-icons/react/dist/ssr";
import { UserPanelDrawer } from "@/features/marketing/components/user-panel-drawer";

type CustomerSessionSummary = {
  name?: string;
  email: string;
};

type SessionResponse = {
  session?: {
    name?: unknown;
    email?: unknown;
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
  const email = typeof payload?.session?.email === "string" ? payload.session.email.trim() : "";
  const name = typeof payload?.session?.name === "string" ? payload.session.name.trim() : "";

  return email ? { email, name } : null;
}

export function LandingNavUserButton() {
  const { data: session } = useQuery({
    queryKey: ["customer-session", "landing-navbar-user"],
    queryFn: readCustomerSession,
    staleTime: 30_000,
  });

  if (session?.email) {
    return <UserPanelDrawer name={session.name} email={session.email} />;
  }

  return (
    <Link
      href="/login?from=landing"
      aria-label="Perfil do cliente"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
    >
      <User className="h-5 w-5" />
    </Link>
  );
}
