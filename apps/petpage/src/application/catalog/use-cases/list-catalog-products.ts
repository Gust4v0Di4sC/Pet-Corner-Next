import type { Product } from "@/domain/catalog/entities/product";
import type { CatalogRepository } from "@/domain/catalog/repositories/catalog-repository";

export class ListCatalogProducts {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  execute(): Promise<Product[]> {
    return this.catalogRepository.listActive();
  }
}
