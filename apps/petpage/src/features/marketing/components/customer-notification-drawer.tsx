"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Circle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useCustomerNotifications } from "@/features/notifications/hooks/use-customer-notifications";

type CustomerNotificationDrawerProps = {
  customerId: string;
};

function formatNotificationDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function CustomerNotificationDrawer({ customerId }: CustomerNotificationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedCustomerId = useMemo(() => customerId.trim(), [customerId]);
  const { isLoading, errorMessage, notifications, unreadCount, markAsRead, markAllAsRead } =
    useCustomerNotifications({
      customerId: normalizedCustomerId,
    });

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

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
    <div className="fixed inset-0 z-[120] pointer-events-auto">
      <Button
        type="button"
        tabIndex={0}
        onClick={closeDrawer}
        aria-label="Fechar painel de notificacoes"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-200 opacity-100"
      />

      <aside
        id="customer-notifications-panel"
        aria-label="Notificacoes"
        className="absolute right-0 top-0 isolate h-full w-full max-w-[440px] overflow-hidden border-l border-slate-300/70 bg-[#f4f0e6] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.55)] transition-transform duration-300 translate-x-0"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(251,139,36,0.09),transparent_170px)]" />
        <div className="pointer-events-none absolute -left-16 bottom-8 h-44 w-44 rounded-full bg-[#fb8b24]/25 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-300/80 bg-[#f2f2f3] px-6 py-5">
            <div className="space-y-0.5">
              <h2 className="text-3xl font-semibold leading-none text-slate-900">Notificacoes</h2>
              <p className="text-sm text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} nao lida${unreadCount > 1 ? "s" : ""}`
                  : "Voce esta em dia"}
              </p>
            </div>
            <Button
              type="button"
              onClick={closeDrawer}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-[#f2f2f3] text-slate-500 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
              aria-label="Fechar painel"
            >
              <X className="h-6 w-6" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Central do cliente
              </p>
              <Button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={!unreadCount}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </Button>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`customer-notification-loading-${index}`}
                    className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white/70"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center">
                <p className="text-sm font-medium text-slate-700">Sem notificacoes por enquanto.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Novidades sobre carrinho, perfil e pedidos aparecerao aqui.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <article
                      className={`rounded-2xl border p-4 transition ${
                        notification.isRead
                          ? "border-slate-300/90 bg-white/80"
                          : "border-[#fb8b24]/45 bg-[#fff8f1]"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                        {!notification.isRead ? (
                          <Circle className="h-3.5 w-3.5 shrink-0 fill-[#fb8b24] text-[#fb8b24]" />
                        ) : null}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{notification.message}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                          {formatNotificationDate(notification.createdAtIso)}
                        </p>
                        <div className="flex items-center gap-2">
                          {notification.linkHref ? (
                            <Link
                              href={notification.linkHref}
                              onClick={closeDrawer}
                              className="text-xs font-semibold text-[#fb8b24] transition hover:text-[#ef7e14]"
                            >
                              Ver detalhes
                            </Link>
                          ) : null}
                          {!notification.isRead ? (
                            <Button
                              type="button"
                              onClick={() => void markAsRead(notification.id)}
                              className="text-xs font-semibold text-slate-600 transition hover:text-[#fb8b24]"
                            >
                              Marcar como lida
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="customer-notifications-panel"
        aria-label="Abrir notificacoes"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#fb8b24] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>
      {isOpen && typeof document !== "undefined" ? createPortal(drawerPanel, document.body) : null}
    </>
  );
}
