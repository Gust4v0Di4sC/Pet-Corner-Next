"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLandingProductById,
  type LandingProductView,
} from "@/features/marketing/services/landing-content.service";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

function mapErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar os detalhes do produto agora.");
}

type UseLandingProductDetailOptions = {
  productId: string;
  initialProduct?: LandingProductView | null;
};

export function useLandingProductDetail(options: UseLandingProductDetailOptions) {
  const normalizedProductId = useMemo(() => options.productId.trim(), [options.productId]);
  const hasValidProductId = Boolean(normalizedProductId);

  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "product-detail", normalizedProductId],
    queryFn: async () => getLandingProductById(normalizedProductId),
    enabled: hasValidProductId,
    initialData: options.initialProduct,
    staleTime: 45_000,
  });

  const reload = useCallback(async () => {
    if (!hasValidProductId) {
      return;
    }

    await refetch();
  }, [hasValidProductId, refetch]);

  const product: LandingProductView | null = data || null;
  const errorMessage = error ? mapErrorMessage(error) : null;
  const notFound = !hasValidProductId || (!isLoading && !errorMessage && !product);

  return {
    isLoading,
    errorMessage,
    notFound,
    product,
    reload,
  };
}
