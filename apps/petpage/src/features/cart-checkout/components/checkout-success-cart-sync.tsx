"use client";

import { useEffect } from "react";
import { GUEST_CART_STORAGE_KEY } from "@/features/cart-checkout/utils/guest-cart-storage";
import { CUSTOMER_CART_CHANGED_EVENT } from "@/features/cart-checkout/services/customer-cart.service";

export function CheckoutSuccessCartSync() {
  useEffect(() => {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(CUSTOMER_CART_CHANGED_EVENT, {
        detail: {
          mode: "local",
          itemCount: 0,
          subtotalInCents: 0,
          updatedAtIso: new Date().toISOString(),
        },
      })
    );
  }, []);

  return null;
}
