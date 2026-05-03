"use client";

import { useLandingContent } from "@/features/marketing/hooks/use-landing-content";
import { Products } from "@/features/marketing/components/products";
import { Services } from "@/features/marketing/components/services";
import { Testimonials } from "@/features/marketing/components/testimonials";

export function LandingLiveContent() {
  const { products, services } = useLandingContent();

  return (
    <>
      <Services items={services} />
      <Products items={products} />
    </>
  );
}

export function LandingLiveTestimonials() {
  const { testimonials, errorMessage } = useLandingContent();

  return (
    <>
      <Testimonials items={testimonials} />
      {errorMessage ? (
        <p className="px-4 py-2 text-center text-xs text-slate-500">
          Alguns dados dinamicos da landing nao puderam ser carregados agora.
        </p>
      ) : null}
    </>
  );
}
