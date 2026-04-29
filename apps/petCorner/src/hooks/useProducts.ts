import { useCallback, useState } from "react";

import type { Product, UseProductsReturn } from "../types/product";
import {
  useCreateProduct,
  useDeleteProduct,
  useEditProduct,
  useListProducts,
  useSearchProduct,
} from "./product";

export const useProducts = (rota: string = "prods"): UseProductsReturn => {
  const [selected, setSelected] = useState<Product | null>(null);
  const { products, fetchAllProducts, isLoading } = useListProducts(rota);
  const { createProduct } = useCreateProduct(rota);
  const { editProduct } = useEditProduct(rota);
  const { removeProduct } = useDeleteProduct(rota);
  const { searchProduct } = useSearchProduct(rota);

  const create = useCallback(async (data: Omit<Product, "id">) => {
    await createProduct(data);
  }, [createProduct]);

  const update = useCallback(async (id: string, data: Omit<Product, "id">) => {
    await editProduct(id, data);
  }, [editProduct]);

  const remove = useCallback(async (id: string) => {
    await removeProduct(id);
    setSelected(null);
  }, [removeProduct]);

  const searchByName = useCallback(async (name: string) => {
    const product = await searchProduct(name);
    setSelected(product);
  }, [searchProduct]);

  return {
    items: products,
    selected,
    setSelected,
    fetchAll: fetchAllProducts,
    create,
    update,
    remove,
    searchByName,
    isLoading,
  };
};
