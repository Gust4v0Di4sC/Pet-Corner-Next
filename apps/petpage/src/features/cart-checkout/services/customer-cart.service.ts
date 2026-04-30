"use client";

import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type { Cart, CartItem } from "@/features/cart-checkout/types/cart";
import {
  getOrderStatusDescription,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/features/cart-checkout/types/order-tracking";
import {
  calculateSubtotalInCents,
  createEmptyCart,
  FirebaseCartRepository,
  normalizeCart,
} from "@/features/cart-checkout/services/firebase-cart.adapter";
import { getFirebaseApp, waitForFirebaseUser } from "@/lib/auth/firebase-auth.adapter";
import {
  clearGuestCartStorage,
  readGuestCartFromStorage,
  saveGuestCartToStorage,
} from "@/features/cart-checkout/utils/guest-cart-storage";
import {
  createAdminBroadcastNotification,
  createCustomerNotification,
} from "@/features/notifications/services/customer-notification.service";
import { formatPriceBRL } from "@/lib/formatters/price";

export type CartPersistenceMode = "remote" | "local";

export type CartOperationResult = {
  cart: Cart;
  mode: CartPersistenceMode;
  customerId?: string;
};

export const CUSTOMER_CART_CHANGED_EVENT = "petcorner:cart-changed";

export type AddProductToCartInput = {
  productId?: string;
  title: string;
  category?: string;
  imageUrl?: string;
  priceLabel?: string;
  unitPriceInCents?: number;
  quantity?: number;
};

type LoadCartOptions = {
  customerId?: string;
  mergeGuestCart?: boolean;
};

type UpdateCartItemQuantityInput = {
  productId: string;
  quantity: number;
  customerId?: string;
};

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

export type CheckoutPaymentInput = {
  cardHolderName: string;
  cardLast4: string;
  expiryMonth: number;
  expiryYear: number;
};

type FinalizeCustomerCheckoutInput = {
  customerId?: string;
  delivery: CheckoutDeliveryInput;
  payment: CheckoutPaymentInput;
  shippingInCents?: number;
};

export type FinalizeCustomerCheckoutResult = {
  orderId: string;
  orderLabel: string;
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
};

const cartRepository = new FirebaseCartRepository();
const DEFAULT_CHECKOUT_SHIPPING_IN_CENTS = 1490;

function isPermissionDeniedError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "permission-denied") {
      return true;
    }
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes("missing or insufficient permissions");
  }

  return false;
}

function normalizeCustomerId(customerId: string | null | undefined): string | undefined {
  const normalizedCustomerId = customerId?.trim();
  if (!normalizedCustomerId) {
    return undefined;
  }
  return normalizedCustomerId;
}

