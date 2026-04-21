export type CartItem = {
  productId: string;
  quantity: number;
  unitPriceInCents: number;
};

export type Cart = {
  customerId?: string;
  items: CartItem[];
  subtotalInCents: number;
};
