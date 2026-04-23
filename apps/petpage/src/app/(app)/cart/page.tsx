import { CartSummary } from "@/presentation/cart-checkout/components/cart-summary";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/utils/auth/customer-session.server";

export default async function CartPage() {
  const session = await readServerCustomerSession();

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_85%_15%,rgba(251,139,36,0.18),transparent_40%),linear-gradient(145deg,#4a2d03_0%,#3b2608_55%,#2d1b06_100%)]">
      <NavBar />
      <div className="mx-auto w-full max-w-[1320px] space-y-6 px-4 py-8 md:py-10">
        <header className="space-y-1">
          <h1 className="text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">
            Carrinho
          </h1>
          <p className="text-lg text-amber-100/80 md:text-2xl">
            Revise seus itens antes de finalizar a compra.
          </p>
        </header>
        <CartSummary customerId={session?.customerId} isAuthenticated={Boolean(session)} />
      </div>
    </main>
  );
}
