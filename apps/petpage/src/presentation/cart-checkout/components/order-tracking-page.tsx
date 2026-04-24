"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerOrderTracking } from "@/hooks/cart-checkout/use-customer-order-tracking";
import { formatPriceBRL } from "@/utils/catalog/price";

type OrderTrackingPageProps = {
  customerId: string;
};

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function OrderTrackingPage({ customerId }: OrderTrackingPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { isLoading, errorMessage, orders, reload } = useCustomerOrderTracking({
    customerId,
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOrders = useMemo(() => {
    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.orderCode.toLowerCase().includes(normalizedSearch) ||
        order.orderId.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch, orders]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">Rastreamento</h1>
        <p className="text-lg text-amber-100/80 md:text-2xl">
          Acompanhe seus pedidos e o andamento da entrega.
        </p>
      </header>

      <div className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por codigo PED ou ID do pedido"
              className="h-11 w-full rounded-full border border-slate-700 bg-slate-900/70 px-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/30"
            />
          </div>

          <Button
            type="button"
            onClick={() => void reload()}
            className="h-11 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
          >
            Atualizar
          </Button>

          <a
            href="https://wa.me/5567999898999?text=Ola%2C%20preciso%20de%20ajuda%20com%20a%20entrega%20do%20meu%20pedido."
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-full border border-slate-600 px-5 text-sm font-semibold text-slate-200 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-300/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-100">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`tracking-loading-${index}`}
              className="h-56 animate-pulse rounded-[2rem] border border-slate-700 bg-[#111b2b]"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-700 bg-[#0f1722] p-8 text-center">
          <p className="text-lg font-medium text-slate-100">Nenhum pedido encontrado.</p>
          <p className="mt-1 text-sm text-slate-400">
            Tente outro codigo ou volte para produtos para criar um pedido.
          </p>
          <Button
            asChild
            className="mt-4 h-10 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
          >
            <Link href="/#produtos" suppressHydrationWarning>
              Ir para produtos
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <article
              key={order.orderId}
              className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
            >
              <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#fb8b24]">
                    {order.orderCode}
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-100">{order.statusLabel}</h2>
                  <p className="text-xs text-slate-400">
                    Atualizado em {formatDate(order.updatedAtIso)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-3xl font-bold text-[#fb8b24]">
                    {formatPriceBRL(order.totalInCents)}
                  </p>
                </div>
              </header>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
                    <p className="text-sm font-semibold text-slate-100">Resumo da entrega</p>
                    <p className="mt-1 text-sm text-slate-300">{order.statusDescription}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      Destino: {order.delivery.street}, {order.delivery.number} -{" "}
                      {order.delivery.district} - {order.delivery.city}/{order.delivery.state}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-100">Itens</p>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={`${order.orderId}-${item.productId}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-slate-200">
                            {item.title} <span className="text-slate-400">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-slate-100">
                            {formatPriceBRL(item.unitPriceInCents * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Truck className="h-4 w-4 text-[#fb8b24]" />
                    Timeline
                  </p>
                  <ul className="space-y-3">
                    {order.statusTimeline.map((event, index) => (
                      <li key={`${order.orderId}-${event.createdAtIso}-${index}`} className="grid grid-cols-[auto_1fr] gap-3">
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#fb8b24]" />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{event.label}</p>
                          <p className="text-xs text-slate-400">{event.description}</p>
                          <p className="text-[11px] text-slate-500">{formatDate(event.createdAtIso)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
