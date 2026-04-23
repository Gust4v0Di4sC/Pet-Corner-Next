import type { Cart, CartItem } from "@/domain/cart-checkout/entities/cart";

const GUEST_CART_STORAGE_KEY = "pc_guest_cart_v1";

type StoredGuestCart = {
  items: CartItem[];
  updatedAtIso: string;
};

function calculateSubtotalInCents(items: CartItem[]): number {
  return items.reduce((subtotal, item) => subtotal + item.quantity * item.unitPriceInCents, 0);
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
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

function sanitizeStoredItem(payload: unknown): CartItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Partial<CartItem>;
  const productId = toStringValue(record.productId).trim();
  const title = toStringValue(record.title).trim();
  const quantity = Math.max(Math.round(toNumberValue(record.quantity, 0)), 0);
  const unitPriceInCents = Math.max(Math.round(toNumberValue(record.unitPriceInCents, 0)), 0);
  const category = toStringValue(record.category).trim() || undefined;
  const imageUrl = toStringValue(record.imageUrl).trim() || undefined;

  if (!productId || !title || quantity <= 0) {
    return null;
  }

  return {
    productId,
    title,
    category,
    imageUrl,
    quantity,
    unitPriceInCents,
  };
}

export function readGuestCartFromStorage(): Cart {
  if (!hasWindow()) {
    return {
      items: [],
      subtotalInCents: 0,
    };
  }

  const rawPayload = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
  if (!rawPayload) {
    return {
      items: [],
      subtotalInCents: 0,
    };
  }

  try {
    const parsedPayload = JSON.parse(rawPayload) as Partial<StoredGuestCart>;
    const items = Array.isArray(parsedPayload.items)
      ? parsedPayload.items
          .map((item) => sanitizeStoredItem(item))
          .filter((item): item is CartItem => item !== null)
      : [];

    return {
      items,
      subtotalInCents: calculateSubtotalInCents(items),
      updatedAtIso: toStringValue(parsedPayload.updatedAtIso, new Date().toISOString()),
    };
  } catch {
    return {
      items: [],
      subtotalInCents: 0,
    };
  }
}

export function saveGuestCartToStorage(cart: Cart): void {
  if (!hasWindow()) {
    return;
  }

  const storedPayload: StoredGuestCart = {
    items: cart.items,
    updatedAtIso: cart.updatedAtIso || new Date().toISOString(),
  };

  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(storedPayload));
}

export function clearGuestCartStorage(): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

export { GUEST_CART_STORAGE_KEY };
