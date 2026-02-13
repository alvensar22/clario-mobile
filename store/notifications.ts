/**
 * Notifications realtime state: unread count and a version used to trigger list refetch.
 * Updated by Supabase Realtime when new notifications are inserted.
 */

import { create } from 'zustand';

interface NotificationsState {
  /** Unread count; null = not loaded yet */
  unreadCount: number | null;
  /** Bump when a new notification arrives (Realtime); notifications screen refetches when this changes */
  version: number;
  setUnreadCount: (count: number | null) => void;
  /** Call when Realtime receives INSERT (increment unread, bump version) */
  onRealtimeNew: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: null,
  version: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  onRealtimeNew: () =>
    set((s) => ({
      unreadCount: s.unreadCount != null ? s.unreadCount + 1 : 1,
      version: s.version + 1,
    })),
}));
