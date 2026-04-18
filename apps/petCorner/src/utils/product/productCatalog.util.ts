import { Timestamp } from "firebase/firestore";

import type { ProductCatalogItem, RawProductCatalogData } from "../../types/productCatalog";

export const productCatalogKeys = (rota: string) => ["productCatalog", rota] as const;

export function normalizeCatalogCode(code: string): string {
  return code.trim().replace(/\s+/g, " ").toUpperCase();
}

function getOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function getOptionalTimestamp(value: unknown): Timestamp | null | undefined {
  return value instanceof Timestamp ? value : undefined;
}

export const normalizeProductCatalogItem = (
  item: RawProductCatalogData
): ProductCatalogItem => ({
  id: typeof item.id === "string" ? item.id : undefined,
  code: typeof item.code === "string" ? item.code : "",
  codeNormalized:
    typeof item.codeNormalized === "string"
      ? item.codeNormalized
      : normalizeCatalogCode(typeof item.code === "string" ? item.code : ""),
  name: typeof item.name === "string" ? item.name : "",
  price: typeof item.price === "number" ? item.price : Number(item.price ?? 0),
  quantity: getOptionalNumber(item.quantity),
  brand: getOptionalText(item.brand),
  category: getOptionalText(item.category),
  sourceFileName:
    typeof item.sourceFileName === "string" ? item.sourceFileName : "catalogo.csv",
  uploadedAt: getOptionalTimestamp(item.uploadedAt) ?? null,
  updatedAt: getOptionalTimestamp(item.updatedAt) ?? null,
  isTemplate: item.isTemplate === true,
});
