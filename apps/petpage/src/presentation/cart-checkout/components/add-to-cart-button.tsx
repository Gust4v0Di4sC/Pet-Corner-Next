"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import { CheckCircle2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { addProductToCart } from "@/services/cart-checkout/customer-cart.service";
import fallbackProduct from "@/assets/fallbackproduct.png";

type AddToCartButtonProps = {
  productId?: string;
  title: string;
  category?: string;
  imageUrl?: string;
  priceLabel: string;
  quantity?: number;
  className?: string;
  label?: string;
  successBehavior?: "redirect" | "popup";
  popupDurationMs?: number;
};

export function AddToCartButton({
  productId,
  title,
  category,
  imageUrl,
  priceLabel,
  quantity,
  className,
  label = "Comprar",
  successBehavior = "redirect",
  popupDurationMs = 5000,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!isPopupOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPopupOpen(false);
    }, Math.max(100, popupDurationMs));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPopupOpen, popupDurationMs]);

  const handleClick = async () => {
    if (isAdding) {
      return;
    }

    setIsAdding(true);

    try {
      await addProductToCart({
        productId,
        title,
        category,
        imageUrl,
        priceLabel,
        quantity,
      });

      if (successBehavior === "popup") {
        setIsPopupOpen(true);
        router.refresh();
        return;
      }

      router.push("/cart");
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  };

  const popupContent =
    isPopupOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/50 px-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_28px_55px_-28px_rgba(15,23,42,0.65)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">Produto adicionado ao carrinho</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                  aria-label="Fechar popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5 grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <Image
                    src={imageUrl || fallbackProduct}
                    alt={title}
                    fill
                    unoptimized={Boolean(imageUrl && /^https?:\/\//i.test(imageUrl))}
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{category || "Produto"}</p>
                  <p className="mt-1 text-sm font-semibold text-[#fb8b24]">{priceLabel}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPopupOpen(false)}
                  className="h-10 rounded-full border-slate-300 px-4 text-sm font-semibold text-slate-700"
                >
                  Continuar comprando
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsPopupOpen(false);
                    router.push("/cart");
                    router.refresh();
                  }}
                  className="h-10 rounded-full bg-[#fb8b24] px-4 text-sm font-semibold text-white hover:bg-[#ef7e14]"
                >
                  Ver carrinho
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Button
        type="button"
        onClick={() => void handleClick()}
        disabled={isAdding}
        className={className}
      >
        <span className="inline-flex items-center gap-2">
          <ShoppingCartSimple className="h-4 w-4" />
          {isAdding ? "Adicionando..." : label}
        </span>
      </Button>

      {popupContent}
    </>
  );
}
