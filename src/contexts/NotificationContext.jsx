import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import socket from '../lib/realtime/socket.js';
import { useUser } from './UserContext.jsx';
import { fetchWithRetry, buildUrl } from '../lib/api/frontend/client.js';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();

  // Compute a sessionStorage key namespaced per user (prevents cross-account bleed)
  const storageKey = React.useMemo(() => {
    return `readNotifications:${user?.user_id || user?.id || 'anon'}`;
  }, [user?.user_id, user?.id]);

  // Get read notifications from sessionStorage (session-based, per-user)
  const getReadNotifications = () => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return {};
    }
  };

  // Save read notifications to sessionStorage (session-based, per-user)
  const saveReadNotifications = (readNotifications) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(readNotifications));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  };



  // Mark notification as read (session-based, no API call needed)
  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      // Update local state immediately for instant feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );

      // Update sessionStorage
      const readNotifications = getReadNotifications();
      readNotifications[notificationId] = true;
      saveReadNotifications(readNotifications);
      console.log('Updated sessionStorage with read notification:', notificationId);

      // Update unread count
      updateUnreadCount();

      // Optional: Send to server in background (non-blocking)
      fetchWithRetry(buildUrl(`notifications/${notificationId}/read`), {
        method: 'POST',
        credentials: 'include',
      }).catch(error => {
        console.error('Background notification read update failed:', error);
        // Don't show error to user since local state is already updated
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Update unread count based on merged server + session read flags
  const updateUnreadCount = () => {
    const readNotifications = getReadNotifications();
    const merged = notifications.map(notif => ({
      ...notif,
      is_read: Boolean(notif.is_read) || Boolean(readNotifications[notif.id])
    }));
    const count = merged.filter(n => !n.is_read).length;
    setUnreadCount(count);
  };

  // Fetch all notifications from API
  const fetchNotifications = async (forceRefresh = false) => {
    console.log('fetchNotifications called with forceRefresh:', forceRefresh);

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithRetry(buildUrl('notifications'), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Notification API response:', data);
      
      if (data.success) {
        // Merge server is_read with session
        const readNotifications = getReadNotifications();
        const notificationsWithReadStatus = data.notifications.map(notification => ({
          ...notification,
          is_read: Boolean(notification.is_read) || Boolean(readNotifications[notification.id])
        }));
        setNotifications(notificationsWithReadStatus);
        // Recompute unread using merged state
        const count = notificationsWithReadStatus.filter(n => !n.is_read).length;
        setUnreadCount(count);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and whenever user changes (to reset per-user state)
  useEffect(() => {
    fetchNotifications();

    // Authenticate (optional stub)
    if (socket.disconnected) {
      try { socket.connect(); } catch {}
    }
    socket.emit('authenticate', null);

    // Deduplicate subscriptions using a stable key
    const lastSubKeyRef = (NotificationContext.__lastSubKeyRef ||= { current: null });

    const subscribeIfNeeded = () => {
      if (!user) return;
      const key = `${user.id || user.user_id || ''}|${user.department_id || ''}|${(user.role || '').toString().toUpperCase()}`;
      if (lastSubKeyRef.current === key) return; // already subscribed with same identity
      lastSubKeyRef.current = key;
      socket.emit('subscribe', {
        userId: user.id || user.user_id,
        departmentId: user.department_id,
        role: user.role,
      });
    };

    const onConnect = () => {
      // Force re-evaluation after a fresh connection
      const ref = (NotificationContext.__lastSubKeyRef ||= { current: null });
      ref.current = null;
      subscribeIfNeeded();
    };

    socket.on('connect', onConnect);
    if (socket.connected) subscribeIfNeeded();

    // When a new notification is emitted by the server, refresh list/count
    const onNewNotification = (payload) => {
      console.log('notification:new received:', payload);
      fetchNotifications(true);
    };
    socket.on('notification:new', onNewNotification);

    // Cleanup listeners only (keep socket alive). Also reset unread for user change by recomputing.
    return () => {
      try {
        socket.off('notification:new', onNewNotification);
        socket.off('connect', onConnect);
      } catch {}
    };
  }, [user]);

  // Cleanup function to clear session storage on unmount (optional)
  useEffect(() => {
    return () => {
      // Uncomment the line below if you want to clear session storage on unmount
      // sessionStorage.removeItem('readNotifications');
      // sessionStorage.removeItem('notificationCount');
    };
  }, []);





  // Mark all notifications as read
  const markAllAsRead = () => {
    try {
    // Update local state immediately
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => ({ ...notif, is_read: true }))
    );

    // Update sessionStorage
    const readNotifications = {};
    notifications.forEach(notif => {
      readNotifications[notif.id] = true;
    });
    saveReadNotifications(readNotifications);

    // Update unread count
    setUnreadCount(0);

    // Optional: Send to server in background
    fetchWithRetry(buildUrl('notifications/mark-all-read'), {
      method: 'POST',
      credentials: 'include',
    }).catch(error => {
      console.error('Background mark all read update failed:', error);
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

  // Get lightweight notification count (for performance)
  const getNotificationCountOnly = async () => {
    try {
      const response = await fetchWithRetry(buildUrl('notifications/count'), {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) return data.count;
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
    return 0;
  };

  // Debug function to clear session storage
  const clearNotificationSession = () => {
    sessionStorage.removeItem('readNotifications');
    console.log('Cleared notification session storage');
    fetchNotifications(true); // Force refresh
  };

  // Function to refresh notifications immediately (can be called from other components)
  const refreshNotificationsImmediately = () => {
    console.log('Refreshing notifications immediately...');
    fetchNotifications(true);
  };

  const value = {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationCountOnly,
    clearNotificationSession, // Add debug function
    refreshNotificationsImmediately, // Add immediate refresh function
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
