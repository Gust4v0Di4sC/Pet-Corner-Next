import Image from "next/image";
import fallbackProduct from "@/assets/fallbackproduct.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Cart, CartItem } from "@/features/cart-checkout/types/cart";
import { formatPriceBRL } from "@/lib/formatters/price";

type CheckoutOrderSummaryProps = {
  customerEmail: string;
  cart: Cart;
  previewItems: CartItem[];
  hiddenItemsCount: number;
  itemsCount: number;
  isLoading: boolean;
  hasItems: boolean;
  cartErrorMessage: string | null;
  shippingInCents: number;
  totalInCents: number;
};

export function CheckoutOrderSummary({
  customerEmail,
  cart,
  previewItems,
  hiddenItemsCount,
  itemsCount,
  isLoading,
  hasItems,
  cartErrorMessage,
  shippingInCents,
  totalInCents,
}: CheckoutOrderSummaryProps) {
  return (
    <Card className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)] xl:sticky xl:top-24">
      <CardHeader className="border-b border-slate-700/80 pb-5 pt-6">
        <CardTitle className="text-4xl font-semibold text-slate-100">Seu pedido</CardTitle>
        <p className="text-xs text-slate-400">Conta: {customerEmail}</p>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {cartErrorMessage ? (
          <p className="rounded-2xl border border-red-300/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-100">
            {cartErrorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-2xl border border-slate-700 bg-slate-900/70"
              />
            ))}
          </div>
        ) : !hasItems ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
            Seu carrinho esta vazio. Volte para produtos para continuar.
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {previewItems.map((item) => {
                const imageUrl = item.imageUrl?.trim() || fallbackProduct.src;

                return (
                  <li
                    key={item.productId}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        sizes="48px"
                        unoptimized={/^https?:\/\//i.test(imageUrl)}
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-400">x{item.quantity}</p>
                    </div>

                    <p className="text-sm font-semibold text-slate-100">
                      {formatPriceBRL(item.quantity * item.unitPriceInCents)}
                    </p>
                  </li>
                );
              })}
            </ul>

            {hiddenItemsCount > 0 ? (
              <p className="text-xs text-slate-400">+{hiddenItemsCount} item(ns) no pedido</p>
            ) : null}
          </>
        )}

        <div className="space-y-2 border-t border-slate-700/80 pt-4">
          <div className="flex items-center justify-between text-slate-300">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-100">
              {formatPriceBRL(cart.subtotalInCents)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Frete</span>
            <span className="font-semibold text-slate-100">{formatPriceBRL(shippingInCents)}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-2xl font-semibold text-slate-100">Total</span>
            <span className="text-4xl font-bold text-[#fb8b24]">{formatPriceBRL(totalInCents)}</span>
          </div>
          <p className="text-xs text-slate-400">{itemsCount} item(ns) no carrinho.</p>
        </div>
      </CardContent>
    </Card>
  );
}
