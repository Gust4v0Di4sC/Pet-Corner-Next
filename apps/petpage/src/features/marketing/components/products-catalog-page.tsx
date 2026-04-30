"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLandingProducts } from "@/features/marketing/hooks/use-landing-products";
import type { LandingProductView } from "@/features/marketing/services/landing-content.service";
import productFallback from "@/assets/fallbackproduct.png";
import { AddToCartButton } from "@/features/cart-checkout/components/add-to-cart-button";

function ProductCatalogCard({ product }: { product: LandingProductView }) {
  const normalizedImage = product.image.trim();
  const safeImage = normalizedImage || productFallback.src;
  const isFallbackImage = safeImage === productFallback.src;
  const isRemoteImage = /^https?:\/\//i.test(safeImage);

  return (
    <div className="h-full">
      <Card className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-[#efefef] shadow-[0_18px_35px_-30px_rgba(30,41,59,0.65)]">
        {product.id ? (
          <Link
            href={`/produtos/${product.id}`}
            suppressHydrationWarning
            className="absolute inset-0 z-10 rounded-3xl"
            aria-label={`Ver detalhes de ${product.title}`}
          />
        ) : null}

        <div className="relative h-72 w-full overflow-hidden bg-white">
          <span className="absolute left-4 top-4 z-20 rounded-full bg-[#fb8b24] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            {product.badge}
          </span>
          <Image
            src={safeImage}
            alt={product.title}
            fill
            unoptimized={isRemoteImage}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className={
              isFallbackImage
                ? "object-contain p-4 md:p-6"
                : "object-cover"
            }
          />
        </div>

        <CardContent className="flex h-[calc(100%-18rem)] flex-col gap-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {product.category}
            </p>
            <h3 className="text-xl font-bold text-slate-800">{product.title}</h3>
            <p className="text-sm text-slate-600">{product.description}</p>
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-300/80 pt-4 text-xs text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Codigo:</span>{" "}
              {product.code || "n/d"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Estoque:</span>{" "}
              {product.quantity} unidade(s)
            </p>
          </div>

          <div className="relative z-20 mt-auto flex items-center justify-between gap-3">
            <span className="text-3xl font-bold text-slate-800">{product.price}</span>

            <AddToCartButton
              productId={product.id}
              title={product.title}
              category={product.category}
              imageUrl={safeImage}
              priceLabel={product.price}
              label="Comprar"
              className="h-10 rounded-full bg-[#fb8b24] px-4 text-sm font-semibold text-white hover:bg-[#ef7e14]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductsCatalogPage() {
  const { isLoading, errorMessage, products, reload } = useLandingProducts();

  return (
    <section className="bg-[#f6f2e8] py-16 md:py-20">
      <div className="container mx-auto space-y-8 px-4">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">Loja</p>
          <h1 className="text-balance text-4xl font-bold text-slate-800 md:text-5xl">
            Todos os produtos
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Explore o catalogo completo de produtos para o seu pet.
          </p>
        </header>

        {errorMessage ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{errorMessage}</span>
            <Button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1.5 font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-3xl border border-slate-200 bg-white/70"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-600">
            Nenhum produto ativo encontrado no momento.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCatalogCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
