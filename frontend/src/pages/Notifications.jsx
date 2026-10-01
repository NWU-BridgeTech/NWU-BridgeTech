import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Link } from "react-router-dom";
import { clearAuthTokens, getToken } from "../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const container = useRef(null);
  const trigger = useRef(null);
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  async function loadNotifications() {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        clearAuthTokens();
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error("Unable to load notifications.");
      setNotifications(await response.json());
      setError("");
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(loadNotifications, 0);
    const interval = window.setInterval(loadNotifications, 30000);
    window.addEventListener("notifications-changed", loadNotifications);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("notifications-changed", loadNotifications);
    };
  }, []);

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

  async function markRead(id) {
    const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (response.ok) {
      setNotifications((items) =>
        items.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );
    }
  }

  async function markAllRead() {
    const response = await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (response.ok)
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
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
        {loading ? (
          <p className="notification-empty">Loading notifications...</p>
        ) : error ? (
          <p className="notification-empty" role="alert">
            {error}
          </p>
        ) : notifications.length ? (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={!notification.isRead ? "is-unread" : ""}
              >
                <div className="notification-item-heading">
                  <h3>{notification.title}</h3>
                  {!notification.isRead && (
                    <span
                      className="notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}
                </div>
                <p>{notification.message}</p>
                {!notification.isRead && (
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
          <Link
            className="text-action"
            to="/student/notifications"
            onClick={closeNotifications}
          >
            View all notifications
          </Link>
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
