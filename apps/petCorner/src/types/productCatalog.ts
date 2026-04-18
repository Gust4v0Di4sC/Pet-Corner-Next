import type { Timestamp } from "firebase/firestore";

export type ProductCatalogItem = {
  id?: string;
  code: string;
  codeNormalized: string;
  name: string;
  price: number;
  quantity?: number;
  brand?: string;
  category?: string;
  sourceFileName: string;
  uploadedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  isTemplate: boolean;
};

export type RawProductCatalogData = Partial<ProductCatalogItem> & {
  id?: unknown;
  uploadedAt?: unknown;
  updatedAt?: unknown;
};

export type ProductCatalogImportInput = Omit<
  ProductCatalogItem,
  "id" | "uploadedAt" | "updatedAt"
>;

export type ProductCatalogImportSummary = {
  totalRows: number;
  validRows: number;
  imported: number;
  updated: number;
  ignored: number;
  sourceFileName: string;
};
