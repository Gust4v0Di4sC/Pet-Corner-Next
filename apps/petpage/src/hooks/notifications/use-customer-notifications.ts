"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
  subscribeCustomerNotifications,
  type CustomerNotification,
} from "@/services/notifications/customer-notification.service";

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

export function useCustomerNotifications(options: UseCustomerNotificationsOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const normalizedCustomerId = options.customerId?.trim() || "";

  useEffect(() => {
    if (!normalizedCustomerId) {
      return;
    }

    const unsubscribe = subscribeCustomerNotifications(normalizedCustomerId, {
      onData: (nextNotifications) => {
        setNotifications(nextNotifications);
        setIsLoading(false);
      },
      onError: (error) => {
        setErrorMessage(mapSubscriptionError(error));
        setIsLoading(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [normalizedCustomerId]);

  const visibleNotifications = useMemo(
    () => (normalizedCustomerId ? notifications : []),
    [normalizedCustomerId, notifications]
  );
  const visibleErrorMessage = normalizedCustomerId ? errorMessage : null;
  const visibleIsLoading = normalizedCustomerId ? isLoading : false;

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.isRead).length,
    [visibleNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!normalizedCustomerId || !notificationId.trim()) {
        return;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      try {
        await markCustomerNotificationAsRead(normalizedCustomerId, notificationId);
      } catch {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: false,
                }
              : notification
          )
        );
      }
    },
    [normalizedCustomerId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!normalizedCustomerId) {
      return;
    }

    const hasUnreadNotifications = visibleNotifications.some((notification) => !notification.isRead);
    if (!hasUnreadNotifications) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );

    try {
      await markAllCustomerNotificationsAsRead(normalizedCustomerId);
    } catch {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: false,
        }))
      );
    }
  }, [normalizedCustomerId, visibleNotifications]);

  return {
    isLoading: visibleIsLoading,
    errorMessage: visibleErrorMessage,
    notifications: visibleNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
