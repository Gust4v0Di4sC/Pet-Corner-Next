import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeliveryIssueStatus, OrderStatus } from "../types/orderTracking";
import {
  listAdminOrders,
  listDeliveryIssues,
  updateDeliveryIssueStatus,
  updateOrderStatus,
} from "../services/orderTrackingService";

type OrderStatusFilter = OrderStatus | "all";
type DeliveryIssueStatusFilter = DeliveryIssueStatus | "all";

const ORDER_OPERATIONS_QUERY_KEYS = {
  orders: (status: OrderStatusFilter) => ["order-operations", "orders", status] as const,
  issues: (status: DeliveryIssueStatusFilter) => ["order-operations", "issues", status] as const,
};

function mapErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;

    if (code === "permission-denied") {
      return "Sem permissao para acessar os dados de pedidos.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message.toLowerCase().includes("insufficient permissions")) {
      return "Sem permissao para acessar os dados de pedidos.";
    }

    return error.message;
  }

  return fallback;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function useOrderOperations() {
  const queryClient = useQueryClient();
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("all");
  const [deliveryIssueStatusFilter, setDeliveryIssueStatusFilter] =
    useState<DeliveryIssueStatusFilter>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: reloadOrders,
  } = useQuery({
    queryKey: ORDER_OPERATIONS_QUERY_KEYS.orders(orderStatusFilter),
    queryFn: async () =>
      listAdminOrders({
        status: orderStatusFilter === "all" ? undefined : orderStatusFilter,
        maxResults: 200,
      }),
  });

  const {
    data: deliveryIssues = [],
    isLoading: isDeliveryIssuesLoading,
    error: deliveryIssuesError,
    refetch: reloadDeliveryIssues,
  } = useQuery({
    queryKey: ORDER_OPERATIONS_QUERY_KEYS.issues(deliveryIssueStatusFilter),
    queryFn: async () =>
      listDeliveryIssues({
        status: deliveryIssueStatusFilter === "all" ? undefined : deliveryIssueStatusFilter,
        maxResults: 200,
      }),
  });

  const filteredOrders = useMemo(() => {
    const normalizedSearch = normalizeSearch(orderSearch);
    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) =>
      [order.orderCode, order.id, order.customerId, order.delivery.fullName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [orderSearch, orders]);

  const filteredDeliveryIssues = useMemo(() => {
    const normalizedSearch = normalizeSearch(issueSearch);
    if (!normalizedSearch) {
      return deliveryIssues;
    }

    return deliveryIssues.filter((issue) =>
      [issue.id, issue.orderCode ?? "", issue.orderId ?? "", issue.customerId, issue.message]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [deliveryIssues, issueSearch]);

  const selectedOrder = useMemo(() => {
    if (!filteredOrders.length) {
      return null;
    }

    if (!selectedOrderId) {
      return filteredOrders[0];
    }

    return filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];
  }, [filteredOrders, selectedOrderId]);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, nextStatus }: { orderId: string; nextStatus: OrderStatus }) => {
      await updateOrderStatus({ orderId, nextStatus });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["order-operations", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["order-operations", "issues"] }),
      ]);
    },
  });

  const updateDeliveryIssueStatusMutation = useMutation({
    mutationFn: async (params: {
      issueId: string;
      nextStatus: DeliveryIssueStatus;
      triageNotes?: string;
    }) => {
      await updateDeliveryIssueStatus(params);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["order-operations", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["order-operations", "issues"] }),
      ]);
    },
  });

  return {
    isLoading: isOrdersLoading || isDeliveryIssuesLoading,
    isOrdersLoading,
    isDeliveryIssuesLoading,
    orders: filteredOrders,
    deliveryIssues: filteredDeliveryIssues,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    orderStatusFilter,
    setOrderStatusFilter,
    deliveryIssueStatusFilter,
    setDeliveryIssueStatusFilter,
    orderSearch,
    setOrderSearch,
    issueSearch,
    setIssueSearch,
    reloadOrders,
    reloadDeliveryIssues,
    ordersErrorMessage: ordersError
      ? mapErrorMessage(ordersError, "Nao foi possivel carregar os pedidos.")
      : null,
    deliveryIssuesErrorMessage: deliveryIssuesError
      ? mapErrorMessage(deliveryIssuesError, "Nao foi possivel carregar os problemas de entrega.")
      : null,
    isUpdatingOrderStatus: updateOrderStatusMutation.isPending,
    isUpdatingDeliveryIssueStatus: updateDeliveryIssueStatusMutation.isPending,
    updateOrderStatus: async (orderId: string, nextStatus: OrderStatus) =>
      updateOrderStatusMutation.mutateAsync({ orderId, nextStatus }),
    updateDeliveryIssueStatus: async (
      issueId: string,
      nextStatus: DeliveryIssueStatus,
      triageNotes?: string
    ) =>
      updateDeliveryIssueStatusMutation.mutateAsync({
        issueId,
        nextStatus,
        triageNotes,
      }),
  };
}

