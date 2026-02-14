/**
 * Chat unread count for header badge. Updated when opening chat list or marking read.
 * Optionally bumped by Realtime when new messages arrive in other chats.
 */

import { create } from 'zustand';

interface ChatState {
  unreadCount: number | null;
  setUnreadCount: (count: number | null) => void;
  /** Call when a new message might have arrived (Realtime) to refetch count */
  bumpVersion: () => void;
  version: number;
}

export const useChatStore = create<ChatState>((set) => ({
  unreadCount: null,
  version: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  bumpVersion: () => set((s) => ({ version: s.version + 1 })),
}));
