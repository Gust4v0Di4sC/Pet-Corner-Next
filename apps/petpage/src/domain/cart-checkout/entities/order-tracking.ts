export const ORDER_STATUS_OPTIONS = [
  "pedido_recebido",
  "em_preparacao",
  "em_transporte",
  "entregue",
  "problema_entrega",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

export type OrderStatusTimelineItem = {
  status: OrderStatus;
  label: string;
  description: string;
  createdAtIso: string;
};

export type CustomerOrderTrackingItem = {
  productId: string;
  title: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  unitPriceInCents: number;
};

export type CustomerOrderTrackingView = {
  orderId: string;
  orderCode: string;
  customerId: string;
  status: OrderStatus;
  statusLabel: string;
  statusDescription: string;
  statusTimeline: OrderStatusTimelineItem[];
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
  items: CustomerOrderTrackingItem[];
  delivery: {
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
  paymentSummary: {
    method: "credit_card";
    cardHolderName: string;
    cardLast4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  createdAtIso: string;
  updatedAtIso: string;
};

const ORDER_STATUS_LABEL_MAP: Record<OrderStatus, string> = {
  pedido_recebido: "Pedido recebido",
  em_preparacao: "Em preparacao",
  em_transporte: "Em transporte",
  entregue: "Entregue",
  problema_entrega: "Problema na entrega",
  cancelado: "Cancelado",
};

const ORDER_STATUS_DESCRIPTION_MAP: Record<OrderStatus, string> = {
  pedido_recebido: "Recebemos seu pedido e iniciamos o processamento.",
  em_preparacao: "Seu pedido esta sendo separado pela equipe.",
  em_transporte: "Seu pedido saiu para entrega.",
  entregue: "Seu pedido foi entregue no endereco informado.",
  problema_entrega: "Identificamos um problema na entrega e estamos atuando.",
  cancelado: "Pedido cancelado.",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL_MAP[status];
}

export function getOrderStatusDescription(status: OrderStatus): string {
  return ORDER_STATUS_DESCRIPTION_MAP[status];
}
