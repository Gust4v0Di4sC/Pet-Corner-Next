import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAllProducts } from "../../services/productService";
import type { Product, RawProductData } from "../../types/product";
import { normalizeProduct, productKeys } from "../../utils/product/product.util";

export function useListProducts(rota = "prods") {
  const { data: products = [], refetch, isFetching } = useQuery<Product[]>({
    queryKey: productKeys(rota),
    queryFn: async () => {
      const data = (await getAllProducts(rota)) as RawProductData[];
      return data.map(normalizeProduct);
    },
  });

  const fetchAllProducts = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    products,
    fetchAllProducts,
    isLoading: isFetching,
  };
}
