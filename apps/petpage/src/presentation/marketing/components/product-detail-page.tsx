"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingProductDetail } from "@/hooks/marketing/use-landing-product-detail";
import productFallback from "@/assets/fallbackproduct.png";
import { AddToCartButton } from "@/presentation/cart-checkout/components/add-to-cart-button";

type ProductDetailPageProps = {
  productId: string;
};

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const { isLoading, errorMessage, notFound, product, reload } = useLandingProductDetail({
    productId,
  });

  if (isLoading) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="h-[500px] animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto space-y-4 px-4">
          <Link
            href="/produtos"
            suppressHydrationWarning
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para produtos
          </Link>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-sm">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !product) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto space-y-4 px-4">
          <Link
            href="/produtos"
            suppressHydrationWarning
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para produtos
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-slate-600">
            Produto nao encontrado ou indisponivel.
          </div>
        </div>
      </section>
    );
  }

  const safeImage = product.image.trim() || productFallback.src;
  const isFallbackImage = safeImage === productFallback.src;
  const isRemoteImage = /^https?:\/\//i.test(safeImage);
  const stockLabel = product.quantity > 0 ? "Disponivel" : "Sob encomenda";

  return (
    <section className="bg-[#f6f2e8] py-16 md:py-20">
      <div className="container mx-auto space-y-6 px-4">
        <Link
          href="/produtos"
          suppressHydrationWarning
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para produtos
        </Link>

        <article className="grid gap-6 rounded-[2rem] border border-slate-200 bg-[#efefef] p-5 shadow-[0_20px_45px_-35px_rgba(30,41,59,0.7)] md:grid-cols-[1fr_1.05fr] md:p-7">
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-white md:min-h-[460px]">
            <span className="absolute left-4 top-4 z-20 rounded-full bg-[#fb8b24] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              {product.badge}
            </span>
            <Image
              src={safeImage}
              alt={product.title}
              fill
              unoptimized={isRemoteImage}
              sizes="(max-width: 768px) 100vw, 48vw"
              className={
                isFallbackImage
                  ? "object-contain p-6 md:p-8"
                  : "object-cover"
              }
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fb8b24]">
                {product.category}
              </p>
              <h1 className="text-balance text-3xl font-bold text-slate-800 md:text-4xl">
                {product.title}
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                {product.description}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
                  Valor
                </p>
                <p className="text-4xl font-bold text-slate-800">{product.price}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {stockLabel}
              </span>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Codigo
                </p>
                <p className="mt-1 font-semibold text-slate-800">{product.code || "n/d"}</p>
              </div>
              <div className="rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Estoque
                </p>
                <p className="mt-1 font-semibold text-slate-800">{product.quantity} unidade(s)</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <AddToCartButton
                productId={product.id}
                title={product.title}
                category={product.category}
                imageUrl={safeImage}
                priceLabel={product.price}
                label="Comprar agora"
                className="h-11 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
              />
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#fb8b24] hover:text-[#fb8b24]"
              >
                <Link href="/produtos" suppressHydrationWarning>
                  Ver todos os produtos
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
