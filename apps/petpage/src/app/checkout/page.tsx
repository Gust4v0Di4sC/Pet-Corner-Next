import { CheckoutForm } from "@/presentation/cart-checkout/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="min-h-svh bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-600">
            Protected route scaffold. Session validation is handled by middleware.
          </p>
        </header>
        <CheckoutForm />
      </div>
    </main>
  );
}
