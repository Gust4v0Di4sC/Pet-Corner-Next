"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
  subscribeCustomerNotifications,
  type CustomerNotification,
} from "@/features/notifications/services/customer-notification.service";

type UseCustomerNotificationsOptions = {
  customerId?: string;
};

function mapSubscriptionError(error: unknown): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "permission-denied") {
      return "Sem permissao para carregar notificacoes desta conta.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel carregar suas notificacoes agora.";
}

type NotificationMutationContext = {
  previousNotifications?: CustomerNotification[];
};

type SubscriptionErrorState = {
  customerId: string;
  message: string;
};

export function useCustomerNotifications(options: UseCustomerNotificationsOptions) {
  const queryClient = useQueryClient();
  const [subscriptionError, setSubscriptionError] = useState<SubscriptionErrorState | null>(null);
  const normalizedCustomerId = options.customerId?.trim() || "";
  const hasValidCustomerId = Boolean(normalizedCustomerId);

  const notificationsQueryKey = useMemo(
    () => ["customer-notifications", normalizedCustomerId || "anonymous"] as const,
    [normalizedCustomerId]
  );

  const {
    data,
    error,
    isLoading,
  } = useQuery({
    queryKey: notificationsQueryKey,
    enabled: hasValidCustomerId,
    queryFn: async () => listCustomerNotifications(normalizedCustomerId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!hasValidCustomerId) {
      return;
    }

    const unsubscribe = subscribeCustomerNotifications(normalizedCustomerId, {
      onData: (nextNotifications) => {
        setSubscriptionError((currentError) =>
          currentError?.customerId === normalizedCustomerId ? null : currentError
        );
        queryClient.setQueryData<CustomerNotification[]>(
          notificationsQueryKey,
          nextNotifications
        );
      },
      onError: (error) => {
        setSubscriptionError({
          customerId: normalizedCustomerId,
          message: mapSubscriptionError(error),
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [hasValidCustomerId, normalizedCustomerId, notificationsQueryKey, queryClient]);

  const markAsReadMutation = useMutation<void, unknown, string, NotificationMutationContext>({
    mutationFn: async (notificationId: string) =>
      markCustomerNotificationAsRead(normalizedCustomerId, notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });

      const previousNotifications =
        queryClient.getQueryData<CustomerNotification[]>(notificationsQueryKey);

      queryClient.setQueryData<CustomerNotification[]>(
        notificationsQueryKey,
        (currentNotifications = []) =>
          currentNotifications.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification
          )
      );

      return { previousNotifications };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<CustomerNotification[]>(
          notificationsQueryKey,
          context.previousNotifications
        );
      }
    },
  });

  const markAllAsReadMutation = useMutation<void, unknown, void, NotificationMutationContext>({
    mutationFn: async () => markAllCustomerNotificationsAsRead(normalizedCustomerId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });

      const previousNotifications =
        queryClient.getQueryData<CustomerNotification[]>(notificationsQueryKey);

      queryClient.setQueryData<CustomerNotification[]>(
        notificationsQueryKey,
        (currentNotifications = []) =>
          currentNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
      );

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<CustomerNotification[]>(
          notificationsQueryKey,
          context.previousNotifications
        );
      }
    },
  });

  const visibleNotifications = useMemo(
    () => (hasValidCustomerId ? data || [] : []),
    [data, hasValidCustomerId]
  );
  const queryErrorMessage = error ? mapSubscriptionError(error) : null;
  const mutationErrorMessage = markAsReadMutation.error || markAllAsReadMutation.error
    ? mapSubscriptionError(markAsReadMutation.error || markAllAsReadMutation.error)
    : null;
  const subscriptionErrorMessage =
    subscriptionError?.customerId === normalizedCustomerId ? subscriptionError.message : null;
  const visibleErrorMessage = hasValidCustomerId
    ? subscriptionErrorMessage || mutationErrorMessage || queryErrorMessage
    : null;
  const visibleIsLoading = hasValidCustomerId ? isLoading : false;

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.isRead).length,
    [visibleNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!hasValidCustomerId || !notificationId.trim()) {
        return;
      }

      try {
        await markAsReadMutation.mutateAsync(notificationId);
      } catch {
        return;
      }
    },
    [hasValidCustomerId, markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!hasValidCustomerId) {
      return;
    }

    const hasUnreadNotifications = visibleNotifications.some((notification) => !notification.isRead);
    if (!hasUnreadNotifications) {
      return;
    }

    try {
      await markAllAsReadMutation.mutateAsync();
    } catch {
      return;
    }
  }, [hasValidCustomerId, markAllAsReadMutation, visibleNotifications]);

  return {
    isLoading: visibleIsLoading,
    errorMessage: visibleErrorMessage,
    notifications: visibleNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
