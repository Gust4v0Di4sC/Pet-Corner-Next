"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomerOrderTrackingView } from "@/features/cart-checkout/types/order-tracking";
import { listCustomerTrackingOrders } from "@/features/cart-checkout/services/customer-order-tracking.service";

type UseCustomerOrderTrackingOptions = {
  customerId?: string;
};

function mapErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "permission-denied") {
      return "Sua conta nao tem permissao para visualizar os pedidos agora.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message.toLowerCase().includes("missing or insufficient permissions")) {
      return "Sua conta nao tem permissao para visualizar os pedidos agora.";
    }
    return error.message;
  }

  return "Nao foi possivel carregar os pedidos agora.";
}

export function useCustomerOrderTracking(options: UseCustomerOrderTrackingOptions = {}) {
  const normalizedCustomerId = useMemo(() => options.customerId?.trim() || "", [options.customerId]);
  const hasValidCustomerId = Boolean(normalizedCustomerId);

  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["customer-orders-tracking", normalizedCustomerId],
    enabled: hasValidCustomerId,
    queryFn: async () => listCustomerTrackingOrders(normalizedCustomerId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const reload = useCallback(async () => {
    if (!hasValidCustomerId) {
      return;
    }

    await refetch();
  }, [hasValidCustomerId, refetch]);

  return {
    isLoading: hasValidCustomerId ? isLoading : false,
    errorMessage: error ? mapErrorMessage(error) : null,
    orders: (data || []) as CustomerOrderTrackingView[],
    reload,
  };
}

