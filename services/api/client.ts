/**
 * API client for clario-mobile. Calls clario-web API (no direct Supabase).
 * Sends Authorization: Bearer <token> when available.
 */

import type {
  ApiResult,
  ApiSession,
  ApiUserProfile,
  ApiInterest,
  ApiUserInterestsResponse,
  ApiPost,
} from '@/types/api';
import { API_BASE_URL } from '@/utils/env';
import { getAccessToken } from '@/store/auth';

async function fetchApi<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<ApiResult<T>> {
  const { skipAuth, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...rest, headers });
  const text = await res.text();
  let data: T | undefined;
  let error: string | undefined;
  try {
    const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (res.ok) data = parsed as T;
    else error = (parsed.error as string) ?? res.statusText;
  } catch {
    error = text || res.statusText;
  }
  return { data, error, status: res.status };
}

export const api = {
  getSession(): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/session', { skipAuth: false });
  },

  signIn(email: string, password: string): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  signUp(email: string, password: string): Promise<ApiResult<ApiSession>> {
    return fetchApi<ApiSession>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  signOut(): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>('/api/auth/signout', { method: 'POST' });
  },

  getMe(): Promise<ApiResult<ApiUserProfile>> {
    return fetchApi<ApiUserProfile>('/api/users/me');
  },

  updateMe(body: { username?: string; bio?: string }): Promise<ApiResult<ApiUserProfile>> {
    return fetchApi<ApiUserProfile>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  getInterests(): Promise<ApiResult<ApiInterest[]>> {
    return fetchApi<ApiInterest[]>('/api/interests');
  },

  getMyInterests(): Promise<ApiResult<ApiUserInterestsResponse>> {
    return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests');
  },

  putMyInterests(body: { interestIds: string[] }): Promise<ApiResult<ApiUserInterestsResponse>> {
    return fetchApi<ApiUserInterestsResponse>('/api/users/me/interests', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  getPosts(feed?: 'following' | 'interests' | 'explore'): Promise<ApiResult<{ posts: ApiPost[] }>> {
    const url = feed ? `/api/posts?feed=${encodeURIComponent(feed)}` : '/api/posts';
    return fetchApi<{ posts: ApiPost[] }>(url);
  },
};