function resolveItemQuantity(quantity: number | undefined): number {
  const parsedQuantity = Math.max(Math.round(quantity ?? 1), 0);
  return parsedQuantity || 1;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildFallbackProductId(title: string): string {
  const slug = slugify(title);
  return slug ? `produto-${slug}` : `produto-${Date.now()}`;
}

function parsePriceLabelToCents(priceLabel: string): number {
  const normalizedPriceLabel = priceLabel.trim();
  if (!normalizedPriceLabel) {
    return 0;
  }

  const normalizedNumeric = normalizedPriceLabel
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsedValue = Number.parseFloat(normalizedNumeric);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(Math.round(parsedValue * 100), 0);
}

function toCartItem(input: AddProductToCartInput): CartItem {
  const normalizedTitle = input.title.trim() || "Produto Pet Corner";
  const normalizedCategory = input.category?.trim() || undefined;
  const normalizedImageUrl = input.imageUrl?.trim() || undefined;
  const normalizedProductId = input.productId?.trim() || buildFallbackProductId(normalizedTitle);
  const unitPriceInCents = Math.max(
    Math.round(input.unitPriceInCents ?? parsePriceLabelToCents(input.priceLabel || "")),
    0
  );

  return {
    productId: normalizedProductId,
    title: normalizedTitle,
    category: normalizedCategory,
    imageUrl: normalizedImageUrl,
    quantity: resolveItemQuantity(input.quantity),
    unitPriceInCents,
  };
}

function mergeCartItems(baseItems: CartItem[], incomingItems: CartItem[]): CartItem[] {
  const itemsMap = new Map<string, CartItem>();

  for (const item of baseItems) {
    itemsMap.set(item.productId, {
      ...item,
      quantity: Math.max(Math.round(item.quantity), 0),
      unitPriceInCents: Math.max(Math.round(item.unitPriceInCents), 0),
    });
  }

  for (const incomingItem of incomingItems) {
    const existingItem = itemsMap.get(incomingItem.productId);
    if (!existingItem) {
      itemsMap.set(incomingItem.productId, incomingItem);
      continue;
    }

    itemsMap.set(incomingItem.productId, {
      productId: incomingItem.productId,
      title: incomingItem.title || existingItem.title,
      category: incomingItem.category || existingItem.category,
      imageUrl: incomingItem.imageUrl || existingItem.imageUrl,
      quantity: existingItem.quantity + incomingItem.quantity,
      unitPriceInCents: incomingItem.unitPriceInCents || existingItem.unitPriceInCents,
    });
  }

  return Array.from(itemsMap.values()).filter((item) => item.quantity > 0);
}

function buildCart(customerId: string | undefined, items: CartItem[]): Cart {
  return normalizeCart({
    customerId,
    items,
    subtotalInCents: calculateSubtotalInCents(items),
    updatedAtIso: new Date().toISOString(),
  });
}

function createOrderLabel(orderId: string): string {
  return `PED-${orderId.slice(0, 8).toUpperCase()}`;
}

function createInitialOrderStatusTimeline(createdAtIso: string): Array<{
  status: OrderStatus;
  label: string;
  description: string;
  createdAtIso: string;
}> {
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

function emitCartChanged(result: CartOperationResult): void {
  if (typeof window === "undefined") {
    return;
  }

  const itemCount = result.cart.items.reduce(
    (totalItems, item) => totalItems + Math.max(Math.round(item.quantity), 0),
    0
  );

  window.dispatchEvent(
    new CustomEvent(CUSTOMER_CART_CHANGED_EVENT, {
      detail: {
        customerId: result.customerId,
        mode: result.mode,
        itemCount,
        subtotalInCents: result.cart.subtotalInCents,
        updatedAtIso: result.cart.updatedAtIso,
      },
    })
  );
}

function publishAddToCartNotification(params: {
  customerId: string;
  title: string;
  quantity: number;
}): void {
  const normalizedCustomerId = params.customerId.trim();
  if (!normalizedCustomerId) {
    return;
  }

  const normalizedTitle = params.title.trim() || "Produto";
  const quantity = Math.max(1, Math.round(params.quantity));
  const message = `${normalizedTitle} foi adicionado ao carrinho (${quantity} unidade${
    quantity > 1 ? "s" : ""
  }).`;

  void createCustomerNotification({
    customerId: normalizedCustomerId,
    title: "Produto adicionado ao carrinho",
    message,
    category: "cart",
    linkHref: "/cart",
  }).catch(() => {
    return;
  });

  void createAdminBroadcastNotification({
    title: "Interacao no carrinho",
    message: `Cliente ${normalizedCustomerId} adicionou ${normalizedTitle} ao carrinho.`,
    category: "cart",
    actorCustomerId: normalizedCustomerId,
  }).catch(() => {
    return;
  });
}

function loadGuestCart(): Cart {
  return normalizeCart(readGuestCartFromStorage());
}

function saveGuestCart(cart: Cart): Cart {
  const normalizedCart = buildCart(undefined, cart.items);
  saveGuestCartToStorage(normalizedCart);
  return normalizedCart;
}

async function resolveAuthCustomerId(fallbackCustomerId?: string): Promise<string | undefined> {
  const normalizedFallbackCustomerId = normalizeCustomerId(fallbackCustomerId);

  try {
    const firebaseUser = await waitForFirebaseUser({ timeoutMs: 2800 });
    const normalizedAuthCustomerId = normalizeCustomerId(firebaseUser?.uid);
    if (normalizedAuthCustomerId) {
      return normalizedAuthCustomerId;
    }
  } catch {
    // fallback below
  }

  return normalizedFallbackCustomerId;
}

export async function syncGuestCartToCustomerCart(customerId: string): Promise<Cart> {
  const normalizedCustomerId = await resolveAuthCustomerId(customerId);
  if (!normalizedCustomerId) {
    return loadGuestCart();
  }

  try {
    const guestCart = loadGuestCart();
    const customerCart = await cartRepository.getActiveCart(normalizedCustomerId);

    if (!guestCart.items.length) {
      return customerCart;
    }

    const mergedItems = mergeCartItems(customerCart.items, guestCart.items);
    const mergedCart = buildCart(normalizedCustomerId, mergedItems);
    await cartRepository.save(mergedCart);
    clearGuestCartStorage();
    emitCartChanged({
      cart: mergedCart,
      mode: "remote",
      customerId: normalizedCustomerId,
    });
    return mergedCart;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return loadGuestCart();
    }
    throw error;
  }
}

export async function loadCustomerOrGuestCart(
  options: LoadCartOptions = {}
): Promise<CartOperationResult> {
  const normalizedCustomerId = await resolveAuthCustomerId(options.customerId);
  if (!normalizedCustomerId) {
    return {
      cart: loadGuestCart(),
      mode: "local",
    };
  }

  try {
    const cart = options.mergeGuestCart
      ? await syncGuestCartToCustomerCart(normalizedCustomerId)
      : await cartRepository.getActiveCart(normalizedCustomerId);
    const guestCart = loadGuestCart();
    if (!options.mergeGuestCart && !cart.items.length && guestCart.items.length) {
      return {
        cart: guestCart,
        mode: "local",
      };
    }
    const isRemoteCart =
      cart.customerId?.trim().toLowerCase() === normalizedCustomerId.toLowerCase();

    return {
      cart,
      mode: isRemoteCart ? "remote" : "local",
      customerId: isRemoteCart ? normalizedCustomerId : undefined,
    };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return {
        cart: loadGuestCart(),
        mode: "local",
      };
    }
    throw error;
  }
}

