import { useState, useEffect, useCallback } from "react";
import api from "../api";

const POLLING_INTERVAL = 30000; // 30 seconds

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [todayNotifications, setTodayNotifications] = useState([]);
  const [historyNotifications, setHistoryNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (page = 0, size = 20) => {
    try {
      const response = await api.get("/notifications", {
        params: { page, size },
      });
      return response.data;
    } catch (err) {
      console.error("Error fetching notifications:", err);
      throw err;
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications/count");
      setUnreadCount(response.data.count || 0);
      return response.data.count || 0;
    } catch (err) {
      console.error("Error fetching unread count:", err);
      return 0;
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications/recent");
      setRecentNotifications(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching recent notifications:", err);
      return [];
    }
  }, []);

  const fetchTodayNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications/today");
      setTodayNotifications(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching today notifications:", err);
      return [];
    }
  }, []);

  const fetchHistoryNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications/history");
      setHistoryNotifications(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching history notifications:", err);
      return [];
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await api.delete(`/notifications/${notificationId}`);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
        throw err;
      }
    },
    [notifications],
  );

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [count, recent, today, history] = await Promise.all([
        fetchUnreadCount(),
        fetchRecentNotifications(),
        fetchTodayNotifications(),
        fetchHistoryNotifications(),
      ]);

      // Combine recent + today + history, deduplicating by id
      // (a notification created within the last 30 min is returned by BOTH
      // recent and today endpoints; history covers older ones so they also
      // appear in the dropdown and are counted by the badge)
      const merged = [...recent, ...today, ...history];
      const unique = Array.from(new Map(merged.map((n) => [n.id, n])).values());
      setNotifications(unique);
      setUnreadCount(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    fetchUnreadCount,
    fetchRecentNotifications,
    fetchTodayNotifications,
    fetchHistoryNotifications,
  ]);

  // Initial fetch and polling
  // refreshNotifications() updates both the badge AND the notification list
  // so polling it keeps the dropdown content in sync with the counter
  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return {
    notifications,
    unreadCount,
    recentNotifications,
    todayNotifications,
    historyNotifications,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    fetchRecentNotifications,
    fetchTodayNotifications,
    fetchHistoryNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
};

export default useNotifications;
