import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProduct } from "../../services/productService";
import type { Product } from "../../types/product";
import { productKeys } from "../../utils/product/product.util";

export function useEditProduct(rota = "prods") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { id: string; data: Omit<Product, "id"> }>({
    mutationFn: ({ id, data }) => updateProduct(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys(rota) });
    },
  });

  const editProduct = useCallback(
    async (id: string, data: Omit<Product, "id">) => {
      await mutation.mutateAsync({ id, data });
    },
    [mutation]
  );

  return {
    editProduct,
    isEditing: mutation.isPending,
  };
}
