import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

type ToastStore = ToastState & ToastActions;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  showToast: (type: ToastType, message: string, duration = 5000) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().showToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().showToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().showToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().showToast('warning', message, duration),
};