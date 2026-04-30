import { PageContainer, PageShell } from "@/components/layout/page-shell";
import { CartSummary } from "@/features/cart-checkout/components/cart-summary";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export async function CartPage() {
  const session = await readServerCustomerSession();

  return (
    <PageShell>
      <NavBar />
      <PageContainer className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">
            Carrinho
          </h1>
          <p className="text-lg text-amber-100/80 md:text-2xl">
            Revise seus itens antes de finalizar a compra.
          </p>
        </header>
        <CartSummary customerId={session?.customerId} isAuthenticated={Boolean(session)} />
      </PageContainer>
    </PageShell>
  );
}

