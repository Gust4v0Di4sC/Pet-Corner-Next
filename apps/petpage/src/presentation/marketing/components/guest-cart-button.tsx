"use client";

import Link from "next/link";
import { ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import { useCustomerCart } from "@/hooks/cart-checkout/use-customer-cart";
import { getCartItemsCount } from "@/services/cart-checkout/customer-cart.service";

export function GuestCartButton() {
  const { cart } = useCustomerCart();
  const itemsCount = getCartItemsCount(cart);

  return (
    <Link
      href="/cart"
      suppressHydrationWarning
      className="relative inline-flex items-center gap-2 rounded-full bg-[#fb8b24] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(251,139,36,0.9)] transition hover:bg-[#ef7e14]"
    >
      <ShoppingCartSimple className="h-4 w-4" />
      Carrinho
      {itemsCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-[#f7f6f2] bg-slate-900 px-1 text-[11px] font-bold leading-none text-white">
          {itemsCount > 99 ? "99+" : itemsCount}
        </span>
      ) : null}
    </Link>
  );
}
