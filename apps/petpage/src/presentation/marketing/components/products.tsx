"use client";

import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import product1 from "@/assets/Product1.png";
import product2 from "@/assets/Product2.png";
import product3 from "@/assets/Product3.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type ProductItem = {
  id?: string;
  category: string;
  title: string;
  description: string;
  price: string;
  image: StaticImageData | string;
  badge: string;
};

interface ProductsProps {
  items?: ProductItem[];
}

const AUTOPLAY_MS = 4600;

const defaultProducts: ProductItem[] = [
  {
    category: "Higiene",
    title: "Kit Shampoo & Hidratante",
    description: "Cuidado completo para o pelo do seu pet. Fragrancia suave e duradoura.",
    price: "R$ 18,90",
    image: product1,
    badge: "Mais vendido",
  },
  {
    category: "Acessorios",
    title: "Pote de Racao Inox",
    description: "Resistente, antiderrapante e facil de higienizar. Ideal para caes e gatos.",
    price: "R$ 25,90",
    image: product2,
    badge: "Novo",
  },
  {
    category: "Alimentacao",
    title: "Racao Premium Gatos Filhotes",
    description: "Nutricao completa para gatinhos em crescimento. Pacote de 1kg.",
    price: "R$ 38,90",
    image: product3,
    badge: "Novo",
  },
];

export function Products({ items }: ProductsProps) {
  const productItems = items?.length ? items : defaultProducts;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(productItems.length > 1);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const handleSelect = () => syncCarouselState();

    emblaApi.on("select", handleSelect);
    emblaApi.on("reInit", handleSelect);
    emblaApi.emit("select");

    return () => {
      emblaApi.off("select", handleSelect);
      emblaApi.off("reInit", handleSelect);
    };
  }, [emblaApi, syncCarouselState]);

  useEffect(() => {
    if (!emblaApi || productItems.length < 2) {
      return;
    }

    const autoplay = window.setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(autoplay);
    };
  }, [emblaApi, productItems.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section id="produtos" className="bg-[#f6f2e8] py-20">
      <div className="container mx-auto space-y-10 px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
              Loja
            </p>
            <h2 className="text-balance text-4xl font-bold text-slate-800 md:text-5xl">
              Produtos selecionados
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Produto anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proximo produto"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/cart"
              suppressHydrationWarning
              className="ml-2 text-sm font-semibold text-[#fb8b24] transition hover:text-[#ef7e14]"
            >
              Ver tudo -&gt;
            </Link>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {productItems.map((product, index) => {
              const normalizedImage =
                typeof product.image === "string" ? product.image.trim() : product.image;
              const safeImage = normalizedImage || product1;
              const isRemoteImage =
                typeof safeImage === "string" && /^https?:\/\//i.test(safeImage);

              return (
                <div
                  key={product.id || `${product.title}-${index}`}
                  className="min-w-0 flex-[0_0_100%] pl-5 md:flex-[0_0_50%] xl:flex-[0_0_33.3333%]"
                >
                  <Card className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-[#efefef] shadow-[0_18px_35px_-30px_rgba(30,41,59,0.65)]">
                    <div className="relative h-72 w-full overflow-hidden bg-white">
                      <span className="absolute left-4 top-4 z-10 rounded-full bg-[#fb8b24] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                        {product.badge}
                      </span>
                      <Image
                        src={safeImage}
                        alt={product.title}
                        fill
                        unoptimized={isRemoteImage}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
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

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <span className="text-3xl font-bold text-slate-800">{product.price}</span>

                        <Button
                          asChild
                          className="h-10 rounded-full bg-[#fb8b24] px-4 text-sm font-semibold text-white hover:bg-[#ef7e14]"
                        >
                          <Link
                            href="/cart"
                            suppressHydrationWarning
                            className="inline-flex items-center gap-2"
                          >
                            <ShoppingCartSimple className="h-4 w-4" />
                            Comprar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para produto ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                selectedIndex === index ? "w-7 bg-[#fb8b24]" : "w-2.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

