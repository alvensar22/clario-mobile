/**
 * Token storage only. No dependency on API client or auth store.
 * Used by API client (getAccessToken) and auth store (setTokens, clearTokens).
 */

import * as SecureStore from 'expo-secure-store';

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
