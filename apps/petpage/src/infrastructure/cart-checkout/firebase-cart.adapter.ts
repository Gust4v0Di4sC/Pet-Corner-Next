// Placeholder for the next cycle: Firestore cart + checkout adapter.
export type FirebaseCartCheckoutAdapter = {
  provider: "firestore";
  cartCollection: "carts";
  orderCollection: "orders";
};

export const firebaseCartCheckoutAdapter: FirebaseCartCheckoutAdapter = {
  provider: "firestore",
  cartCollection: "carts",
  orderCollection: "orders",
};
