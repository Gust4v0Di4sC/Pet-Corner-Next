import type { Cart } from "@/features/cart-checkout/types/cart";

export interface CartRepository {
  getActiveCart(customerId?: string): Promise<Cart>;
  save(cart: Cart): Promise<void>;
  clear(customerId: string): Promise<void>;
}
