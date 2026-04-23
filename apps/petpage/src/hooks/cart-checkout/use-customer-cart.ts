"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/domain/cart-checkout/entities/cart";
import {
  clearCart,
  loadCustomerOrGuestCart,
  setCartItemQuantity,
  type CartPersistenceMode,
} from "@/services/cart-checkout/customer-cart.service";

type UseCustomerCartOptions = {
  customerId?: string;
};

function mapErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "permission-denied") {
      return "Sua conta nao tem permissao para acessar o carrinho agora.";
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message.toLowerCase().includes("missing or insufficient permissions")) {
      return "Sua conta nao tem permissao para acessar o carrinho agora.";
    }
    return error.message;
  }

  return "Nao foi possivel carregar o carrinho agora.";
}

export function useCustomerCart(options: UseCustomerCartOptions = {}) {
  const normalizedCustomerId = useMemo(() => options.customerId?.trim(), [options.customerId]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<CartPersistenceMode>("local");
  const [cart, setCart] = useState<Cart>({
    customerId: normalizedCustomerId,
    items: [],
    subtotalInCents: 0,
  });

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await loadCustomerOrGuestCart({
        customerId: normalizedCustomerId,
        mergeGuestCart: Boolean(normalizedCustomerId),
      });
      setCart(result.cart);
      setMode(result.mode);
    } catch (error) {
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [normalizedCustomerId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void reload();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reload]);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      setIsMutating(true);
      setErrorMessage(null);

      try {
        const result = await setCartItemQuantity({
          productId,
          quantity,
          customerId: normalizedCustomerId,
        });
        setCart(result.cart);
        setMode(result.mode);
      } catch (error) {
        setErrorMessage(mapErrorMessage(error));
      } finally {
        setIsMutating(false);
      }
    },
    [normalizedCustomerId]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await updateQuantity(productId, 0);
    },
    [updateQuantity]
  );

  const clearAll = useCallback(async () => {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      const result = await clearCart({
        customerId: normalizedCustomerId,
      });
      setCart(result.cart);
      setMode(result.mode);
    } catch (error) {
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  }, [normalizedCustomerId]);

  return {
    isLoading,
    isMutating,
    errorMessage,
    mode,
    cart,
    reload,
    updateQuantity,
    removeItem,
    clearAll,
  };
}
