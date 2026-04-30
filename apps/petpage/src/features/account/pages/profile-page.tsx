import { redirect } from "next/navigation";

import { PageContainer, PageShell } from "@/components/layout/page-shell";
import { ProfileDashboard } from "@/features/account/components/profile-dashboard";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export async function ProfilePage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/profile");
  }

  return (
    <PageShell>
      <NavBar />
      <PageContainer>
        <ProfileDashboard
          session={{
            customerId: session.customerId,
            name: session.name,
            email: session.email,
            issuedAt: session.issuedAt,
            expiresAt: session.expiresAt,
          }}
        />
      </PageContainer>
    </PageShell>
  );
}
