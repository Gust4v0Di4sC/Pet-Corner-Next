"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@/domain/cart-checkout/entities/cart";
import {
  CUSTOMER_CART_CHANGED_EVENT,
  clearCart,
  loadCustomerOrGuestCart,
  setCartItemQuantity,
  type CartOperationResult,
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

function createEmptyCart(customerId?: string): Cart {
  return {
    customerId,
    items: [],
    subtotalInCents: 0,
  };
}

export function useCustomerCart(options: UseCustomerCartOptions = {}) {
  const queryClient = useQueryClient();
  const normalizedCustomerId = useMemo(() => options.customerId?.trim(), [options.customerId]);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  const cartQueryKey = useMemo(
    () => ["customer-cart", normalizedCustomerId || "guest"] as const,
    [normalizedCustomerId]
  );

  const {
    isLoading,
    data,
    error,
    refetch,
  } = useQuery({
    queryKey: cartQueryKey,
    queryFn: async () =>
      loadCustomerOrGuestCart({
        customerId: normalizedCustomerId,
        mergeGuestCart: Boolean(normalizedCustomerId),
      }),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async (payload: { productId: string; quantity: number }) =>
      setCartItemQuantity({
        productId: payload.productId,
        quantity: payload.quantity,
        customerId: normalizedCustomerId,
      }),
    onSuccess: (result) => {
      setMutationErrorMessage(null);
      queryClient.setQueryData<CartOperationResult>(cartQueryKey, result);
    },
    onError: (mutationError) => {
      setMutationErrorMessage(mapErrorMessage(mutationError));
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () =>
      clearCart({
        customerId: normalizedCustomerId,
      }),
    onSuccess: (result) => {
      setMutationErrorMessage(null);
      queryClient.setQueryData<CartOperationResult>(cartQueryKey, result);
    },
    onError: (mutationError) => {
      setMutationErrorMessage(mapErrorMessage(mutationError));
    },
  });

  useEffect(() => {
    const handleCartChanged = () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    };

    window.addEventListener(CUSTOMER_CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CUSTOMER_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [cartQueryKey, queryClient]);

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      setMutationErrorMessage(null);
      try {
        await updateQuantityMutation.mutateAsync({ productId, quantity });
      } catch {
        return;
      }
    },
    [updateQuantityMutation]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await updateQuantity(productId, 0);
    },
    [updateQuantity]
  );

  const clearAll = useCallback(async () => {
    setMutationErrorMessage(null);
    try {
      await clearAllMutation.mutateAsync();
    } catch {
      return;
    }
  }, [clearAllMutation]);

  const cart = data?.cart || createEmptyCart(normalizedCustomerId);
  const mode: CartPersistenceMode = data?.mode || "local";
  const queryErrorMessage = error ? mapErrorMessage(error) : null;

  return {
    isLoading,
    isMutating: updateQuantityMutation.isPending || clearAllMutation.isPending,
    errorMessage: mutationErrorMessage || queryErrorMessage,
    mode,
    cart,
    reload,
    updateQuantity,
    removeItem,
    clearAll,
  };
}
