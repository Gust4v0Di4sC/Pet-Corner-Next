"use client";

import type { SubmitEventHandler } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeliveryFormState } from "@/features/cart-checkout/hooks/use-checkout-flow";

type CheckoutPaymentFormProps = {
  deliveryForm: DeliveryFormState;
  disabled: boolean;
  isCreatingStripeSession: boolean;
  onBackToDelivery: () => void;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
};

export function CheckoutPaymentForm({
  deliveryForm,
  disabled,
  isCreatingStripeSession,
  onBackToDelivery,
  onSubmit,
}: CheckoutPaymentFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
          <p className="text-sm font-semibold text-slate-100">Entrega</p>
          <p className="mt-2 text-sm text-slate-300">
            {deliveryForm.fullName}
            <br />
            {deliveryForm.street}, {deliveryForm.number} - {deliveryForm.district}
            <br />
            {deliveryForm.city}/{deliveryForm.state} - {deliveryForm.zipCode}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
          <p className="text-sm font-semibold text-slate-100">Pagamento</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200">
              Cartão
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200">
              Pix
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            O pagamento será concluído no ambiente hospedado do Stripe.
          </p>
        </div>
      </div>

      <p className="inline-flex items-center gap-2 text-sm text-amber-100/70">
        <Lock className="h-4 w-4" />
        Pedido criado somente após confirmação de pagamento pelo Stripe.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <Button
          type="button"
          onClick={onBackToDelivery}
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100/90 transition hover:text-amber-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Button
          type="submit"
          disabled={disabled}
          className="h-11 rounded-full bg-[#d97706] px-6 text-base font-semibold text-white hover:bg-[#c86f0a] disabled:opacity-60"
        >
          {isCreatingStripeSession ? "Abrindo Stripe..." : "Pagar com Stripe"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
