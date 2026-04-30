import type { Cart } from "@/features/cart-checkout/types/cart";
import type { CartRepository } from "@/features/cart-checkout/repositories/cart-repository";

export class BuildCartSummary {
  constructor(private readonly cartRepository: CartRepository) {}

  execute(customerId?: string): Promise<Cart> {
    return this.cartRepository.getActiveCart(customerId);
  }
}
