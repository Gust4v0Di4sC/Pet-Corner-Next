import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDB } from "../firebase";
import type {
  AdminOrderTrackingRecord,
  DeliveryIssue,
  DeliveryIssueStatus,
  ListAdminOrdersOptions,
  ListDeliveryIssuesOptions,
  OrderItem,
  OrderPaymentSummary,
  OrderStatus,
  OrderStatusTimelineItem,
} from "../types/orderTracking";
import { DELIVERY_ISSUE_STATUS_VALUES, ORDER_STATUS_VALUES } from "../types/orderTracking";

const ORDERS_COLLECTION = "orders";
const CUSTOMERS_COLLECTION = "customers";
const CUSTOMER_ORDERS_SUBCOLLECTION = "orders";
const CUSTOMER_NOTIFICATIONS_SUBCOLLECTION = "notifications";
const DELIVERY_ISSUES_COLLECTION = "deliveryIssues";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pedido_recebido: "Pedido recebido",
  em_preparacao: "Em preparacao",
  em_transporte: "Em transporte",
  entregue: "Entregue",
  problema_entrega: "Problema na entrega",
  cancelado: "Cancelado",
};

const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pedido_recebido: "Pedido confirmado e aguardando separacao.",
  em_preparacao: "Itens em separacao e preparacao para envio.",
  em_transporte: "Pedido em rota de entrega.",
  entregue: "Pedido entregue no endereco informado.",
  problema_entrega: "Pedido com ocorrencia de entrega em analise.",
  cancelado: "Pedido cancelado.",
};

const DELIVERY_ISSUE_STATUS_LABELS: Record<DeliveryIssueStatus, string> = {
  aberto: "Aberto",
  em_analise: "Em analise",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}

function clampLimit(value: number | undefined, fallback = 120): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(parsedValue), 10), 300);
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUS_VALUES.includes(value as OrderStatus);
}

function isDeliveryIssueStatus(value: unknown): value is DeliveryIssueStatus {
  return DELIVERY_ISSUE_STATUS_VALUES.includes(value as DeliveryIssueStatus);
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  return isOrderStatus(value) ? value : "pedido_recebido";
}

function normalizeDeliveryIssueStatus(value: unknown): DeliveryIssueStatus {
  return isDeliveryIssueStatus(value) ? value : "aberto";
}

function normalizeSearch(value: string | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function mapOrderItems(payload: unknown): OrderItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const productId = toStringValue(item.productId).trim();
      const title = toStringValue(item.title).trim();
      const quantity = Math.max(Math.round(toNumberValue(item.quantity, 0)), 0);
      const unitPriceInCents = Math.max(Math.round(toNumberValue(item.unitPriceInCents, 0)), 0);

      if (!productId || !title || quantity <= 0) {
        return null;
      }

      return {
        productId,
        title,
        category: toStringValue(item.category).trim() || undefined,
        imageUrl: toStringValue(item.imageUrl).trim() || undefined,
        quantity,
        unitPriceInCents,
      } satisfies OrderItem;
    })
    .filter((item): item is OrderItem => item !== null);
}

function mapOrderTimeline(
  payload: unknown,
  fallbackStatus: OrderStatus,
  fallbackIso: string
): OrderStatusTimelineItem[] {
  if (!Array.isArray(payload)) {
    return [
      {
        status: fallbackStatus,
        label: ORDER_STATUS_LABELS[fallbackStatus],
        description: ORDER_STATUS_DESCRIPTIONS[fallbackStatus],
        createdAtIso: fallbackIso,
      },
    ];
  }

  const timeline = payload
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const status = normalizeOrderStatus(item.status);
      const createdAtIso = toIsoString(item.createdAtIso) || fallbackIso;

      return {
        status,
        label: toStringValue(item.label).trim() || ORDER_STATUS_LABELS[status],
        description:
          toStringValue(item.description).trim() || ORDER_STATUS_DESCRIPTIONS[status],
        createdAtIso,
      } satisfies OrderStatusTimelineItem;
    })
    .filter((item): item is OrderStatusTimelineItem => item !== null);

  if (!timeline.length) {
    return [
      {
        status: fallbackStatus,
        label: ORDER_STATUS_LABELS[fallbackStatus],
        description: ORDER_STATUS_DESCRIPTIONS[fallbackStatus],
        createdAtIso: fallbackIso,
      },
    ];
  }

  return [...timeline].sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso));
}

