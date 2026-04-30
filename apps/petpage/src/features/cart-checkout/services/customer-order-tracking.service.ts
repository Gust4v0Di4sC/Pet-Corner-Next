"use client";

import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import {
  ORDER_STATUS_OPTIONS,
  getOrderStatusDescription,
  getOrderStatusLabel,
  type CustomerOrderTrackingItem,
  type CustomerOrderTrackingView,
  type OrderStatus,
  type OrderStatusTimelineItem,
} from "@/features/cart-checkout/types/order-tracking";
import { getFirebaseApp } from "@/lib/auth/firebase-auth.adapter";

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUS_OPTIONS.includes(value as OrderStatus);
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  return isOrderStatus(value) ? value : "pedido_recebido";
}

function normalizePaymentMethod(value: unknown): "credit_card" | "stripe" {
  return toStringValue(value).trim() === "stripe" ? "stripe" : "credit_card";
}

function toIsoString(value: unknown): string | null {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (value && typeof value === "object" && "toDate" in value) {
    const maybeDate = (value as { toDate?: () => Date }).toDate?.();
    if (maybeDate instanceof Date && Number.isFinite(maybeDate.getTime())) {
      return maybeDate.toISOString();
    }
  }

  return null;
}

function mapOrderItem(payload: unknown): CustomerOrderTrackingItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const productId = toStringValue(record.productId).trim();
  const title = toStringValue(record.title).trim();
  const quantity = Math.max(Math.round(toNumberValue(record.quantity, 0)), 0);
  const unitPriceInCents = Math.max(Math.round(toNumberValue(record.unitPriceInCents, 0)), 0);

  if (!productId || !title || quantity <= 0) {
    return null;
  }

  const category = toStringValue(record.category).trim() || undefined;
  const imageUrl = toStringValue(record.imageUrl).trim() || undefined;

  return {
    productId,
    title,
    category,
    imageUrl,
    quantity,
    unitPriceInCents,
  };
}

function mapStatusTimeline(payload: unknown, fallbackStatus: OrderStatus): OrderStatusTimelineItem[] {
  if (!Array.isArray(payload)) {
    const nowIso = new Date().toISOString();
    return [
      {
        status: fallbackStatus,
        label: getOrderStatusLabel(fallbackStatus),
        description: getOrderStatusDescription(fallbackStatus),
        createdAtIso: nowIso,
      },
    ];
  }

  const mapped = payload
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const status = normalizeOrderStatus(record.status);
      const label = toStringValue(record.label).trim() || getOrderStatusLabel(status);
      const description =
        toStringValue(record.description).trim() || getOrderStatusDescription(status);
      const createdAtIso = toIsoString(record.createdAtIso) || new Date().toISOString();

      return {
        status,
        label,
        description,
        createdAtIso,
      };
    })
    .filter((item): item is OrderStatusTimelineItem => item !== null);

  if (mapped.length) {
    return mapped.sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso));
  }

  const nowIso = new Date().toISOString();
  return [
    {
      status: fallbackStatus,
      label: getOrderStatusLabel(fallbackStatus),
      description: getOrderStatusDescription(fallbackStatus),
      createdAtIso: nowIso,
    },
  ];
}

