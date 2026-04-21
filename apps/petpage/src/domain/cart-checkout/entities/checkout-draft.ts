export type CheckoutDraft = {
  customerId: string;
  address: string;
  paymentMethod: "credit_card" | "pix" | "cash";
  notes?: string;
};