function mapPaymentSummary(payload: unknown): OrderPaymentSummary {
  if (!isRecord(payload)) {
    return {
      method: "credit_card",
      cardHolderName: "",
      cardLast4: "",
      expiryMonth: 0,
      expiryYear: 0,
    };
  }

  return {
    method: toStringValue(payload.method).trim() || "credit_card",
    cardHolderName: toStringValue(payload.cardHolderName).trim(),
    cardLast4: toStringValue(payload.cardLast4).trim(),
    expiryMonth: Math.max(Math.round(toNumberValue(payload.expiryMonth, 0)), 0),
    expiryYear: Math.max(Math.round(toNumberValue(payload.expiryYear, 0)), 0),
  };
}

function mapOrderRecord(id: string, payload: unknown): AdminOrderTrackingRecord | null {
  if (!isRecord(payload)) {
    return null;
  }

  const deliveryRecord = isRecord(payload.delivery) ? payload.delivery : {};
  const status = normalizeOrderStatus(payload.status);
  const createdAtIso =
    toIsoString(payload.createdAtIso) ||
    toIsoString(payload.dateIso) ||
    toIsoString(payload.createdAt) ||
    new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) || toIsoString(payload.updatedAt) || createdAtIso;
  const subtotalInCents = Math.max(Math.round(toNumberValue(payload.subtotalInCents, 0)), 0);
  const shippingInCents = Math.max(Math.round(toNumberValue(payload.shippingInCents, 0)), 0);
  const totalInCents = Math.max(
    Math.round(
      toNumberValue(
        payload.totalInCents,
        subtotalInCents + shippingInCents || Math.round(toNumberValue(payload.total, 0) * 100)
      )
    ),
    0
  );
  const items = mapOrderItems(payload.items);

  return {
    id,
    orderCode:
      toStringValue(payload.orderCode).trim() ||
      toStringValue(payload.label).trim() ||
      `PED-${id.slice(0, 8).toUpperCase()}`,
    customerId: toStringValue(payload.customerId).trim(),
    status,
    statusLabel: toStringValue(payload.statusLabel).trim() || ORDER_STATUS_LABELS[status],
    statusDescription:
      toStringValue(payload.statusDescription).trim() || ORDER_STATUS_DESCRIPTIONS[status],
    statusTimeline: mapOrderTimeline(payload.statusTimeline, status, createdAtIso),
    subtotalInCents,
    shippingInCents,
    totalInCents,
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
    paymentSummary: mapPaymentSummary(payload.paymentSummary),
    createdAtIso,
    updatedAtIso,
  };
}

function mapDeliveryIssue(id: string, payload: unknown): DeliveryIssue | null {
  if (!isRecord(payload)) {
    return null;
  }

  const message = toStringValue(payload.message).trim();
  const customerId = toStringValue(payload.customerId).trim();

  if (!message || !customerId) {
    return null;
  }

  const status = normalizeDeliveryIssueStatus(payload.status);
  const createdAtIso =
    toIsoString(payload.createdAtIso) || toIsoString(payload.createdAt) || new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) || toIsoString(payload.updatedAt) || createdAtIso;

  return {
    id,
    customerId,
    orderId: toStringValue(payload.orderId).trim() || undefined,
    orderCode: toStringValue(payload.orderCode).trim() || undefined,
    message,
    severity: toStringValue(payload.severity).trim() || "medium",
    status,
    triageNotes: toStringValue(payload.triageNotes).trim() || undefined,
    createdAtIso,
    updatedAtIso,
  };
}

function buildOrderSearchText(order: AdminOrderTrackingRecord): string {
  return [order.orderCode, order.id, order.customerId, order.delivery.fullName]
    .join(" ")
    .toLowerCase();
}

function buildIssueSearchText(issue: DeliveryIssue): string {
  return [issue.id, issue.orderCode ?? "", issue.orderId ?? "", issue.customerId, issue.message]
    .join(" ")
    .toLowerCase();
}