function mapOrderDocument(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  customerId: string
): CustomerOrderTrackingView | null {
  const payload = snapshot.data() as Record<string, unknown>;
  const status = normalizeOrderStatus(payload.status);
  const orderId = snapshot.id;
  const orderCode =
    toStringValue(payload.orderCode).trim() ||
    toStringValue(payload.label).trim() ||
    `PED-${orderId.slice(0, 8).toUpperCase()}`;
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => mapOrderItem(item)).filter((item): item is CustomerOrderTrackingItem => item !== null)
    : [];

  if (!items.length) {
    return null;
  }

  const deliveryRecord =
    payload.delivery && typeof payload.delivery === "object"
      ? (payload.delivery as Record<string, unknown>)
      : {};
  const paymentSummaryRecord =
    payload.paymentSummary && typeof payload.paymentSummary === "object"
      ? (payload.paymentSummary as Record<string, unknown>)
      : {};
  const paymentMethod = normalizePaymentMethod(paymentSummaryRecord.method);

  const createdAtIso =
    toIsoString(payload.createdAtIso) ||
    toIsoString(payload.dateIso) ||
    toIsoString(payload.createdAt) ||
    new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) ||
    toIsoString(payload.updatedAt) ||
    createdAtIso;

  return {
    orderId,
    orderCode,
    customerId: toStringValue(payload.customerId).trim() || customerId,
    status,
    statusLabel: toStringValue(payload.statusLabel).trim() || getOrderStatusLabel(status),
    statusDescription:
      toStringValue(payload.statusDescription).trim() || getOrderStatusDescription(status),
    statusTimeline: mapStatusTimeline(payload.statusTimeline, status),
    subtotalInCents: Math.max(Math.round(toNumberValue(payload.subtotalInCents, 0)), 0),
    shippingInCents: Math.max(Math.round(toNumberValue(payload.shippingInCents, 0)), 0),
    totalInCents: Math.max(Math.round(toNumberValue(payload.totalInCents, 0)), 0),
    items,
    delivery: {
      fullName: toStringValue(deliveryRecord.fullName).trim(),
      phone: toStringValue(deliveryRecord.phone).trim(),
      zipCode: toStringValue(deliveryRecord.zipCode).trim(),
      city: toStringValue(deliveryRecord.city).trim(),
      street: toStringValue(deliveryRecord.street).trim(),
      number: toStringValue(deliveryRecord.number).trim(),
      district: toStringValue(deliveryRecord.district).trim(),
      state: toStringValue(deliveryRecord.state).trim(),
      complement: toStringValue(deliveryRecord.complement).trim(),
    },
    paymentSummary: {
      method: paymentMethod,
      cardHolderName: toStringValue(paymentSummaryRecord.cardHolderName).trim(),
      cardLast4: toStringValue(paymentSummaryRecord.cardLast4).trim(),
      expiryMonth: Math.max(Math.round(toNumberValue(paymentSummaryRecord.expiryMonth, 0)), 0),
      expiryYear: Math.max(Math.round(toNumberValue(paymentSummaryRecord.expiryYear, 0)), 0),
      provider: paymentMethod === "stripe" ? "stripe" : undefined,
      checkoutSessionId: toStringValue(paymentSummaryRecord.checkoutSessionId).trim(),
      paymentIntentId: toStringValue(paymentSummaryRecord.paymentIntentId).trim(),
      paymentStatus: toStringValue(paymentSummaryRecord.paymentStatus).trim(),
    },
    stripe:
      payload.stripe && typeof payload.stripe === "object"
        ? {
            checkoutSessionId: toStringValue(
              (payload.stripe as Record<string, unknown>).checkoutSessionId
            ).trim(),
            paymentIntentId: toStringValue(
              (payload.stripe as Record<string, unknown>).paymentIntentId
            ).trim(),
            paymentStatus: toStringValue(
              (payload.stripe as Record<string, unknown>).paymentStatus
            ).trim(),
          }
        : undefined,
    createdAtIso,
    updatedAtIso,
  };
}

export async function listCustomerTrackingOrders(
  customerId: string
): Promise<CustomerOrderTrackingView[]> {
  const normalizedCustomerId = customerId.trim();
  if (!normalizedCustomerId) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(getFirestore(getFirebaseApp()), "customers", normalizedCustomerId, "orders"),
      orderBy("createdAt", "desc")
    )
  );

  return snapshot.docs
    .map((documentSnapshot) => mapOrderDocument(documentSnapshot, normalizedCustomerId))
    .filter((order): order is CustomerOrderTrackingView => order !== null);
}
