import { CartSummary } from "@/presentation/cart-checkout/components/cart-summary";

export default function CartPage() {
  return (
    <main className="min-h-svh bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Cart</h1>
          <p className="text-sm text-slate-600">
            Public cart view with a clear path to authenticated checkout.
          </p>
        </header>
        <CartSummary />
      </div>
    </main>
  );
}
