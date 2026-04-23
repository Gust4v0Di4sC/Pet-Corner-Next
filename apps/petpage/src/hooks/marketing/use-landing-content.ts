"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLandingContentBundle,
  type LandingProductView,
  type LandingServiceView,
  type LandingTestimonialView,
} from "@/services/marketing/landing-content.service";

type LandingContentState = {
  products: LandingProductView[];
  services: LandingServiceView[];
  testimonials: LandingTestimonialView[];
};

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os dados da landing.";
}

export function useLandingContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contentState, setContentState] = useState<LandingContentState>({
    products: [],
    services: [],
    testimonials: [],
  });

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const dataBundle = await getLandingContentBundle();
      setContentState({
        products: dataBundle.products,
        services: dataBundle.services,
        testimonials: dataBundle.testimonials,
      });
    } catch (error) {
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void reload();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reload]);

  return {
    isLoading,
    errorMessage,
    products: contentState.products,
    services: contentState.services,
    testimonials: contentState.testimonials,
    reload,
  };
}
