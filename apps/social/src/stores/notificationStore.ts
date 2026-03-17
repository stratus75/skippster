import { create } from 'zustand';
import type { Notification } from '../types';
import { notificationApi } from '../api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: (did: string) => Promise<void>;
  fetchUnreadCount: (did: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (did: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  reset: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (did: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationApi.getAll(did);
      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      set({ error: message, isLoading: false });
    }
  },

  fetchUnreadCount: async (did: string) => {
    try {
      const response = await notificationApi.getUnreadCount(did);
      set({ unreadCount: response.unreadCount });
    } catch {
      // Silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silently fail
    }
  },

  markAllAsRead: async (did: string) => {
    try {
      const response = await notificationApi.markAllAsRead(did);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silently fail
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationApi.delete(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch {
      // Silently fail
    }
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));