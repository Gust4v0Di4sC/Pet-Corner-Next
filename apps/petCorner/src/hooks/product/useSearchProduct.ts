import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { searchProductByName } from "../../services/productService";
import type { Product, RawProductData } from "../../types/product";
import { normalizeProduct } from "../../utils/product/product.util";

export function useSearchProduct(rota = "prods") {
  const mutation = useMutation<Product | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return null;
      }

      const results = (await searchProductByName(rota, trimmed)) as RawProductData[];
      const firstProduct = results[0];
      return firstProduct ? normalizeProduct(firstProduct) : null;
    },
  });

  const searchProduct = useCallback(
    async (name: string) => {
      return mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    searchProduct,
    isSearching: mutation.isPending,
  };
}
