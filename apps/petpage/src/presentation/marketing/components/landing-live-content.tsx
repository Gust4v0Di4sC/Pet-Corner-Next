"use client";

import { useLandingContent } from "@/hooks/marketing/use-landing-content";
import { Brands } from "@/presentation/marketing/components/brands";
import { Products } from "@/presentation/marketing/components/products";
import { Services } from "@/presentation/marketing/components/services";
import { Testimonials } from "@/presentation/marketing/components/testimonials";

export function LandingLiveContent() {
  const { products, services, testimonials, errorMessage } = useLandingContent();

  return (
    <>
      <Services items={services} />
      <Products items={products} />
      <Brands />
      <Testimonials items={testimonials} />
      {errorMessage ? (
        <p className="px-4 py-2 text-center text-xs text-slate-500">
          Alguns dados dinamicos da landing nao puderam ser carregados agora.
        </p>
      ) : null}
    </>
  );
}
