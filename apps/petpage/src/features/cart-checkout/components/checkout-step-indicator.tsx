import type { CheckoutStep } from "@/features/cart-checkout/hooks/use-checkout-flow";

type CheckoutStepIndicatorProps = {
  activeStep: CheckoutStep;
};

function stepLabelClassName(isActive: boolean) {
  return isActive ? "text-amber-50" : "text-amber-100/65";
}

export function CheckoutStepIndicator({ activeStep }: CheckoutStepIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-3 text-base font-semibold">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          activeStep === "delivery" ? "bg-[#fb8b24] text-white" : "bg-[#5b3a0f] text-amber-100/80"
        }`}
      >
        1
      </span>
      <span className={stepLabelClassName(activeStep === "delivery")}>Entrega</span>
      <span className="h-px w-12 bg-amber-100/25" aria-hidden="true" />
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          activeStep === "payment" ? "bg-[#fb8b24] text-white" : "bg-[#5b3a0f] text-amber-100/80"
        }`}
      >
        2
      </span>
      <span className={stepLabelClassName(activeStep === "payment")}>Pagamento</span>
    </div>
  );
}

