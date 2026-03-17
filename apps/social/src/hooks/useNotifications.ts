import { useCallback } from 'react';
import { useNotificationStore } from '../stores';

export function useNotifications(did: string | null) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reset,
  } = useNotificationStore();

  const loadNotifications = useCallback(async () => {
    if (!did) return;
    await fetchNotifications(did);
  }, [did, fetchNotifications]);

  const loadUnreadCount = useCallback(async () => {
    if (!did) return;
    await fetchUnreadCount(did);
  }, [did, fetchUnreadCount]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    await markAsRead(id);
  }, [markAsRead]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!did) return;
    await markAllAsRead(did);
  }, [did, markAllAsRead]);

  const deleteNotificationById = useCallback(async (id: string) => {
    await deleteNotification(id);
  }, [deleteNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    loadUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    reset,
  };
}