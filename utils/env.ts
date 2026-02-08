import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

/** Base URL for clario-web API. Set EXPO_PUBLIC_API_URL in .env or app.config.js */
export const API_BASE_URL =
  extra.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';
