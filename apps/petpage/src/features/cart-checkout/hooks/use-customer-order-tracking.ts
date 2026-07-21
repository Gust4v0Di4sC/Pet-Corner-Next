"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomerOrderTrackingView } from "@/features/cart-checkout/types/order-tracking";
import { listCustomerTrackingOrders } from "@/features/cart-checkout/services/customer-order-tracking.service";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

type UseCustomerOrderTrackingOptions = {
  customerId?: string;
};

function mapErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar seus pedidos agora.", {
    permissionMessage:
      "Sua sessao expirou. Entre novamente para visualizar seus pedidos.",
  });
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