export async function addProductToCart(
  input: AddProductToCartInput,
  options: { customerId?: string } = {}
): Promise<CartOperationResult> {
  const newItem = toCartItem(input);
  const customerId = await resolveAuthCustomerId(options.customerId);

  if (customerId) {
    try {
      const currentCart = await cartRepository.getActiveCart(customerId);
      const updatedCart = buildCart(customerId, mergeCartItems(currentCart.items, [newItem]));
      await cartRepository.save(updatedCart);
      publishAddToCartNotification({
        customerId,
        title: newItem.title,
        quantity: newItem.quantity,
      });

      const result: CartOperationResult = {
        cart: updatedCart,
        mode: "remote",
        customerId,
      };
      emitCartChanged(result);
      return result;
    } catch (error) {
      console.warn("Remote cart save failed, falling back to local storage:", error);
    }
  }

  const guestCart = loadGuestCart();
  const updatedGuestCart = saveGuestCart(
    buildCart(undefined, mergeCartItems(guestCart.items, [newItem]))
  );

  const result: CartOperationResult = {
    cart: updatedGuestCart,
    mode: "local",
  };
  emitCartChanged(result);
  return result;
}

export async function setCartItemQuantity(
  input: UpdateCartItemQuantityInput
): Promise<CartOperationResult> {
  const normalizedProductId = input.productId.trim();
  if (!normalizedProductId) {
    return {
      cart: createEmptyCart(input.customerId),
      mode: input.customerId ? "remote" : "local",
      customerId: input.customerId,
    };
  }

  const normalizedCustomerId = await resolveAuthCustomerId(input.customerId);
  if (normalizedCustomerId) {
    try {
      const currentCart = await cartRepository.getActiveCart(normalizedCustomerId);
      const normalizedQuantity = Math.max(Math.round(input.quantity), 0);
      const updatedItems = currentCart.items
        .map((item) =>
          item.productId === normalizedProductId
            ? {
                ...item,
                quantity: normalizedQuantity,
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      const updatedCart = buildCart(normalizedCustomerId, updatedItems);
      await cartRepository.save(updatedCart);

      const result: CartOperationResult = {
        cart: updatedCart,
        mode: "remote",
        customerId: normalizedCustomerId,
      };
      emitCartChanged(result);
      return result;
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
    }
  }

  const guestCart = loadGuestCart();
  const normalizedQuantity = Math.max(Math.round(input.quantity), 0);
  const updatedItems = guestCart.items
    .map((item) =>
      item.productId === normalizedProductId
        ? {
            ...item,
            quantity: normalizedQuantity,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  const updatedGuestCart = saveGuestCart(buildCart(undefined, updatedItems));
  const result: CartOperationResult = {
    cart: updatedGuestCart,
    mode: "local",
  };
  emitCartChanged(result);
  return result;
}

export async function clearCart(
  options: { customerId?: string } = {}
): Promise<CartOperationResult> {
  const normalizedCustomerId = await resolveAuthCustomerId(options.customerId);
  if (normalizedCustomerId) {
    try {
      await cartRepository.clear(normalizedCustomerId);
      const result: CartOperationResult = {
        cart: createEmptyCart(normalizedCustomerId),
        mode: "remote",
        customerId: normalizedCustomerId,
      };
      emitCartChanged(result);
      return result;
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
    }
  }

  clearGuestCartStorage();
  const result: CartOperationResult = {
    cart: createEmptyCart(),
    mode: "local",
  };
  emitCartChanged(result);
  return result;
}

export async function finalizeCustomerCheckout(
  input: FinalizeCustomerCheckoutInput
): Promise<FinalizeCustomerCheckoutResult> {
  const normalizedCustomerId = await resolveAuthCustomerId(input.customerId);
  if (!normalizedCustomerId) {
    throw new Error("Faca login para finalizar o pedido.");
  }

  const cartResult = await loadCustomerOrGuestCart({
    customerId: normalizedCustomerId,
    mergeGuestCart: true,
  });
  const activeCart = cartResult.cart;

  if (!activeCart.items.length) {
    throw new Error("Seu carrinho esta vazio.");
  }

  const shippingInCents = Math.max(
    Math.round(input.shippingInCents ?? DEFAULT_CHECKOUT_SHIPPING_IN_CENTS),
    0
  );
  const subtotalInCents = Math.max(Math.round(activeCart.subtotalInCents), 0);
  const totalInCents = subtotalInCents + shippingInCents;
  const createdAtIso = new Date().toISOString();

  const firestore = getFirestore(getFirebaseApp());
  const globalOrderRef = doc(collection(firestore, "orders"));
  const orderId = globalOrderRef.id;
  const orderCode = createOrderLabel(orderId);
  const customerOrderRef = doc(
    firestore,
    "customers",
    normalizedCustomerId,
    "orders",
    orderId
  );
  const status: OrderStatus = "pedido_recebido";
  const statusLabel = getOrderStatusLabel(status);
  const statusDescription = getOrderStatusDescription(status);
  const statusTimeline = createInitialOrderStatusTimeline(createdAtIso);
  const normalizedItems = activeCart.items.map((item) => ({
    productId: item.productId,
    title: item.title,
    category: item.category || "",
    imageUrl: item.imageUrl || "",
    quantity: item.quantity,
    unitPriceInCents: item.unitPriceInCents,
  }));
  const deliveryPayload = {
    fullName: input.delivery.fullName,
    phone: input.delivery.phone,
    zipCode: input.delivery.zipCode,
    city: input.delivery.city,
    street: input.delivery.street,
    number: input.delivery.number,
    district: input.delivery.district,
    state: input.delivery.state,
    complement: input.delivery.complement || "",
  };
  const paymentSummaryPayload = {
    method: "credit_card" as const,
    cardHolderName: input.payment.cardHolderName,
    cardLast4: input.payment.cardLast4,
    expiryMonth: input.payment.expiryMonth,
    expiryYear: input.payment.expiryYear,
  };

  const baseOrderPayload = {
    orderId,
    orderCode,
    customerId: normalizedCustomerId,
    label: orderCode,
    status,
    statusLabel,
    statusDescription,
    statusTimeline,
    dateIso: createdAtIso,
    createdAtIso,
    updatedAtIso: createdAtIso,
    subtotalInCents,
    shippingInCents,
    totalInCents,
    total: totalInCents / 100,
    totalLabel: formatPriceBRL(totalInCents),
    items: normalizedItems,
    delivery: deliveryPayload,
    paymentSummary: paymentSummaryPayload,
    source: "petpage-checkout",
  };

  const batch = writeBatch(firestore);
  batch.set(
    globalOrderRef,
    {
      ...baseOrderPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  batch.set(
    customerOrderRef,
    {
      ...baseOrderPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();

  await clearCart({ customerId: normalizedCustomerId });

  void createCustomerNotification({
    customerId: normalizedCustomerId,
    title: "Pedido finalizado",
    message: `Seu pedido ${orderCode} foi recebido e esta em processamento.`,
    category: "order",
    linkHref: "/rastreamento",
  }).catch(() => {
    return;
  });

  void createAdminBroadcastNotification({
    title: "Novo pedido no checkout",
    message: `Cliente ${normalizedCustomerId} finalizou o pedido ${orderCode}.`,
    category: "order",
    actorCustomerId: normalizedCustomerId,
  }).catch(() => {
    return;
  });

  return {
    orderId,
    orderLabel: orderCode,
    subtotalInCents,
    shippingInCents,
    totalInCents,
  };
}

export function getCartItemsCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0);
}
