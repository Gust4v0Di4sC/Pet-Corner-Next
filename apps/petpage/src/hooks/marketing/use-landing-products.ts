"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listLandingProducts,
  type LandingProductView,
} from "@/services/marketing/landing-content.service";

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os produtos agora.";
}

export function useLandingProducts() {
  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "products"],
    queryFn: async () => listLandingProducts(),
    staleTime: 45_000,
  });

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const products: LandingProductView[] = data || [];
  const errorMessage = error ? mapErrorMessage(error) : null;

  return {
    isLoading,
    errorMessage,
    products,
    reload,
  };
}
