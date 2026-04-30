"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CarTaxiFront,
  Hotel,
  RefreshCw,
  Scissors,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingServiceDetail } from "@/features/marketing/hooks/use-landing-service-detail";
import type { LandingServiceView } from "@/features/marketing/services/landing-content.service";

type ServiceDetailPageProps = {
  serviceId: string;
};

const SERVICE_ICON_MAP: Record<LandingServiceView["iconKey"], LucideIcon> = {
  scissors: Scissors,
  syringe: Syringe,
  taxi: CarTaxiFront,
  hotel: Hotel,
};

export function ServiceDetailPage({ serviceId }: ServiceDetailPageProps) {
  const { isLoading, errorMessage, notFound, service, reload } = useLandingServiceDetail({
    serviceId,
  });

  if (isLoading) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto space-y-4 px-4">
          <Link
            href="/servicos"
            suppressHydrationWarning
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para servicos
          </Link>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-sm">{errorMessage}</p>
            <Button
              type="button"
              onClick={() => void reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !service) {
    return (
      <section className="bg-[#f6f2e8] py-16 md:py-20">
        <div className="container mx-auto space-y-4 px-4">
          <Link
            href="/servicos"
            suppressHydrationWarning
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para servicos
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-slate-600">
            Servico nao encontrado ou indisponivel.
          </div>
        </div>
      </section>
    );
  }

  const Icon = SERVICE_ICON_MAP[service.iconKey] || Scissors;
  const iconClassName = service.iconClassName || "bg-orange-100 text-[#fb8b24]";

  return (
    <section className="bg-[#f6f2e8] py-16 md:py-20">
      <div className="container mx-auto space-y-6 px-4">
        <Link
          href="/servicos"
          suppressHydrationWarning
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#fb8b24]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para servicos
        </Link>

        <article className="grid gap-6 rounded-[2rem] border border-slate-200 bg-[#efefef] p-5 shadow-[0_20px_45px_-35px_rgba(30,41,59,0.7)] md:grid-cols-[0.9fr_1.1fr] md:p-7">
          <div className="flex min-h-[260px] flex-col justify-between rounded-3xl border border-slate-300/70 bg-white/80 p-6">
            <span
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${iconClassName}`}
            >
              <Icon className="h-7 w-7" />
            </span>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                Categoria
              </p>
              <p className="text-2xl font-semibold text-slate-800">{service.category}</p>
            </div>

            <div className="rounded-2xl border border-slate-300/70 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Duracao estimada
              </p>
              <p className="mt-1 text-base font-semibold text-slate-800">{service.duration}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fb8b24]">
                Servico Pet Corner
              </p>
              <h1 className="text-balance text-3xl font-bold text-slate-800 md:text-4xl">
                {service.title}
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                {service.description}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Valor base
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{service.price}</p>
              </div>
              <div className="rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Duracao
                </p>
                <p className="mt-1 font-semibold text-slate-800">{service.duration}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                className="h-11 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
              >
                <a
                  href={`https://wa.me/5567999898999?text=Ola%2C%20quero%20agendar%20${encodeURIComponent(service.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  suppressHydrationWarning
                  className="inline-flex items-center gap-2"
                >
                  Agendar pelo WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#fb8b24] hover:text-[#fb8b24]"
              >
                <Link href="/servicos" suppressHydrationWarning>
                  Ver todos os servicos
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
