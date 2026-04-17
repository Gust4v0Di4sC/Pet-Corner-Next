import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addProduct } from "../../services/productService";
import type { Product, RawProductData } from "../../types/product";
import { normalizeProduct, productKeys } from "../../utils/product/product.util";

export function useCreateProduct(rota = "prods") {
  const queryClient = useQueryClient();

  const mutation = useMutation<Product, Error, Omit<Product, "id">>({
    mutationFn: async (data) => {
      const created = (await addProduct(rota, data)) as RawProductData;
      return normalizeProduct(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Product[]>(productKeys(rota), (previous = []) => [
        ...previous,
        created,
      ]);
    },
  });

  const createProduct = useCallback(
    async (data: Omit<Product, "id">) => {
      await mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    createProduct,
    isCreating: mutation.isPending,
  };
}
