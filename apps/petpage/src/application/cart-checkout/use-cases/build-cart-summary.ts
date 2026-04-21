import type { Cart } from "@/domain/cart-checkout/entities/cart";
import type { CartRepository } from "@/domain/cart-checkout/repositories/cart-repository";

export class BuildCartSummary {
  constructor(private readonly cartRepository: CartRepository) {}

  execute(customerId?: string): Promise<Cart> {
    return this.cartRepository.getActiveCart(customerId);
  }
}