async function listOrdersFallback(options: ListAdminOrdersOptions): Promise<AdminOrderTrackingRecord[]> {
  const db = await getFirestoreDB();
  const snapshot = await getDocs(
    query(collection(db, ORDERS_COLLECTION), orderBy("updatedAt", "desc"), limit(clampLimit(options.maxResults)))
  );

  const search = normalizeSearch(options.search);
  const statusFilter = options.status;

  return snapshot.docs
    .map((item) => mapOrderRecord(item.id, item.data()))
    .filter((item): item is AdminOrderTrackingRecord => item !== null)
    .filter((item) => (statusFilter ? item.status === statusFilter : true))
    .filter((item) => (search ? buildOrderSearchText(item).includes(search) : true));
}

export async function listAdminOrders(
  options: ListAdminOrdersOptions = {}
): Promise<AdminOrderTrackingRecord[]> {
  const db = await getFirestoreDB();
  const maxResults = clampLimit(options.maxResults);
  const search = normalizeSearch(options.search);

  try {
    const ordersQuery = options.status
      ? query(
          collection(db, ORDERS_COLLECTION),
          where("status", "==", options.status),
          orderBy("updatedAt", "desc"),
          limit(maxResults)
        )
      : query(collection(db, ORDERS_COLLECTION), orderBy("updatedAt", "desc"), limit(maxResults));

    const snapshot = await getDocs(ordersQuery);

    return snapshot.docs
      .map((item) => mapOrderRecord(item.id, item.data()))
      .filter((item): item is AdminOrderTrackingRecord => item !== null)
      .filter((item) => (search ? buildOrderSearchText(item).includes(search) : true));
  } catch (error) {
    const code = error && typeof error === "object" ? (error as { code?: unknown }).code : "";
    if (code === "failed-precondition") {
      return listOrdersFallback(options);
    }

    throw error;
  }
}

