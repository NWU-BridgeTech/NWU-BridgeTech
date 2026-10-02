import { useEffect, useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import { apiFetch } from "../utils/apiClient";
import "./StudentNotifications.css";

function formatDate(value) {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setNotifications(await apiFetch("/notifications"));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id) {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  }

  async function markAllRead() {
    await apiFetch("/notifications/read-all", { method: "POST" });
    setNotifications((items) =>
      items.map((item) => ({ ...item, isRead: true })),
    );
  }

  return (
    <StudentLayout title="Notifications">
      <div className="content student-notifications-page">
        <header className="student-notifications-heading">
          <div>
            <p className="eyebrow">Activity</p>
            <h2>All notifications</h2>
            <p>Keep track of your courses, progress, and achievements.</p>
          </div>
          <button
            className="btn"
            onClick={markAllRead}
            disabled={!notifications.some((item) => !item.isRead)}
          >
            Mark all as read
          </button>
        </header>

        {loading ? <p>Loading notifications...</p> : null}
        {error ? (
          <p className="notification-page-error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && notifications.length === 0 ? (
          <section className="notification-page-empty">
            <h3>No notifications yet</h3>
            <p>Updates about your learning will appear here.</p>
          </section>
        ) : null}
        {!loading && !error && notifications.length > 0 ? (
          <ul className="notification-page-list">
            {notifications.map((notification) => (
              <li
                className={!notification.isRead ? "is-unread" : ""}
                key={notification.id}
              >
                <div>
                  <div className="notification-page-title">
                    <h3>{notification.title}</h3>
                    {!notification.isRead ? <span>Unread</span> : null}
                  </div>
                  <p>{notification.message || "No additional details."}</p>
                  <time dateTime={notification.createdAt}>
                    {formatDate(notification.createdAt)}
                  </time>
                </div>
                {!notification.isRead ? (
                  <button
                    className="text-action"
                    onClick={() => markRead(notification.id)}
                  >
                    Mark as read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </StudentLayout>
  );
}
