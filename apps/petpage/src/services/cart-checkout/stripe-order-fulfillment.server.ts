import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";
import type { Cart, CartItem } from "@/domain/cart-checkout/entities/cart";
import {
  getOrderStatusDescription,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/domain/cart-checkout/entities/order-tracking";
import { getFirebaseServerFirestore } from "@/infrastructure/firebase/firebase-server";
import { formatPriceBRL } from "@/utils/catalog/price";

export type CheckoutDeliveryInput = {
  fullName: string;
  phone: string;
  zipCode: string;
  city: string;
  street: string;
  number: string;
  district: string;
  state: string;
  complement?: string;
};

export const DEFAULT_CHECKOUT_SHIPPING_IN_CENTS = 1490;

export type CheckoutCartItemInput = {
  productId: string;
  quantity: number;
};

type FulfillStripeCheckoutSessionResult =
  | {
      status: "created";
      orderId: string;
      orderCode: string;
    }
  | {
      status: "duplicate" | "ignored";
      reason: string;
    };

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseFloat(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function sanitizeCartItem(payload: unknown): CartItem | null {
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

  return {
    productId,
    title,
    category: toStringValue(record.category).trim() || undefined,
    imageUrl: toStringValue(record.imageUrl).trim() || undefined,
    quantity,
    unitPriceInCents,
  };
}

function calculateSubtotalInCents(items: CartItem[]): number {
  return items.reduce((subtotal, item) => subtotal + item.quantity * item.unitPriceInCents, 0);
}

function mapCart(customerId: string, payload: unknown): Cart {
  if (!payload || typeof payload !== "object") {
    return {
      customerId,
      items: [],
      subtotalInCents: 0,
      updatedAtIso: new Date().toISOString(),
    };
  }

  const record = payload as Record<string, unknown>;
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => sanitizeCartItem(item))
        .filter((item): item is CartItem => item !== null)
    : [];

  return {
    customerId,
    items,
    subtotalInCents: calculateSubtotalInCents(items),
    updatedAtIso: toStringValue(record.updatedAtIso, new Date().toISOString()),
  };
}

function centsFromProductPrice(value: unknown): number {
  const price = toNumberValue(value, 0);
  if (price <= 0) {
    return 0;
  }

  return Math.max(Math.round(price * 100), 0);
}

function normalizeCheckoutCartItemInput(payload: unknown): CheckoutCartItemInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const productId = toStringValue(record.productId).trim();
  const quantity = Math.max(Math.round(toNumberValue(record.quantity, 0)), 0);

  if (!productId || quantity <= 0) {
    return null;
  }

  return {
    productId,
    quantity,
  };
}

function createOrderLabel(orderId: string): string {
  return `PED-${orderId.slice(0, 8).toUpperCase()}`;
}

function createInitialOrderStatusTimeline(createdAtIso: string) {
  const status: OrderStatus = "pedido_recebido";

  return [
    {
      status,
      label: getOrderStatusLabel(status),
      description: getOrderStatusDescription(status),
      createdAtIso,
    },
  ];
}

function readDeliveryFromMetadata(metadata: Stripe.Metadata | null | undefined): CheckoutDeliveryInput | null {
  if (!metadata) {
    return null;
  }

  const delivery: CheckoutDeliveryInput = {
    fullName: toStringValue(metadata.deliveryFullName).trim(),
    phone: toStringValue(metadata.deliveryPhone).trim(),
    zipCode: toStringValue(metadata.deliveryZipCode).trim(),
    city: toStringValue(metadata.deliveryCity).trim(),
    street: toStringValue(metadata.deliveryStreet).trim(),
    number: toStringValue(metadata.deliveryNumber).trim(),
    district: toStringValue(metadata.deliveryDistrict).trim(),
    state: toStringValue(metadata.deliveryState).trim(),
    complement: toStringValue(metadata.deliveryComplement).trim(),
  };

  if (
    !delivery.fullName ||
    !delivery.phone ||
    !delivery.zipCode ||
    !delivery.city ||
    !delivery.street ||
    !delivery.number ||
    !delivery.district ||
    !delivery.state
  ) {
    return null;
  }

  return delivery;
}

function normalizePaymentIntentId(paymentIntent: Stripe.Checkout.Session["payment_intent"]): string {
  if (!paymentIntent) {
    return "";
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function toOrderItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    title: item.title,
    category: item.category || "",
    imageUrl: item.imageUrl || "",
    quantity: item.quantity,
    unitPriceInCents: item.unitPriceInCents,
  }));
}

