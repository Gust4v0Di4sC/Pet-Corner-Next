"use client";

import { CreditCard, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutDeliveryForm } from "@/features/cart-checkout/components/checkout-delivery-form";
import { CheckoutOrderSummary } from "@/features/cart-checkout/components/checkout-order-summary";
import { CheckoutPaymentForm } from "@/features/cart-checkout/components/checkout-payment-form";
import { CheckoutStepIndicator } from "@/features/cart-checkout/components/checkout-step-indicator";
import { useCheckoutFlow } from "@/features/cart-checkout/hooks/use-checkout-flow";

type CheckoutFormProps = {
  customerId: string;
  customerName?: string;
  customerEmail: string;
};

export function CheckoutForm({ customerId, customerName, customerEmail }: CheckoutFormProps) {
  const checkout = useCheckoutFlow({ customerId, customerName });
  const { activeStep, deliveryForm } = checkout.data;
  const {
    isLoading,
    isSavingDelivery,
    isCreatingStripeSession,
    errorMessage,
    successMessage,
  } = checkout.state;

  return (
    <section className="space-y-7">
      <header className="space-y-3">
        <h1 className="text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">Checkout</h1>
        <CheckoutStepIndicator activeStep={activeStep} />
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
          <CardHeader className="border-b border-slate-700/80 pb-5 pt-6">
            <CardTitle className="flex items-center gap-2 text-4xl font-semibold text-slate-100">
              {activeStep === "delivery" ? (
                <>
                  <Truck className="h-6 w-6 text-[#fb8b24]" />
                  Endereco de entrega
                </>
              ) : (
                <>
                  <CreditCard className="h-6 w-6 text-[#fb8b24]" />
                  Pagamento
                </>
              )}
            </CardTitle>
            <p className="text-sm text-slate-300">
              {activeStep === "delivery"
                ? "Preencha os dados para envio do pedido."
                : "Confira o pedido e siga para o Checkout seguro do Stripe."}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            {errorMessage ? (
              <p className="rounded-2xl border border-red-300/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-100">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-300/40 bg-emerald-950/40 px-4 py-3 text-sm font-medium text-emerald-100">
                {successMessage}
              </p>
            ) : null}

            {activeStep === "delivery" ? (
              <CheckoutDeliveryForm
                deliveryForm={deliveryForm}
                disabled={isSavingDelivery || isLoading || !checkout.data.hasItems}
                isSavingDelivery={isSavingDelivery}
                onInputChange={checkout.actions.onDeliveryInputChange}
                onSubmit={(event) => void checkout.actions.onContinueToPayment(event)}
              />
            ) : (
              <CheckoutPaymentForm
                deliveryForm={deliveryForm}
                disabled={isCreatingStripeSession || isLoading || !checkout.data.hasItems}
                isCreatingStripeSession={isCreatingStripeSession}
                onBackToDelivery={checkout.actions.onBackToDelivery}
                onSubmit={(event) => void checkout.actions.onCreateStripeCheckoutSession(event)}
              />
            )}
          </CardContent>
        </Card>

        <CheckoutOrderSummary
          customerEmail={customerEmail}
          cart={checkout.data.cart}
          previewItems={checkout.data.previewItems}
          hiddenItemsCount={checkout.data.hiddenItemsCount}
          itemsCount={checkout.data.itemsCount}
          isLoading={isLoading}
          hasItems={checkout.data.hasItems}
          cartErrorMessage={checkout.state.cartErrorMessage}
          shippingInCents={checkout.data.shippingInCents}
          totalInCents={checkout.data.totalInCents}
        />
      </div>
    </section>
  );
}
