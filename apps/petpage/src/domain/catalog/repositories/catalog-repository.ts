import type { Product } from "@/domain/catalog/entities/product";

export interface CatalogRepository {
  listActive(): Promise<Product[]>;
  getById(productId: string): Promise<Product | null>;
}
