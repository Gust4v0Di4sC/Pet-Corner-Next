import { useCallback, useEffect, useMemo, useState } from "react";
import {
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  subscribeAdminNotifications,
  type AdminNotification,
} from "../services/adminNotificationService";
import { getUserErrorMessage } from "../utils/userErrorMessage";

function mapNotificationError(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar notificacoes agora.", {
    permissionMessage:
      "Voce nao tem permissao para ver estas notificacoes. Entre com uma conta autorizada.",
  });
}

export function useAdminNotifications() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    const unsubscribe = subscribeAdminNotifications({
      onData: (nextNotifications) => {
        setNotifications(nextNotifications);
        setIsLoading(false);
      },
      onError: (error) => {
        setErrorMessage(mapNotificationError(error));
        setIsLoading(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const normalizedNotificationId = notificationId.trim();
    if (!normalizedNotificationId) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === normalizedNotificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    );

    try {
      await markAdminNotificationAsRead(normalizedNotificationId);
    } catch {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === normalizedNotificationId
            ? {
                ...notification,
                isRead: false,
              }
            : notification
        )
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);
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
      await markAllAdminNotificationsAsRead();
    } catch {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: false,
        }))
      );
    }
  }, [notifications]);

  return {
    isLoading,
    errorMessage,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
