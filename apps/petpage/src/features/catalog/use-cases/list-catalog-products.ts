import type { Product } from "@/features/catalog/types/product";
import type { CatalogRepository } from "@/features/catalog/repositories/catalog-repository";

export class ListCatalogProducts {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  execute(): Promise<Product[]> {
    return this.catalogRepository.listActive();
  }
}
