import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProduct } from "../../services/productService";
import { productKeys } from "../../utils/product/product.util";

export function useDeleteProduct(rota = "prods") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteProduct(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys(rota) });
    },
  });

  const removeProduct = useCallback(
    async (id: string) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    removeProduct,
    isDeleting: mutation.isPending,
  };
}