async function publishOrderNotifications(input: {
  customerId: string;
  orderCode: string;
  actorEmail?: string | null;
}) {
  const db = getFirebaseServerFirestore();
  const nowIso = new Date().toISOString();

  await Promise.allSettled([
    db.collection("customers").doc(input.customerId).collection("notifications").add({
      customerId: input.customerId,
      title: "Pedido finalizado",
      message: `Seu pedido ${input.orderCode} foi recebido e esta em processamento.`,
      category: "order",
      linkHref: "/rastreamento",
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
    }),
    db.collection("adminNotifications").add({
      title: "Novo pedido pago no Stripe",
      message: `Cliente ${input.customerId} pagou o pedido ${input.orderCode} via Stripe.`,
      category: "order",
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
      actorCustomerId: input.customerId,
      actorEmail: input.actorEmail || "",
      source: "petpage-stripe",
    }),
  ]);
}

export async function loadServerCustomerCart(customerId: string): Promise<Cart> {
  const normalizedCustomerId = customerId.trim();
  if (!normalizedCustomerId) {
    return {
      items: [],
      subtotalInCents: 0,
      updatedAtIso: new Date().toISOString(),
    };
  }

  const db = getFirebaseServerFirestore();
  const cartRef = db.collection("customers").doc(normalizedCustomerId).collection("carts").doc("active");
  const snapshot = await db.runTransaction((transaction) => transaction.get(cartRef));
  return mapCart(normalizedCustomerId, snapshot.exists ? snapshot.data() : null);
}

export async function resolveCheckoutCart(
  customerId: string,
  clientItems: unknown
): Promise<Cart> {
  const remoteCart = await loadServerCustomerCart(customerId);
  if (remoteCart.items.length) {
    return remoteCart;
  }

  const requestedItems = Array.isArray(clientItems)
    ? clientItems
        .map((item) => normalizeCheckoutCartItemInput(item))
        .filter((item): item is CheckoutCartItemInput => item !== null)
    : [];

  if (!requestedItems.length) {
    return remoteCart;
  }

  const db = getFirebaseServerFirestore();
  const mergedQuantities = new Map<string, number>();
  for (const item of requestedItems) {
    mergedQuantities.set(item.productId, (mergedQuantities.get(item.productId) || 0) + item.quantity);
  }

  const items: CartItem[] = [];
  for (const [productId, quantity] of mergedQuantities) {
    const productSnapshot = await db.collection("prods").doc(productId).get();
    if (!productSnapshot.exists) {
      throw new Error("Produto do carrinho nao foi encontrado.");
    }

    const product = productSnapshot.data() || {};
    if (product.isActive === false) {
      throw new Error("Produto do carrinho nao esta disponivel.");
    }

    const title = toStringValue(product.name).trim();
    const unitPriceInCents = centsFromProductPrice(product.price);
    if (!title || unitPriceInCents <= 0) {
      throw new Error("Produto do carrinho esta sem preco valido.");
    }

    items.push({
      productId,
      title,
      category: toStringValue(product.category, "Loja").trim() || "Loja",
      imageUrl: toStringValue(product.imageUrl).trim() || undefined,
      quantity,
      unitPriceInCents,
    });
  }

  return {
    customerId: customerId.trim(),
    items,
    subtotalInCents: calculateSubtotalInCents(items),
    updatedAtIso: new Date().toISOString(),
  };
}

