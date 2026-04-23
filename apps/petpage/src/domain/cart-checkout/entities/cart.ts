export type CartItem = {
  productId: string;
  title: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  unitPriceInCents: number;
};

export type Cart = {
  customerId?: string;
  items: CartItem[];
  subtotalInCents: number;
  updatedAtIso?: string;
};
