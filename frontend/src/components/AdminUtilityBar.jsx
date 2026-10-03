import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LogOut, Settings, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "../pages/Admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatRelativeTime(timestamp) {
  const elapsedSeconds = (new Date(timestamp).getTime() - Date.now()) / 1000;
  if (!Number.isFinite(elapsedSeconds)) return "";

  const units = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  const selectedUnit = units.find(({ seconds }) => Math.abs(elapsedSeconds) >= seconds) ?? units[6];
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
    Math.round(elapsedSeconds / selectedUnit.seconds),
    selectedUnit.unit,
  );
}

function formatRole(role) {
  if (typeof role === "string") return role.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (role === 3) return "Super administrator";
  if (role === 2) return "Administrator";
  return "Account";
}

export default function AdminUtilityBar() {
  const navigate = useNavigate();
  const toolbarRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const userButtonRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [sessionToken] = useState(() => localStorage.getItem("token"));
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(Boolean(sessionToken));
  const [notificationsError, setNotificationsError] = useState(
    sessionToken ? "" : "Sign in to view notifications.",
  );
  const [profile, setProfile] = useState(readStoredUser);
  const [profileError, setProfileError] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    const controller = new AbortController();
    if (!sessionToken) return () => controller.abort();

    const headers = { Authorization: `Bearer ${sessionToken}` };

    fetch(`${API_URL}/api/notifications`, { headers, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load notifications.");
        setNotifications(await response.json());
      })
      .catch((error) => {
        if (error.name !== "AbortError") setNotificationsError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setNotificationsLoading(false);
      });

    fetch(`${API_URL}/api/users/me`, { headers, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profile details are unavailable.");
        const currentProfile = await response.json();
        setProfile((storedProfile) => ({
          ...currentProfile,
          role: storedProfile?.role ?? currentProfile.role,
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setProfileError(error.message);
      });

    return () => controller.abort();
  }, [sessionToken]);

  useEffect(() => {
    if (!openPanel) return undefined;

    function handlePointerDown(event) {
      if (!toolbarRef.current?.contains(event.target)) setOpenPanel(null);
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      setOpenPanel(null);
      (openPanel === "notifications" ? notificationButtonRef : userButtonRef).current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel]);

  async function markNotificationRead(notificationId) {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not update this notification.");
      setNotifications((current) => current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ));
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(error.message);
    }
  }

  async function markAllNotificationsRead() {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not update notifications.");
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        isRead: true,
      })));
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(error.message);
    }
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
    || profile?.username
    || profile?.email
    || "Administrator";

  return (
    <div className="admin-utility-bar" ref={toolbarRef}>
      <div className="admin-utility-actions">
        <div className="admin-utility-item">
          <button
            ref={notificationButtonRef}
            type="button"
            className={`admin-utility-button${openPanel === "notifications" ? " is-open" : ""}`}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={openPanel === "notifications"}
            aria-controls="admin-notifications-panel"
            title="Notifications"
            onClick={() => setOpenPanel((current) => current === "notifications" ? null : "notifications")}
          >
            <Bell size={19} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="admin-utility-badge" aria-hidden="true">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {openPanel === "notifications" && (
            <section
              className="admin-utility-popover admin-notification-popover"
              id="admin-notifications-panel"
              aria-labelledby="admin-notifications-heading"
            >
              <div className="admin-popover-heading">
                <div>
                  <h2 id="admin-notifications-heading">Notifications</h2>
                  <p>{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</p>
                </div>
                <button
                  type="button"
                  className="admin-notification-action"
                  disabled={!unreadCount}
                  onClick={markAllNotificationsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={16} aria-hidden="true" />
                  <span>Mark all read</span>
                </button>
              </div>

              {notificationsLoading ? (
                <p className="admin-popover-message">Loading notifications...</p>
              ) : notificationsError ? (
                <p className="admin-popover-message" role="alert">{notificationsError}</p>
              ) : notifications.length ? (
                <ul className="admin-notification-list">
                  {notifications.slice(0, 8).map((notification) => (
                    <li className={notification.isRead ? "" : "is-unread"} key={notification.id}>
                      <div className="admin-notification-copy">
                        <div className="admin-notification-title">
                          <h3>{notification.title}</h3>
                          {!notification.isRead && <span aria-label="Unread" />}
                        </div>
                        {notification.message && <p>{notification.message}</p>}
                        <time dateTime={notification.createdAt}>
                          {formatRelativeTime(notification.createdAt)}
                        </time>
                      </div>
                      {!notification.isRead && (
                        <button
                          type="button"
                          className="admin-notification-mark-read"
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-popover-message">No notifications yet.</p>
              )}
            </section>
          )}
        </div>

        <div className="admin-utility-item">
          <button
            ref={userButtonRef}
            type="button"
            className={`admin-utility-button${openPanel === "profile" ? " is-open" : ""}`}
            aria-label="Account menu"
            aria-expanded={openPanel === "profile"}
            aria-controls="admin-profile-panel"
            title="Account"
            onClick={() => setOpenPanel((current) => current === "profile" ? null : "profile")}
          >
            <UserRound size={19} aria-hidden="true" />
          </button>

          {openPanel === "profile" && (
            <section
              className="admin-utility-popover admin-profile-popover"
              id="admin-profile-panel"
              aria-labelledby="admin-profile-heading"
            >
              <div className="admin-profile-summary">
                <span className="admin-profile-avatar" aria-hidden="true">
                  <UserRound size={19} />
                </span>
                <div>
                  <h2 id="admin-profile-heading">{displayName}</h2>
                  <p>{profile?.email ?? "Administrator account"}</p>
                  <span>{formatRole(profile?.role)}</span>
                </div>
              </div>
              {profileError && <p className="admin-popover-message">{profileError}</p>}
              <div className="admin-profile-actions">
                <Link to="/admin/settings" onClick={() => setOpenPanel(null)}>
                  <Settings size={16} aria-hidden="true" />
                  Account settings
                </Link>
                <button type="button" onClick={signOut}>
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
