"use client";

import type { Cart, CartItem } from "@/domain/cart-checkout/entities/cart";
import {
  calculateSubtotalInCents,
  createEmptyCart,
  FirebaseCartRepository,
  normalizeCart,
} from "@/infrastructure/cart-checkout/firebase-cart.adapter";
import { waitForFirebaseUser } from "@/infrastructure/auth/firebase-auth.adapter";
import {
  clearGuestCartStorage,
  readGuestCartFromStorage,
  saveGuestCartToStorage,
} from "@/utils/cart-checkout/guest-cart-storage";

export type CartPersistenceMode = "remote" | "local";

export type CartOperationResult = {
  cart: Cart;
  mode: CartPersistenceMode;
  customerId?: string;
};

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

const cartRepository = new FirebaseCartRepository();

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

      return {
        cart: updatedCart,
        mode: "remote",
        customerId,
      };
    } catch (error) {
      console.warn("Remote cart save failed, falling back to local storage:", error);
    }
  }

  const guestCart = loadGuestCart();
  const updatedGuestCart = saveGuestCart(
    buildCart(undefined, mergeCartItems(guestCart.items, [newItem]))
  );

  return {
    cart: updatedGuestCart,
    mode: "local",
  };
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

      return {
        cart: updatedCart,
        mode: "remote",
        customerId: normalizedCustomerId,
      };
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
  return {
    cart: updatedGuestCart,
    mode: "local",
  };
}

export async function clearCart(
  options: { customerId?: string } = {}
): Promise<CartOperationResult> {
  const normalizedCustomerId = await resolveAuthCustomerId(options.customerId);
  if (normalizedCustomerId) {
    try {
      await cartRepository.clear(normalizedCustomerId);
      return {
        cart: createEmptyCart(normalizedCustomerId),
        mode: "remote",
        customerId: normalizedCustomerId,
      };
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
    }
  }

  clearGuestCartStorage();
  return {
    cart: createEmptyCart(),
    mode: "local",
  };
}

export function getCartItemsCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0);
}