export async function saveStripePendingCheckout(input: {
  checkoutSessionId: string;
  customerId: string;
  cart: Cart;
  delivery: CheckoutDeliveryInput;
  shippingInCents: number;
}) {
  const db = getFirebaseServerFirestore();
  const normalizedCustomerId = input.customerId.trim();

  if (!input.checkoutSessionId.trim() || !normalizedCustomerId || !input.cart.items.length) {
    throw new Error("Dados insuficientes para salvar checkout pendente.");
  }

  await db.collection("stripePendingCheckouts").doc(input.checkoutSessionId).set(
    {
      checkoutSessionId: input.checkoutSessionId,
      customerId: normalizedCustomerId,
      cart: {
        items: toOrderItems(input.cart.items),
        subtotalInCents: input.cart.subtotalInCents,
      },
      delivery: {
        ...input.delivery,
        complement: input.delivery.complement || "",
      },
      shippingInCents: input.shippingInCents,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<FulfillStripeCheckoutSessionResult> {
  if (session.payment_status !== "paid") {
    return {
      status: "ignored",
      reason: `payment_status ${session.payment_status}`,
    };
  }

  const normalizedCustomerId =
    toStringValue(session.metadata?.customerId).trim() ||
    toStringValue(session.client_reference_id).trim();
  if (!normalizedCustomerId) {
    return {
      status: "ignored",
      reason: "missing customerId",
    };
  }

  const delivery = readDeliveryFromMetadata(session.metadata);
  if (!delivery) {
    return {
      status: "ignored",
      reason: "missing delivery metadata",
    };
  }

  const db = getFirebaseServerFirestore();
  const checkoutSessionRef = db.collection("stripeCheckoutSessions").doc(session.id);
  const pendingCheckoutRef = db.collection("stripePendingCheckouts").doc(session.id);
  const cartRef = db.collection("customers").doc(normalizedCustomerId).collection("carts").doc("active");
  const globalOrderRef = db.collection("orders").doc();
  const orderId = globalOrderRef.id;
  const customerOrderRef = db.collection("customers").doc(normalizedCustomerId).collection("orders").doc(orderId);
  const orderCode = createOrderLabel(orderId);
  const createdAtIso = new Date().toISOString();
  const status: OrderStatus = "pedido_recebido";
  const shippingInCents = Math.max(
    Math.round(toNumberValue(session.metadata?.shippingInCents, DEFAULT_CHECKOUT_SHIPPING_IN_CENTS)),
    0
  );
  const paymentIntentId = normalizePaymentIntentId(session.payment_intent);

  const transactionResult = await db.runTransaction(async (transaction) => {
    const [checkoutSessionSnapshot, pendingCheckoutSnapshot, cartSnapshot] = await Promise.all([
      transaction.get(checkoutSessionRef),
      transaction.get(pendingCheckoutRef),
      transaction.get(cartRef),
    ]);

    if (checkoutSessionSnapshot.exists) {
      return {
        status: "duplicate" as const,
        reason: "stripe checkout session already fulfilled",
      };
    }

    const remoteCart = mapCart(
      normalizedCustomerId,
      cartSnapshot.exists ? cartSnapshot.data() : null
    );
    const pendingCheckout = pendingCheckoutSnapshot.exists ? pendingCheckoutSnapshot.data() : null;
    const pendingCart =
      pendingCheckout && typeof pendingCheckout.cart === "object"
        ? mapCart(normalizedCustomerId, pendingCheckout.cart)
        : null;
    const activeCart = remoteCart.items.length ? remoteCart : pendingCart;

    if (!activeCart?.items.length) {
      return {
        status: "ignored" as const,
        reason: "empty cart",
      };
    }

    const subtotalInCents = activeCart.subtotalInCents;
    const totalInCents = subtotalInCents + shippingInCents;
    const normalizedItems = toOrderItems(activeCart.items);
    const paymentSummary = {
      method: "stripe" as const,
      provider: "stripe",
      checkoutSessionId: session.id,
      paymentIntentId,
      paymentStatus: session.payment_status,
    };
    const stripePayload = {
      checkoutSessionId: session.id,
      paymentIntentId,
      paymentStatus: session.payment_status,
      eventMode: "test",
    };
    const baseOrderPayload = {
      orderId,
      orderCode,
      customerId: normalizedCustomerId,
      label: orderCode,
      status,
      statusLabel: getOrderStatusLabel(status),
      statusDescription: getOrderStatusDescription(status),
      statusTimeline: createInitialOrderStatusTimeline(createdAtIso),
      dateIso: createdAtIso,
      createdAtIso,
      updatedAtIso: createdAtIso,
      subtotalInCents,
      shippingInCents,
      totalInCents,
      total: totalInCents / 100,
      totalLabel: formatPriceBRL(totalInCents),
      items: normalizedItems,
      delivery: {
        ...delivery,
        complement: delivery.complement || "",
      },
      paymentSummary,
      stripe: stripePayload,
      stripeCheckoutSessionId: session.id,
      source: "petpage-stripe-checkout",
    };

    transaction.set(checkoutSessionRef, {
      stripeCheckoutSessionId: session.id,
      customerId: normalizedCustomerId,
      orderId,
      orderCode,
      paymentIntentId,
      paymentStatus: session.payment_status,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso,
    });
    transaction.set(globalOrderRef, {
      ...baseOrderPayload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(customerOrderRef, {
      ...baseOrderPayload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(
      cartRef,
      {
        customerId: normalizedCustomerId,
        items: [],
        subtotalInCents: 0,
        updatedAtIso: createdAtIso,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: "created" as const,
      orderId,
      orderCode,
    };
  });

  if (transactionResult.status === "created") {
    void publishOrderNotifications({
      customerId: normalizedCustomerId,
      orderCode: transactionResult.orderCode,
      actorEmail: session.customer_details?.email || session.customer_email,
    });
  }

  return transactionResult;
}
