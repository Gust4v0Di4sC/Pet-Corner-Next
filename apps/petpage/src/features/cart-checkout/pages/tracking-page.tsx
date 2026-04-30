import { redirect } from "next/navigation";

import { PageContainer, PageShell } from "@/components/layout/page-shell";
import { OrderTrackingPage } from "@/features/cart-checkout/components/order-tracking-page";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export async function TrackingPage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/rastreamento");
  }

  return (
    <PageShell>
      <NavBar />
      <PageContainer>
        <OrderTrackingPage customerId={session.customerId} />
      </PageContainer>
    </PageShell>
  );
}
