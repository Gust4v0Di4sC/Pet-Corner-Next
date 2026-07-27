"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listLandingProducts,
  type LandingProductView,
} from "@/features/marketing/services/landing-content.service";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

function mapErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar os produtos agora.");
}

export function useLandingProducts(initialProducts?: LandingProductView[]) {
  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "products"],
    queryFn: async () => listLandingProducts(),
    initialData: initialProducts,
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
