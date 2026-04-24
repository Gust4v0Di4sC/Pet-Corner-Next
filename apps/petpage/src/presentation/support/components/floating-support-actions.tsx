"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCustomerDeliveryChat } from "@/hooks/support/use-customer-delivery-chat";

const QUICK_ACTIONS = [
  "Onde esta meu pedido?",
  "Como funciona o processo de entrega?",
  "Quero reportar um problema na entrega.",
];

export function FloatingSupportActions() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { isSending, messages, sendMessage } = useCustomerDeliveryChat();
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const shouldHide = useMemo(() => pathname.startsWith("/app-react"), [pathname]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }

    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isChatOpen, messages]);

  if (shouldHide) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = inputValue.trim();
    if (!nextMessage || isSending) {
      return;
    }

    setInputValue("");
    await sendMessage(nextMessage);
  };

  const chatPanel =
    isChatOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[180]">
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              aria-label="Fechar assistente de entrega"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
            />

            <section className="absolute bottom-24 right-5 flex h-[70dvh] w-[min(420px,calc(100vw-1.6rem))] flex-col overflow-hidden rounded-3xl border border-slate-300/70 bg-[#f4f0e6] shadow-[0_30px_68px_-24px_rgba(15,23,42,0.65)] sm:bottom-28 sm:right-6">
              <header className="flex items-center justify-between border-b border-slate-300/80 bg-[#f2f2f3] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Entrega e rastreamento
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">Assistente Pet Corner</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-[#f2f2f3] text-slate-600 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => void sendMessage(action)}
                      disabled={isSending}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:opacity-60"
                    >
                      {action}
                    </button>
                  ))}
                </div>

                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "ml-auto bg-[#fb8b24] text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.meta?.matchedOrder ? (
                      <p className="mt-1 text-xs opacity-90">
                        Pedido {message.meta.matchedOrder.orderCode} -{" "}
                        {message.meta.matchedOrder.statusLabel}
                      </p>
                    ) : null}
                    {message.meta?.issueTicketId ? (
                      <p className="mt-1 text-xs opacity-90">Ticket: {message.meta.issueTicketId}</p>
                    ) : null}
                  </article>
                ))}
              </div>

              <form onSubmit={(event) => void handleSubmit(event)} className="border-t border-slate-300/80 bg-[#f2f2f3] p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Pergunte sobre entrega, status ou problema..."
                    className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/25"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputValue.trim()}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#fb8b24] text-white transition hover:bg-[#ef7e14] disabled:opacity-60"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[170] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <a
          href="https://wa.me/5567999898999?text=Ola%2C%20preciso%20de%20ajuda%20com%20entrega%20ou%20rastreamento."
          target="_blank"
          rel="noreferrer"
          aria-label="Falar no WhatsApp"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500 px-4 text-sm font-semibold text-white shadow-[0_18px_35px_-24px_rgba(16,185,129,0.95)] transition hover:bg-emerald-600"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            WA
          </span>
          WhatsApp
        </a>

        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-[#fb8b24]/70 bg-[#fb8b24] px-4 text-sm font-semibold text-white shadow-[0_18px_35px_-24px_rgba(251,139,36,0.95)] transition hover:bg-[#ef7e14]"
        >
          <MessageCircle className="h-4 w-4" />
          Chat entrega
        </button>
      </div>
      {chatPanel}
    </>
  );
}
