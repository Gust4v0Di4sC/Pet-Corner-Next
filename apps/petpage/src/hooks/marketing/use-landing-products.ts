"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<LandingProductView[]>([]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const allProducts = await listLandingProducts();
      setProducts(allProducts);
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
    products,
    reload,
  };
}
