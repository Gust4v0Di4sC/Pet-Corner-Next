import type { CheckoutDraft } from "@/domain/cart-checkout/entities/checkout-draft";

export interface CheckoutRepository {
  create(draft: CheckoutDraft): Promise<{ orderId: string }>;
}
