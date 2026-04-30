import type { Product } from "@/features/catalog/types/product";

export interface CatalogRepository {
  listActive(): Promise<Product[]>;
  getById(productId: string): Promise<Product | null>;
}
