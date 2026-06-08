/**
 * NotificationBell.jsx
 * --------------------
 * Notification bell icon for the Navbar.
 * Shows unread count badge and dropdown with recent notifications.
 * Polls unread count every 30 seconds.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MdNotifications, MdMarkEmailRead, MdCircle } from "react-icons/md";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
} from "../services/notificationService";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.count ?? data.unread_count ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications({ limit: 10 });
      const items = data.notifications ?? data ?? [];
      const normalized = items.map((n) => ({
        ...n,
        id: n.id ?? n.notification_id,
      }));
      setNotifications(normalized);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell__trigger"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <MdNotifications size={22} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h4 className="notification-dropdown__title">Notifications</h4>
            {unreadCount > 0 && (
              <button
                className="notification-dropdown__mark-all"
                onClick={handleMarkAllRead}
              >
                <MdMarkEmailRead size={16} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown__list">
            {loading ? (
              <div className="notification-dropdown__loading">
                <div className="loader__spinner" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-dropdown__empty">
                <MdNotifications size={32} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.is_read ? "notification-item--unread" : ""}`}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                >
                  <div className="notification-item__dot">
                    {!n.is_read && <MdCircle size={8} />}
                  </div>
                  <div className="notification-item__content">
                    <p className="notification-item__title">{n.title}</p>
                    <p className="notification-item__message">
                      {n.message?.length > 80
                        ? n.message.slice(0, 80) + "…"
                        : n.message}
                    </p>
                    <span className="notification-item__time">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
