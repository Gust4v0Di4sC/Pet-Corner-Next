export const ORDER_STATUS_VALUES = [
  "pedido_recebido",
  "em_preparacao",
  "em_transporte",
  "entregue",
  "problema_entrega",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const DELIVERY_ISSUE_STATUS_VALUES = [
  "aberto",
  "em_analise",
  "resolvido",
  "fechado",
] as const;

export type DeliveryIssueStatus = (typeof DELIVERY_ISSUE_STATUS_VALUES)[number];

export type OrderStatusTimelineItem = {
  status: OrderStatus;
  label: string;
  description: string;
  createdAtIso: string;
};

export type OrderItem = {
  productId: string;
  title: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  unitPriceInCents: number;
};

export type OrderDeliveryAddress = {
  fullName: string;
  phone: string;
  zipCode: string;
  city: string;
  street: string;
  number: string;
  district: string;
  state: string;
  complement: string;
};

export type OrderPaymentSummary = {
  method: string;
  cardHolderName: string;
  cardLast4: string;
  expiryMonth: number;
  expiryYear: number;
};

export type AdminOrderTrackingRecord = {
  id: string;
  orderCode: string;
  customerId: string;
  status: OrderStatus;
  statusLabel: string;
  statusDescription: string;
  statusTimeline: OrderStatusTimelineItem[];
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
  items: OrderItem[];
  delivery: OrderDeliveryAddress;
  paymentSummary: OrderPaymentSummary;
  createdAtIso: string;
  updatedAtIso: string;
};

export type DeliveryIssue = {
  id: string;
  customerId: string;
  orderId?: string;
  orderCode?: string;
  message: string;
  severity: string;
  status: DeliveryIssueStatus;
  triageNotes?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type ListAdminOrdersOptions = {
  status?: OrderStatus;
  search?: string;
  maxResults?: number;
};

export type ListDeliveryIssuesOptions = {
  status?: DeliveryIssueStatus;
  search?: string;
  maxResults?: number;
};

