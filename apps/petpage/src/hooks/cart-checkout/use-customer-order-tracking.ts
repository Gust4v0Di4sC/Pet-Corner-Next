"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrderTrackingView } from "@/domain/cart-checkout/entities/order-tracking";
import { listCustomerTrackingOrders } from "@/services/cart-checkout/customer-order-tracking.service";

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrderTrackingView[]>([]);

  const loadOrders = useCallback(async (config?: { background?: boolean }) => {
    const isBackground = Boolean(config?.background);
    if (!normalizedCustomerId) {
      setOrders([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    if (!isBackground) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    try {
      const loadedOrders = await listCustomerTrackingOrders(normalizedCustomerId);
      setOrders(loadedOrders);
      setErrorMessage(null);
    } catch (error) {
      if (!isBackground) {
        setErrorMessage(mapErrorMessage(error));
      }
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  }, [normalizedCustomerId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadOrders();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadOrders]);

  return {
    isLoading,
    errorMessage,
    orders,
    reload: loadOrders,
  };
}
