"use client";

import { useMemo } from "react";
import type { Cart } from "@/domain/cart-checkout/entities/cart";

export function useCart(cart: Cart) {
  return useMemo(
    () => ({
      cart,
      hasItems: cart.items.length > 0,
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
    }),
    [cart]
  );
}
