// src/contexts/ProductContext.tsx
import { useState } from 'react';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProductByName
} from '../services/productService';

import type { Product } from '../services/productService';

// src/contexts/ProductContext.tsx
export type ProductContextType = {
  items: Product[]; // <-- NORMALIZADO
  selected: Product | null;
  setSelected: (item: Product | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Product, 'id'>) => Promise<void>;
  update: (id: string, data: Omit<Product, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
};

export const useProduct = (rota: string = 'prods'): ProductContextType & { items: Product[] } => {
  const [products, setItems] = useState<Product[]>([]); // <-- RENOMEADO
  const [selected, setSelected] = useState<Product | null>(null);

  const fetchAll = async () => {
    const data = await getAllProducts(rota);
    setItems(data);
  };

  const create = async (data: Omit<Product, 'id'>) => {
    const newItem = await addProduct(rota, data);
    setItems(prev => [...prev, newItem]);
  };

  const update = async (id: string, data: Omit<Product, 'id'>) => {
    await updateProduct(rota, id, data);
    fetchAll();
  };

  const remove = async (id: string) => {
    await deleteProduct(rota, id);
    fetchAll();
  };

  const searchByName = async (name: string) => {
    const res = await searchProductByName(rota, name);
    setSelected(res.length > 0 ? res[0] : null);
  };

  return {
    items: products,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName
  };
};
