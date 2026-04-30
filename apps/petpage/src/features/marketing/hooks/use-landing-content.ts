"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLandingContentBundle,
  type LandingProductView,
  type LandingServiceView,
  type LandingTestimonialView,
} from "@/features/marketing/services/landing-content.service";

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
  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "content-bundle"],
    queryFn: getLandingContentBundle,
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
