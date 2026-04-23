"use client";

import Link from "next/link";
import {
  ArrowRight,
  CarTaxiFront,
  Hotel,
  RefreshCw,
  Scissors,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLandingServices } from "@/hooks/marketing/use-landing-services";
import type { LandingServiceView } from "@/services/marketing/landing-content.service";

const SERVICE_ICON_MAP: Record<LandingServiceView["iconKey"], LucideIcon> = {
  scissors: Scissors,
  syringe: Syringe,
  taxi: CarTaxiFront,
  hotel: Hotel,
};

function ServiceCatalogCard({ service }: { service: LandingServiceView }) {
  const Icon = SERVICE_ICON_MAP[service.iconKey] || Scissors;
  const iconClassName = service.iconClassName || "bg-orange-100 text-[#fb8b24]";

  return (
    <Card className="relative h-full rounded-3xl border border-slate-200/80 bg-[#efefef] text-slate-800 shadow-[0_16px_35px_-30px_rgba(30,41,59,0.6)]">
      {service.id ? (
        <Link
          href={`/servicos/${service.id}`}
          suppressHydrationWarning
          className="absolute inset-0 z-10 rounded-3xl"
          aria-label={`Ver detalhes de ${service.title}`}
        />
      ) : null}

      <CardContent className="flex h-full flex-col gap-5 p-5">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {service.category || "Servico"}
          </p>
          <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
          <p className="min-h-20 text-sm leading-relaxed text-slate-600">{service.description}</p>
        </div>

        <div className="space-y-1 rounded-2xl border border-slate-300/70 bg-white/80 p-3 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-700">Duracao:</span> {service.duration}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Valor base:</span> {service.price}
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
  );
}

export function ServicesCatalogPage() {
  const { isLoading, errorMessage, services, reload } = useLandingServices();

  return (
    <section className="bg-[#f6f2e8] py-16 md:py-20">
      <div className="container mx-auto space-y-8 px-4">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
            Nossos servicos
          </p>
          <h1 className="text-balance text-4xl font-bold text-slate-800 md:text-5xl">
            Todos os servicos
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Conheca todas as opcoes de cuidado para o seu pet.
          </p>
        </header>

        {errorMessage ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1.5 font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[340px] animate-pulse rounded-3xl border border-slate-200 bg-white/70"
              />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-600">
            Nenhum servico ativo encontrado no momento.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCatalogCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
