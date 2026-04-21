"use client";

import { useMemo } from "react";
import type { Product } from "@/domain/catalog/entities/product";

export function useCatalog(products: Product[]) {
  return useMemo(
    () => ({
      products,
      total: products.length,
    }),
    [products]
  );
}
