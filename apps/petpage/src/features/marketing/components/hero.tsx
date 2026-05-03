"use client";

import Image from "next/image";
import { PawPrint, ArrowRight, Star } from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import herodog from "@/assets/hero-dog.webp";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-slate-900/5 bg-[#f6f2e8]"
    >
      <div className="pointer-events-none absolute inset-0 animate-hero-pulse bg-[radial-gradient(circle_at_85%_95%,rgba(65,165,115,0.22),transparent_32%),radial-gradient(circle_at_20%_0%,rgba(251,139,36,0.14),transparent_35%)]" />

      <div className="gridpet">
        <div className="gridpet-content relative grid gap-14 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
          <article className="space-y-7">
          <span
            data-aos="fade-down"
            suppressHydrationWarning
            className="animate-hero-fade-up inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700"
          >
            <PawPrint className="h-3.5 w-3.5" />
            5% off na primeira compra
          </span>

          <div
            data-aos="fade-right"
            data-aos-delay="140"
            suppressHydrationWarning
            className="animate-hero-fade-up animate-hero-delay-1 space-y-4"
          >
            <h1 className="text-balance text-4xl font-bold leading-[1.04] text-slate-800 md:text-6xl">
              Seu pet merece
              <br />
              <span className="text-[#fb8b24]">o melhor</span>
              <PawPrint className="ml-3 inline-block h-8 w-8 text-[#5c4a7a] md:h-10 md:w-10" />
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              Cada rabo abanando e um sorriso para nos. Cuidamos com amor do seu fiel
              amigo, oferecendo o melhor em produtos e atendimento.
            </p>
          </div>

          <div
            data-aos="fade-up"
            data-aos-delay="240"
            suppressHydrationWarning
            className="animate-hero-fade-up animate-hero-delay-2 flex flex-wrap items-center gap-3"
          >
            <Button
              asChild
              className="animate-hero-cta h-11 rounded-full bg-[#fb8b24] px-6 text-sm font-semibold text-white hover:bg-[#ef7e14]"
            >
              <a
                href="#produtos"
                suppressHydrationWarning
                className="inline-flex items-center gap-2"
              >
                Ver produtos
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-0 bg-emerald-500 px-6 text-sm font-semibold text-white hover:bg-emerald-600 hover:text-white"
            >
              <a
                href="https://wa.me/5567999898999?text=Ola%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informacoes"
                target="_blank"
                rel="noreferrer"
                suppressHydrationWarning
                className="inline-flex items-center gap-2"
              >
                <WhatsappLogo className="h-4 w-4" />
                Contato via WhatsApp
              </a>
            </Button>
          </div>

          <div
            data-aos="fade-up"
            data-aos-delay="340"
            suppressHydrationWarning
            className="animate-hero-fade-up animate-hero-delay-3 grid max-w-md grid-cols-3 gap-6 pt-2"
          >
            <div>
              <p className="text-3xl font-bold text-slate-800">10k+</p>
              <p className="text-xs text-slate-500">Pets felizes</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-1 text-3xl font-bold text-slate-800">
                4.9
                <Star className="h-4 w-4 fill-[#fb8b24] text-[#fb8b24]" />
              </p>
              <p className="text-xs text-slate-500">Avaliacao</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">8 anos</p>
              <p className="text-xs text-slate-500">de historia</p>
            </div>
          </div>
          </article>

          <div
            data-aos="zoom-in"
            data-aos-delay="200"
            suppressHydrationWarning
            className="animate-hero-fade-up animate-hero-delay-2 relative mx-auto w-full max-w-[540px]"
          >
            <div className="relative overflow-hidden rounded-[2.2rem] border-[5px] border-[#f29d2d] bg-[#f7f1e6] shadow-[0_30px_55px_-35px_rgba(30,41,59,0.55)]">
              <div className="animate-hero-float relative mx-auto aspect-[1/1] w-[88%] max-w-[460px]">
                <Image
                  src={herodog}
                  alt="Cachorro sorrindo"
                  fill
                  sizes="(max-width: 768px) 88vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div
              className="animate-hero-float absolute left-0 top-10 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg md:-left-9"
              style={{ animationDelay: "180ms" }}
            >
              frete gratis
              <br />
              <span className="text-sm text-slate-800">acima de R$ 99</span>
            </div>

            <div
              className="animate-hero-float absolute bottom-10 right-0 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg md:-right-10"
              style={{ animationDelay: "520ms" }}
            >
              entrega em
              <br />
              <span className="text-sm text-emerald-600">24h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

