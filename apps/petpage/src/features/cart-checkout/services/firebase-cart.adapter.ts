"use client";

import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import type { Cart, CartItem } from "@/features/cart-checkout/types/cart";
import type { CartRepository } from "@/features/cart-checkout/repositories/cart-repository";
import { getFirebaseApp } from "@/lib/auth/firebase-auth.adapter";

type FirestoreCartItemRecord = {
  productId: string;
  title: string;
  category: string;
  imageUrl: string;
  quantity: number;
  unitPriceInCents: number;
};

type FirestoreCartRecord = {
  customerId: string;
  items: FirestoreCartItemRecord[];
  subtotalInCents: number;
  updatedAtIso: string;
};

export type FirebaseCartCheckoutAdapter = {
  provider: "firestore";
  customersCollection: "customers";
  cartCollection: "carts";
  orderCollection: "orders";
  defaultCartDocId: "active";
};

export const firebaseCartCheckoutAdapter: FirebaseCartCheckoutAdapter = {
  provider: "firestore",
  customersCollection: "customers",
  cartCollection: "carts",
  orderCollection: "orders",
  defaultCartDocId: "active",
};

function getDb() {
  return getFirestore(getFirebaseApp());
}

function createEmptyCart(customerId?: string): Cart {
  return {
    customerId,
    items: [],
    subtotalInCents: 0,
    updatedAtIso: new Date().toISOString(),
  };
}

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

function sanitizeItem(item: CartItem): CartItem | null {
  const normalizedProductId = item.productId.trim();
  const normalizedTitle = item.title.trim();
  const quantity = Math.max(Math.round(item.quantity), 0);
  const unitPriceInCents = Math.max(Math.round(item.unitPriceInCents), 0);
  const category = item.category?.trim() || undefined;
  const imageUrl = item.imageUrl?.trim() || undefined;

  if (!normalizedProductId || !normalizedTitle || quantity <= 0) {
    return null;
  }

  return {
    productId: normalizedProductId,
    title: normalizedTitle,
    category,
    imageUrl,
    quantity,
    unitPriceInCents,
  };
}

function calculateSubtotalInCents(items: CartItem[]): number {
  return items.reduce((subtotal, item) => subtotal + item.quantity * item.unitPriceInCents, 0);
}

function normalizeCart(cart: Cart): Cart {
  const sanitizedItems = cart.items
    .map((item) => sanitizeItem(item))
    .filter((item): item is CartItem => item !== null);

  return {
    customerId: cart.customerId?.trim() || undefined,
    items: sanitizedItems,
    subtotalInCents: calculateSubtotalInCents(sanitizedItems),
    updatedAtIso: cart.updatedAtIso || new Date().toISOString(),
  };
}

function mapFirestoreCartItemRecord(payload: unknown): CartItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Partial<FirestoreCartItemRecord>;
  return sanitizeItem({
    productId: toStringValue(record.productId),
    title: toStringValue(record.title),
    category: toStringValue(record.category),
    imageUrl: toStringValue(record.imageUrl),
    quantity: toNumberValue(record.quantity, 0),
    unitPriceInCents: toNumberValue(record.unitPriceInCents, 0),
  });
}

function mapFirestoreCartRecord(customerId: string, payload: unknown): Cart {
  if (!payload || typeof payload !== "object") {
    return createEmptyCart(customerId);
  }

  const record = payload as Partial<FirestoreCartRecord>;
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => mapFirestoreCartItemRecord(item))
        .filter((item): item is CartItem => item !== null)
    : [];

  const subtotalFromPayload = toNumberValue(record.subtotalInCents, Number.NaN);
  const subtotalInCents = Number.isFinite(subtotalFromPayload)
    ? Math.max(Math.round(subtotalFromPayload), 0)
    : calculateSubtotalInCents(items);

  return {
    customerId,
    items,
    subtotalInCents,
    updatedAtIso: toStringValue(record.updatedAtIso, new Date().toISOString()),
  };
}

function cartDocumentRef(customerId: string) {
  return doc(
    getDb(),
    firebaseCartCheckoutAdapter.customersCollection,
    customerId,
    firebaseCartCheckoutAdapter.cartCollection,
    firebaseCartCheckoutAdapter.defaultCartDocId
  );
}

export class FirebaseCartRepository implements CartRepository {
  async getActiveCart(customerId?: string): Promise<Cart> {
    const normalizedCustomerId = customerId?.trim();
    if (!normalizedCustomerId) {
      return createEmptyCart();
    }

    const cartSnapshot = await getDoc(cartDocumentRef(normalizedCustomerId));
    if (!cartSnapshot.exists()) {
      return createEmptyCart(normalizedCustomerId);
    }

    return mapFirestoreCartRecord(normalizedCustomerId, cartSnapshot.data());
  }

  async save(cart: Cart): Promise<void> {
    const normalizedCart = normalizeCart(cart);
    const normalizedCustomerId = normalizedCart.customerId?.trim();
    if (!normalizedCustomerId) {
      return;
    }

    await setDoc(
      cartDocumentRef(normalizedCustomerId),
      {
        customerId: normalizedCustomerId,
        items: normalizedCart.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          category: item.category || "",
          imageUrl: item.imageUrl || "",
          quantity: item.quantity,
          unitPriceInCents: item.unitPriceInCents,
        })),
        subtotalInCents: normalizedCart.subtotalInCents,
        updatedAtIso: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async clear(customerId: string): Promise<void> {
    const normalizedCustomerId = customerId.trim();
    if (!normalizedCustomerId) {
      return;
    }

    await setDoc(
      cartDocumentRef(normalizedCustomerId),
      {
        customerId: normalizedCustomerId,
        items: [],
        subtotalInCents: 0,
        updatedAtIso: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export { createEmptyCart, calculateSubtotalInCents, normalizeCart };
