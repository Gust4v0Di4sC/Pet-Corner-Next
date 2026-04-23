"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import { RefreshCw, X } from "lucide-react";
import { createPortal } from "react-dom";
import fallbackProduct from "@/assets/fallbackproduct.png";
import { Button } from "@/components/ui/button";
import { useCustomerCart } from "@/hooks/cart-checkout/use-customer-cart";
import { getCartItemsCount } from "@/services/cart-checkout/customer-cart.service";
import { formatPriceBRL } from "@/utils/catalog/price";

type CartPanelDrawerProps = {
  customerId: string;
};

export function CartPanelDrawer({ customerId }: CartPanelDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, errorMessage, cart, reload } = useCustomerCart({
    customerId,
  });

  const itemsCount = useMemo(() => getCartItemsCount(cart), [cart]);
  const previewItems = useMemo(() => cart.items.slice(0, 4), [cart.items]);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeDrawer, isOpen]);

  const drawerPanel = (
    <div className="pointer-events-auto fixed inset-0 z-[120]">
      <button
        type="button"
        tabIndex={0}
        onClick={closeDrawer}
        aria-label="Fechar carrinho rapido"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-200 opacity-100"
      />

      <aside
        id="customer-cart-panel"
        aria-label="Carrinho rapido"
        className="absolute right-0 top-0 isolate h-full w-full max-w-[430px] overflow-hidden border-l border-slate-300/70 bg-[#f4f0e6] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.55)] transition-transform duration-300 translate-x-0"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(251,139,36,0.09),transparent_170px)]" />
        <div className="pointer-events-none absolute -left-16 bottom-8 h-44 w-44 rounded-full bg-[#fb8b24]/25 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-300/80 bg-[#f2f2f3] px-6 py-5">
            <div className="space-y-0.5">
              <h2 className="text-3xl font-semibold leading-none text-slate-900">Meu carrinho</h2>
              <p className="text-sm text-slate-500">{itemsCount} item(ns)</p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-[#f2f2f3] text-slate-500 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
              aria-label="Fechar painel"
            >
              <X className="h-6 w-6" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#fb8b24] transition hover:text-[#e36414]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white/60"
                  />
                ))}
              </div>
            ) : previewItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center">
                <p className="text-sm font-medium text-slate-700">Seu carrinho esta vazio.</p>
                <p className="mt-1 text-xs text-slate-500">Adicione produtos na landing.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {previewItems.map((item) => {
                  const imageUrl = item.imageUrl?.trim() || fallbackProduct.src;

                  return (
                    <li
                      key={item.productId}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-300/90 bg-[#f7f6f2] p-3"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          unoptimized={/^https?:\/\//i.test(imageUrl)}
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">Qtd: {item.quantity}</p>
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {formatPriceBRL(item.unitPriceInCents * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="space-y-3 border-t border-slate-300/80 px-6 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Subtotal</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatPriceBRL(cart.subtotalInCents)}
              </p>
            </div>

            <Button
              asChild
              className="h-11 w-full rounded-full bg-[#fb8b24] text-base font-semibold text-white hover:bg-[#ef7e14]"
            >
              <Link href="/cart" onClick={closeDrawer} suppressHydrationWarning>
                Ir para carrinho
              </Link>
            </Button>
          </footer>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="customer-cart-panel"
        aria-label="Abrir carrinho rapido"
        className="inline-flex items-center gap-2 rounded-full bg-[#fb8b24] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(251,139,36,0.9)] transition hover:bg-[#ef7e14]"
      >
        <ShoppingCartSimple className="h-4 w-4" />
        Carrinho
      </button>
      {isOpen && typeof document !== "undefined" ? createPortal(drawerPanel, document.body) : null}
    </>
  );
}
