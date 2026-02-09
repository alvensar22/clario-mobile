import { create } from 'zustand';

interface FeedState {
  refreshRequested: boolean;
  requestFeedRefresh: () => void;
  consumeFeedRefresh: () => boolean;
}

export const useFeedStore = create<FeedState>((set) => ({
  refreshRequested: false,
  requestFeedRefresh: () => set({ refreshRequested: true }),
  consumeFeedRefresh: () => {
    const current = useFeedStore.getState().refreshRequested;
    set({ refreshRequested: false });
    return current;
  },
}));
