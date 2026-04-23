"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getLandingProductById,
  type LandingProductView,
} from "@/services/marketing/landing-content.service";

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os detalhes do produto.";
}

type UseLandingProductDetailOptions = {
  productId: string;
};

export function useLandingProductDetail(options: UseLandingProductDetailOptions) {
  const normalizedProductId = useMemo(() => options.productId.trim(), [options.productId]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [product, setProduct] = useState<LandingProductView | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    if (!normalizedProductId) {
      setProduct(null);
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    try {
      const productData = await getLandingProductById(normalizedProductId);
      setProduct(productData);
      setNotFound(!productData);
    } catch (error) {
      setProduct(null);
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [normalizedProductId]);

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
    notFound,
    product,
    reload,
  };
}
