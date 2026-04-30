import type { CheckoutDraft } from "@/features/cart-checkout/types/checkout-draft";

export interface CheckoutRepository {
  create(draft: CheckoutDraft): Promise<{ orderId: string }>;
}
