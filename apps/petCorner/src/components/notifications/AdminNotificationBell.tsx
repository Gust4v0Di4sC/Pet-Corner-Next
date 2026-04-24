import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";
import "./admin-notification-bell.css";

function formatNotificationDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { isLoading, errorMessage, notifications, unreadCount, markAsRead, markAllAsRead } =
    useAdminNotifications();

  const bellLabel = useMemo(() => {
    if (unreadCount <= 0) {
      return "Notificacoes";
    }

    return `Notificacoes (${unreadCount} nao lidas)`;
  }, [unreadCount]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) {
        return;
      }

      if (panelRef.current.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="admin-notification" ref={panelRef}>
      <button
        type="button"
        className="admin-notification__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={bellLabel}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <i className="fa fa-bell" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="admin-notification__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <section className="admin-notification__panel" role="dialog" aria-label="Notificacoes administrativas">
          <header className="admin-notification__panel-header">
            <div>
              <h3>Notificacoes</h3>
              <p>{unreadCount > 0 ? `${unreadCount} nao lida(s)` : "Sem pendencias"}</p>
            </div>
            <button
              type="button"
              className="admin-notification__mark-all"
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0}
            >
              Marcar todas
            </button>
          </header>

          <div className="admin-notification__panel-body">
            {errorMessage ? (
              <p className="admin-notification__error">{errorMessage}</p>
            ) : isLoading ? (
              <div className="admin-notification__loading-list" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ) : notifications.length === 0 ? (
              <p className="admin-notification__empty">
                Nenhuma notificacao disponivel no momento.
              </p>
            ) : (
              <ul className="admin-notification__list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <article
                      className={`admin-notification__item${
                        notification.isRead ? "" : " admin-notification__item--unread"
                      }`}
                    >
                      <div className="admin-notification__item-header">
                        <h4>{notification.title}</h4>
                        {!notification.isRead ? <span className="admin-notification__dot" /> : null}
                      </div>
                      <p>{notification.message}</p>
                      <div className="admin-notification__item-footer">
                        <time dateTime={notification.createdAtIso}>
                          {formatNotificationDate(notification.createdAtIso)}
                        </time>
                        {!notification.isRead ? (
                          <button
                            type="button"
                            onClick={() => void markAsRead(notification.id)}
                          >
                            Marcar como lida
                          </button>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
