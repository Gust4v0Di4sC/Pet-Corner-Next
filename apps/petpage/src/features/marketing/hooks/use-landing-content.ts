"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLandingContentBundle,
  type LandingContentBundle,
  type LandingProductView,
  type LandingServiceView,
  type LandingTestimonialView,
} from "@/features/marketing/services/landing-content.service";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

type LandingContentState = {
  products: LandingProductView[];
  services: LandingServiceView[];
  testimonials: LandingTestimonialView[];
};

function mapErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar as informacoes da pagina agora.");
}

export function useLandingContent(initialContent?: LandingContentBundle) {
  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "content-bundle"],
    queryFn: getLandingContentBundle,
    initialData: initialContent,
    staleTime: 45_000,
  });

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const contentState: LandingContentState = data || {
    products: [],
    services: [],
    testimonials: [],
  };
  const errorMessage = error ? mapErrorMessage(error) : null;

  return {
    isLoading,
    errorMessage,
    products: contentState.products,
    services: contentState.services,
    testimonials: contentState.testimonials,
    reload,
  };
}
