import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { initialNotifications } from "../data/studentDashboard";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const container = useRef(null);
  const trigger = useRef(null);
  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function markRead(id) {
    setNotifications((items) =>
      items.map((item) => {
        if (item.id === id) return { ...item, unread: false };
        return item;
      }),
    );
  }

  function markAllRead() {
    setNotifications((items) =>
      items.map((item) => ({ ...item, unread: false })),
    );
  }

  function closeNotifications() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div
      className="notifications"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className={`notification-bell${open ? " is-open" : ""}`}
        ref={trigger}
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications, no unread notifications"
        }
        aria-expanded={open}
        aria-controls="notifications-dropdown"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={21} strokeWidth={1.7} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <section
        className="notifications-dropdown"
        id="notifications-dropdown"
        aria-labelledby="notifications-heading"
        hidden={!open}
      >
        <div className="notifications-heading">
          <div>
            <h2 id="notifications-heading">Notifications</h2>
            <p role="status">
              {unreadCount ? `${unreadCount} unread` : "You’re all caught up"}
            </p>
          </div>
          <button
            className="notification-close"
            aria-label="Close notifications"
            onClick={closeNotifications}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {notifications.length ? (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={notification.unread ? "is-unread" : ""}
              >
                <div className="notification-item-heading">
                  <h3>{notification.title}</h3>
                  {notification.unread && (
                    <span
                      className="notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}
                </div>
                <p>{notification.message}</p>
                {notification.unread && (
                  <button
                    className="text-action"
                    aria-label={`Mark as read: ${notification.title}`}
                    onClick={() => markRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="notification-empty">
            No notifications yet. Updates about your learning will appear here.
          </p>
        )}
        <div className="notifications-footer">
          <button
            className="text-action"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        </div>
      </section>
    </div>
  );
}
