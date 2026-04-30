"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Scissors,
  Syringe,
  CarTaxiFront,
  Hotel,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type ServiceItem = {
  id?: string;
  title: string;
  description: string;
  duration: string;
  icon?: LucideIcon;
  iconKey?: "scissors" | "syringe" | "taxi" | "hotel";
  iconClassName?: string;
};

interface ServicesProps {
  items?: ServiceItem[];
}

const AUTOPLAY_MS = 4200;

const defaultServices: ServiceItem[] = [
  {
    title: "Banho & Tosa",
    description:
      "Banho com produtos especificos, corte de unhas e tosa personalizada para cada raca.",
    duration: "Duracao ~ 1h",
    icon: Scissors,
    iconClassName: "bg-orange-100 text-[#fb8b24]",
  },
  {
    title: "Consulta Veterinaria",
    description:
      "Atendimento clinico, diagnostico de doencas e aplicacao de vacinas obrigatorias.",
    duration: "Duracao ~ 1h",
    icon: Syringe,
    iconClassName: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Taxi Pet",
    description:
      "Transporte seguro para levar e buscar seu pet em petshop, clinicas e outros locais.",
    duration: "Duracao ~ 2h",
    icon: CarTaxiFront,
    iconClassName: "bg-amber-100 text-amber-700",
  },
  {
    title: "Hotelzinho",
    description:
      "Diarias com carinho, alimentacao balanceada e rotina de atividades para seu pet.",
    duration: "Duracao ~ 24h",
    icon: Hotel,
    iconClassName: "bg-orange-100 text-[#fb8b24]",
  },
];

const defaultServiceIconMap: Record<NonNullable<ServiceItem["iconKey"]>, LucideIcon> = {
  scissors: Scissors,
  syringe: Syringe,
  taxi: CarTaxiFront,
  hotel: Hotel,
};

const defaultServiceIconClassMap: Record<NonNullable<ServiceItem["iconKey"]>, string> = {
  scissors: "bg-orange-100 text-[#fb8b24]",
  syringe: "bg-emerald-100 text-emerald-600",
  taxi: "bg-amber-100 text-amber-700",
  hotel: "bg-orange-100 text-[#fb8b24]",
};

export function Services({ items }: ServicesProps) {
  const serviceItems = items?.length ? items : defaultServices;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(serviceItems.length > 1);

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
    if (!emblaApi || serviceItems.length < 2) {
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
  }, [emblaApi, serviceItems.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section id="servicos" className="bg-[#f6f2e8] py-20">
      <div className="gridpet">
        <div className="gridpet-content space-y-10">
          <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
                Nossos servicos
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight text-slate-800 md:text-5xl">
                Cuidado em cada detalhe
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600 md:ml-auto md:text-base">
              Profissionais apaixonados por animais oferecendo o melhor para o conforto
              e saude do seu pet.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Servico anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proximo servico"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link
              href="/servicos"
              suppressHydrationWarning
              className="ml-2 text-sm font-semibold text-[#fb8b24] transition hover:text-[#ef7e14]"
            >
              Ver todos -&gt;
            </Link>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-4 flex">
              {serviceItems.map((service, index) => {
                const iconKey = service.iconKey || "scissors";
                const Icon = service.icon || defaultServiceIconMap[iconKey];
                const iconClassName = service.iconClassName || defaultServiceIconClassMap[iconKey];

                return (
                  <div
                    key={service.id || `${service.title}-${index}`}
                    className="min-w-0 flex-[0_0_100%] pl-4 md:flex-[0_0_50%] xl:flex-[0_0_33.3333%] 2xl:flex-[0_0_25%]"
                  >
                    <Card className="relative h-full rounded-3xl border border-slate-200/80 bg-[#efefef] text-slate-800 shadow-[0_16px_35px_-30px_rgba(30,41,59,0.6)]">
                      {service.id ? (
                        <Link
                          href={`/servicos/${service.id}`}
                          suppressHydrationWarning
                          className="absolute inset-0 z-10 rounded-3xl"
                          aria-label={`Ver detalhes de ${service.title}`}
                        />
                      ) : null}

                      <CardContent className="flex h-full flex-col gap-6 p-5">
                        <span
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${iconClassName}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>

                        <div className="flex-1 space-y-2">
                          <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
                          <p className="min-h-20 text-sm leading-relaxed text-slate-600">
                            {service.description}
                          </p>
                        </div>

                        <div className="relative z-20 mt-auto flex items-center justify-between border-t border-slate-300/80 pt-4 text-xs font-medium text-slate-500">
                          <span>{service.duration}</span>
                          <a
                            href={`https://wa.me/5567999898999?text=Ola%2C%20quero%20agendar%20${encodeURIComponent(service.title)}`}
                            target="_blank"
                            rel="noreferrer"
                            suppressHydrationWarning
                            className="inline-flex items-center gap-1 rounded-full bg-[#fb8b24] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#ef7e14]"
                          >
                            Agendar
                            <ArrowRight className="h-3.5 w-3.5" />
                          </a>
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
              <Button
                key={index}
                type="button"
                aria-label={`Ir para servico ${index + 1}`}
                onClick={() => scrollTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  selectedIndex === index ? "w-7 bg-[#fb8b24]" : "w-2.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

