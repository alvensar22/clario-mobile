/**
 * Auth state and token storage. Uses SecureStore for access/refresh tokens.
 * Mobile uses Bearer token to call clario-web API.
 */

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { ApiUser, ApiUserProfile } from '@/types/api';
import { api } from '@/services/api/client';

const ACCESS_TOKEN_KEY = 'clario_access_token';
const REFRESH_TOKEN_KEY = 'clario_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

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
    set({ user: data?.user ?? null, loading: false, hydrated: true });
    if (data?.user) await get().loadProfile();
  },

  loadProfile: async () => {
    const { data } = await api.getMe();
    set({ profile: data ?? null });
  },
}));
