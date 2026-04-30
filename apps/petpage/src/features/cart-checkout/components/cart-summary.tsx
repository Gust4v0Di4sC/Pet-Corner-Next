"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import fallbackProduct from "@/assets/fallbackproduct.png";
import { useCustomerCart } from "@/features/cart-checkout/hooks/use-customer-cart";
import { getCartItemsCount } from "@/features/cart-checkout/services/customer-cart.service";
import { formatPriceBRL } from "@/lib/formatters/price";

type CartSummaryProps = {
  customerId?: string;
  isAuthenticated: boolean;
};

const ITEMS_PER_PAGE = 6;

function CartSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

export function CartSummary({ customerId, isAuthenticated }: CartSummaryProps) {
  const { isLoading, isMutating, errorMessage, cart, reload, updateQuantity, removeItem, clearAll } =
    useCustomerCart({
      customerId,
    });
  const [currentPage, setCurrentPage] = useState(1);

  const hasItems = cart.items.length > 0;
  const itemsCount = getCartItemsCount(cart);
  const totalPages = Math.max(Math.ceil(cart.items.length / ITEMS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const visibleItems = useMemo(
    () => cart.items.slice(pageStartIndex, pageStartIndex + ITEMS_PER_PAGE),
    [cart.items, pageStartIndex]
  );

  return (
    <Card className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="space-y-3 border-b border-slate-700/80 pb-5">
        <div className="space-y-1">
          <CardTitle className="text-4xl font-bold text-slate-100">Resumo do carrinho</CardTitle>
          <CardDescription className="text-sm text-slate-300">
            Revise seus itens antes de concluir o pedido.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{itemsCount} item(ns)</span>
          {hasItems ? <span aria-hidden="true">|</span> : null}
          {hasItems ? (
            <span>
              Pagina {safeCurrentPage} de {totalPages}
            </span>
          ) : null}
          <span aria-hidden="true">|</span>
          <Button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1 font-semibold text-[#fb8b24] transition hover:text-[#e36414]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <CartSkeleton />
        ) : !hasItems ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-8 text-center">
            <p className="text-base font-medium text-slate-100">Seu carrinho esta vazio.</p>
            <p className="text-sm text-slate-400">Adicione produtos para continuar.</p>
            <Button
              asChild
              className="h-10 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
            >
              <Link href="/#produtos" suppressHydrationWarning>
                Ir para produtos
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {visibleItems.map((item) => {
                const imageUrl = item.imageUrl?.trim() || fallbackProduct.src;
                const lineTotal = item.unitPriceInCents * item.quantity;

                return (
                  <li
                    key={item.productId}
                    className="grid gap-4 rounded-2xl border border-slate-700 bg-[#111b2b] p-4 md:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        unoptimized={/^https?:\/\//i.test(imageUrl)}
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-400">
                        {item.category || "Produto"} | {formatPriceBRL(item.unitPriceInCents)}
                      </p>
                      <p className="text-sm font-semibold text-slate-100">
                        Total: {formatPriceBRL(lineTotal)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 md:flex-col md:items-end">
                      <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 p-1">
                        <Button
                          type="button"
                          onClick={() => void updateQuantity(item.productId, item.quantity - 1)}
                          disabled={isMutating}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Diminuir quantidade de ${item.title}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-semibold text-slate-100">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          onClick={() => void updateQuantity(item.productId, item.quantity + 1)}
                          disabled={isMutating}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Aumentar quantidade de ${item.title}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        onClick={() => void removeItem(item.productId)}
                        disabled={isMutating}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-3">
              <p className="text-sm text-slate-300">
                Exibindo {visibleItems.length} item(ns) nesta pagina
              </p>

              <div className="inline-flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-9 rounded-full border-slate-600 bg-transparent px-4 text-xs font-semibold text-slate-200 hover:border-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(safeCurrentPage + 1, totalPages))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-9 rounded-full border-slate-600 bg-transparent px-4 text-xs font-semibold text-slate-200 hover:border-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proxima
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-400">Subtotal</p>
                <p className="text-2xl font-bold text-slate-100">
                  {formatPriceBRL(cart.subtotalInCents)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void clearAll()}
                  variant="outline"
                  disabled={isMutating}
                  className="h-10 rounded-full border-slate-600 bg-transparent px-4 text-sm font-semibold text-slate-200 hover:border-red-400 hover:text-red-300"
                >
                  Limpar carrinho
                </Button>

                {isAuthenticated ? (
                  <Button
                    asChild
                    className="h-10 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
                  >
                    <Link href="/checkout" suppressHydrationWarning>
                      Ir para checkout
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="h-10 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
                  >
                    <Link href="/login?next=/checkout" suppressHydrationWarning>
                      Entrar para finalizar
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
