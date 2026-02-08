/**
 * Auth state. Uses SecureStore for tokens via store/auth-tokens.
 * Mobile uses Bearer token to call clario-web API.
 */

import { create } from 'zustand';
import type { ApiUser, ApiUserProfile } from '@/types/api';
import { api } from '@/services/api/client';
import { setTokens, clearTokens } from '@/store/auth-tokens';

export { getAccessToken } from '@/store/auth-tokens';

interface AuthState {
  user: ApiUser | null;
  profile: ApiUserProfile | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (u: ApiUser | null) => void;
  setProfile: (p: ApiUserProfile | null) => void;
  setLoading: (l: boolean) => void;
  setHydrated: (h: boolean) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  hydrated: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setHydrated: (hydrated) => set({ hydrated }),

  signIn: async (email, password) => {
    const { data, error } = await api.signIn(email, password);
    if (error) return error;
    if (data?.user && data?.access_token) {
      await setTokens(data.access_token, data.refresh_token ?? '');
      set({ user: data.user });
      await get().loadProfile();
      return null;
    }
    return 'Sign in failed';
  },

  signUp: async (email, password) => {
    const { data, error } = await api.signUp(email, password);
    if (error) return error;
    if (data?.user) {
      if (data.access_token && data.refresh_token) {
        await setTokens(data.access_token, data.refresh_token);
        set({ user: data.user });
        await get().loadProfile();
      }
      return null;
    }
    return 'Sign up failed';
  },

  signOut: async () => {
    await api.signOut();
    await clearTokens();
    set({ user: null, profile: null });
  },

  loadSession: async () => {
    set({ loading: true });
    const { data } = await api.getSession();
    const user = data?.user ?? null;
    set({ user });
    if (user) await get().loadProfile();
    set({ loading: false, hydrated: true });
  },

  loadProfile: async () => {
    const { data } = await api.getMe();
    set({ profile: data ?? null });
  },
}));
