import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProductByName,
  type Product,
} from "../services/productService";

import type { UseProductsReturn, RawProductData } from "../types/product";
import { productKeys,normalizeProduct } from "../utils/product/product.util";




export const useProducts = (rota: string = "prods"): UseProductsReturn => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Product | null>(null);

  const {
    data: products = [],
    refetch,
    isFetching,
  } = useQuery<Product[]>({
    queryKey: productKeys(rota),
    queryFn: async () => {
      const data = await getAllProducts(rota);
      return (data as RawProductData[]).map(normalizeProduct);
    },
  });

  const fetchAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const createMutation = useMutation<Product, Error, Omit<Product, "id">>({
    mutationFn: async (data) => {
      const created = await addProduct(rota, data);
      return normalizeProduct(created as RawProductData);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Product[]>(productKeys(rota), (prev = []) => [
        ...prev,
        created,
      ]);
    },
  });

  const updateMutation = useMutation<
    void,
    Error,
    { id: string; data: Omit<Product, "id"> }
  >({
    mutationFn: ({ id, data }) => updateProduct(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys(rota) });
    },
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteProduct(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys(rota) });
      setSelected(null);
    },
  });

  const searchMutation = useMutation<Product | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const res = await searchProductByName(rota, trimmed);
      const first = res[0];
      return first ? normalizeProduct(first as RawProductData) : null;
    },
    onSuccess: (item) => {
      setSelected(item);
    },
  });

  // ✅ API igual ao seu useClient (Promise<void>)
  const create = useCallback(async (data: Omit<Product, "id">) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const update = useCallback(async (id: string, data: Omit<Product, "id">) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const remove = useCallback(async (id: string) => {
    await removeMutation.mutateAsync(id);
  }, [removeMutation]);

  const searchByName = useCallback(async (name: string) => {
    await searchMutation.mutateAsync(name);
  }, [searchMutation]);

  return {
    items: products,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName,
    isLoading: isFetching,
  };
};
