import type { Cart } from "@/domain/cart-checkout/entities/cart";

export interface CartRepository {
  getActiveCart(customerId?: string): Promise<Cart>;
  save(cart: Cart): Promise<void>;
  clear(customerId: string): Promise<void>;
}
