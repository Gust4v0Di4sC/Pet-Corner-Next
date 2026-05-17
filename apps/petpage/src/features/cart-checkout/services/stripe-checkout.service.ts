import type { CheckoutDeliveryStepInput } from "@/features/cart-checkout/validation/checkout-schemas";

type StripeCheckoutCartItemInput = {
  productId: string;
  quantity: number;
};

type CreateStripeCheckoutSessionInput = {
  delivery: CheckoutDeliveryStepInput;
  cart: {
    items: StripeCheckoutCartItemInput[];
  };
};

export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutSessionInput
): Promise<string> {
  const response = await fetch("/api/stripe/checkout/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!response.ok || !result.url) {
    throw new Error(result.error || "Nao foi possivel iniciar o checkout Stripe.");
  }

  return result.url;
}