async function listDeliveryIssuesFallback(
  options: ListDeliveryIssuesOptions
): Promise<DeliveryIssue[]> {
  const db = await getFirestoreDB();
  const snapshot = await getDocs(
    query(
      collection(db, DELIVERY_ISSUES_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(clampLimit(options.maxResults, 100))
    )
  );
  const search = normalizeSearch(options.search);
  const statusFilter = options.status;

  return snapshot.docs
    .map((item) => mapDeliveryIssue(item.id, item.data()))
    .filter((item): item is DeliveryIssue => item !== null)
    .filter((item) => (statusFilter ? item.status === statusFilter : true))
    .filter((item) => (search ? buildIssueSearchText(item).includes(search) : true));
}

export async function listDeliveryIssues(
  options: ListDeliveryIssuesOptions = {}
): Promise<DeliveryIssue[]> {
  const db = await getFirestoreDB();
  const maxResults = clampLimit(options.maxResults, 100);
  const search = normalizeSearch(options.search);

  try {
    const issuesQuery = options.status
      ? query(
          collection(db, DELIVERY_ISSUES_COLLECTION),
          where("status", "==", options.status),
          orderBy("createdAt", "desc"),
          limit(maxResults)
        )
      : query(
          collection(db, DELIVERY_ISSUES_COLLECTION),
          orderBy("createdAt", "desc"),
          limit(maxResults)
        );

    const snapshot = await getDocs(issuesQuery);

    return snapshot.docs
      .map((item) => mapDeliveryIssue(item.id, item.data()))
      .filter((item): item is DeliveryIssue => item !== null)
      .filter((item) => (search ? buildIssueSearchText(item).includes(search) : true));
  } catch (error) {
    const code = error && typeof error === "object" ? (error as { code?: unknown }).code : "";
    if (code === "failed-precondition") {
      return listDeliveryIssuesFallback(options);
    }

    throw error;
  }
}

type UpdateOrderStatusInput = {
  orderId: string;
  nextStatus: OrderStatus;
};

export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<void> {
  const orderId = input.orderId.trim();
  if (!orderId) {
    throw new Error("Pedido invalido para atualizacao.");
  }

  const db = await getFirestoreDB();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    throw new Error("Pedido nao encontrado.");
  }

  const currentOrder = mapOrderRecord(orderSnapshot.id, orderSnapshot.data());
  if (!currentOrder) {
    throw new Error("Pedido com dados invalidos no banco.");
  }

  const nowIso = new Date().toISOString();
  const timelineEntry: OrderStatusTimelineItem = {
    status: input.nextStatus,
    label: ORDER_STATUS_LABELS[input.nextStatus],
    description: ORDER_STATUS_DESCRIPTIONS[input.nextStatus],
    createdAtIso: nowIso,
  };
  const statusTimeline = [...currentOrder.statusTimeline, timelineEntry].sort((left, right) =>
    left.createdAtIso.localeCompare(right.createdAtIso)
  );

  const statusPatch = {
    status: input.nextStatus,
    statusLabel: ORDER_STATUS_LABELS[input.nextStatus],
    statusDescription: ORDER_STATUS_DESCRIPTIONS[input.nextStatus],
    statusTimeline,
    updatedAtIso: nowIso,
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(orderRef, statusPatch, { merge: true });

  if (currentOrder.customerId) {
    const customerOrderRef = doc(
      db,
      CUSTOMERS_COLLECTION,
      currentOrder.customerId,
      CUSTOMER_ORDERS_SUBCOLLECTION,
      orderId
    );
    batch.set(customerOrderRef, statusPatch, { merge: true });

    const notificationRef = doc(
      collection(db, CUSTOMERS_COLLECTION, currentOrder.customerId, CUSTOMER_NOTIFICATIONS_SUBCOLLECTION)
    );
    batch.set(
      notificationRef,
      {
        customerId: currentOrder.customerId,
        title: `Atualizacao do pedido ${currentOrder.orderCode}`,
        message: `Status alterado para ${ORDER_STATUS_LABELS[input.nextStatus]}.`,
        category: "order",
        linkHref: "/rastreamento",
        isRead: false,
        createdAt: serverTimestamp(),
        createdAtIso: nowIso,
      },
      { merge: true }
    );
  }

  await batch.commit();
}

type UpdateDeliveryIssueStatusInput = {
  issueId: string;
  nextStatus: DeliveryIssueStatus;
  triageNotes?: string;
};

export async function updateDeliveryIssueStatus(
  input: UpdateDeliveryIssueStatusInput
): Promise<void> {
  const issueId = input.issueId.trim();
  if (!issueId) {
    throw new Error("Issue invalida para atualizacao.");
  }

  const db = await getFirestoreDB();
  const issueRef = doc(db, DELIVERY_ISSUES_COLLECTION, issueId);
  const issueSnapshot = await getDoc(issueRef);
  if (!issueSnapshot.exists()) {
    throw new Error("Issue nao encontrada.");
  }

  const issue = mapDeliveryIssue(issueSnapshot.id, issueSnapshot.data());
  if (!issue) {
    throw new Error("Issue com dados invalidos no banco.");
  }

  const nowIso = new Date().toISOString();
  const normalizedNotes = toStringValue(input.triageNotes).trim().slice(0, 400);
  const batch = writeBatch(db);

  batch.set(
    issueRef,
    {
      status: input.nextStatus,
      triageNotes: normalizedNotes,
      updatedAtIso: nowIso,
      updatedAt: serverTimestamp(),
      ...(input.nextStatus === "resolvido" || input.nextStatus === "fechado"
        ? {
            resolvedAtIso: nowIso,
            resolvedAt: serverTimestamp(),
          }
        : {}),
    },
    { merge: true }
  );

  if (issue.customerId) {
    const notificationRef = doc(
      collection(db, CUSTOMERS_COLLECTION, issue.customerId, CUSTOMER_NOTIFICATIONS_SUBCOLLECTION)
    );

    batch.set(
      notificationRef,
      {
        customerId: issue.customerId,
        title: `Issue de entrega ${DELIVERY_ISSUE_STATUS_LABELS[input.nextStatus]}`,
        message: issue.orderCode
          ? `Chamado do pedido ${issue.orderCode} atualizado para ${DELIVERY_ISSUE_STATUS_LABELS[input.nextStatus]}.`
          : `Seu chamado de entrega foi atualizado para ${DELIVERY_ISSUE_STATUS_LABELS[input.nextStatus]}.`,
        category: "order",
        linkHref: "/rastreamento",
        isRead: false,
        createdAt: serverTimestamp(),
        createdAtIso: nowIso,
      },
      { merge: true }
    );
  }

  await batch.commit();
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function getOrderStatusDescription(status: OrderStatus): string {
  return ORDER_STATUS_DESCRIPTIONS[status];
}

export function getDeliveryIssueStatusLabel(status: DeliveryIssueStatus): string {
  return DELIVERY_ISSUE_STATUS_LABELS[status];
}
