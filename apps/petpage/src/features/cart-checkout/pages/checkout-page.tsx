import { redirect } from "next/navigation";

import { PageContainer, PageShell } from "@/components/layout/page-shell";
import { CheckoutForm } from "@/features/cart-checkout/components/checkout-form";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export async function CheckoutPage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/checkout");
  }

  return (
    <PageShell>
      <NavBar />
      <PageContainer>
        <CheckoutForm
          customerId={session.customerId}
          customerName={session.name}
          customerEmail={session.email}
        />
      </PageContainer>
    </PageShell>
  );
}

