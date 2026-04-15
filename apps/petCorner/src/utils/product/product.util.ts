import type { Product, RawProductData } from "../../types/product";

export const productKeys = (rota: string) => ["products", rota] as const;



export const normalizeProduct = (item: RawProductData): Product => ({
  id: typeof item.id === "string" ? item.id : undefined,
  name: typeof item.name === "string" ? item.name : "",
  code: typeof item.code === "string" ? item.code : "",
  price: typeof item.price === "number" ? item.price : Number(item.price ?? 0),
  quantity:
    typeof item.quantity === "number"
      ? item.quantity
      : Number(item.quantity ?? 0),
});