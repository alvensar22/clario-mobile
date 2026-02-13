/**
 * API client for clario-mobile. Calls clario-web API (no direct Supabase).
 * Sends Authorization: Bearer <token> when available.
 */

import type {
  ApiResult,
  ApiSession,
  ApiUserProfile,
  ApiPublicProfile,
  ApiPublicProfileInterestsResponse,
  ApiInterest,
  ApiUserInterestsResponse,
  ApiFollowStatus,
  ApiFollowListResponse,
  ApiPost,
  ApiUpdatePostBody,
  ApiSearchResult,
  ApiActivityResponse,
  ApiComment,
  ApiNotificationsResponse,
  ApiNotificationUnreadCount,
} from '@/types/api';
import { API_BASE_URL } from '@/utils/env';
import { getAccessToken } from '@/store/auth-tokens';

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

  async uploadAvatar(uri: string, fileName?: string): Promise<ApiResult<{ avatarUrl?: string }>> {
    const token = await getAccessToken();
    const url = `${API_BASE_URL}/api/users/me/avatar`;
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: fileName ?? 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const text = await res.text();
    let data: { avatarUrl?: string } | undefined;
    let error: string | undefined;
    try {
      const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      if (res.ok) data = parsed as { avatarUrl?: string };
      else error = (parsed.error as string) ?? res.statusText;
    } catch {
      error = text || res.statusText;
    }
    return { data, error, status: res.status };
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

  getUserByUsername(username: string): Promise<ApiResult<ApiPublicProfile>> {
    return fetchApi<ApiPublicProfile>(`/api/users/${encodeURIComponent(username)}`);
  },

  getUserPosts(username: string): Promise<ApiResult<{ posts: ApiPost[] }>> {
    return fetchApi<{ posts: ApiPost[] }>(`/api/users/${encodeURIComponent(username)}/posts`);
  },

  getPublicProfileInterests(username: string): Promise<ApiResult<ApiPublicProfileInterestsResponse>> {
    return fetchApi<ApiPublicProfileInterestsResponse>(
      `/api/users/${encodeURIComponent(username)}/interests`
    );
  },

  getFollowStatus(username: string): Promise<ApiResult<ApiFollowStatus>> {
    return fetchApi<ApiFollowStatus>(`/api/users/${encodeURIComponent(username)}/follow`);
  },

  getFollowers(username: string): Promise<ApiResult<ApiFollowListResponse>> {
    return fetchApi<ApiFollowListResponse>(
      `/api/users/${encodeURIComponent(username)}/follow?list=followers`
    );
  },

  getFollowing(username: string): Promise<ApiResult<ApiFollowListResponse>> {
    return fetchApi<ApiFollowListResponse>(
      `/api/users/${encodeURIComponent(username)}/follow?list=following`
    );
  },

  followUser(username: string): Promise<ApiResult<{ following: boolean }>> {
    return fetchApi<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: 'POST',
    });
  },

  unfollowUser(username: string): Promise<ApiResult<{ following: boolean }>> {
    return fetchApi<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: 'DELETE',
    });
  },

  getPosts(feed?: 'following' | 'interests' | 'explore'): Promise<ApiResult<{ posts: ApiPost[] }>> {
    const url = feed ? `/api/posts?feed=${encodeURIComponent(feed)}` : '/api/posts';
    return fetchApi<{ posts: ApiPost[] }>(url);
  },

  getPost(postId: string): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>(`/api/posts/${encodeURIComponent(postId)}`);
  },

  search(q: string): Promise<ApiResult<ApiSearchResult>> {
    const trimmed = q?.trim() ?? '';
    if (!trimmed) {
      return Promise.resolve({
        data: { users: [], interests: [], posts: [] },
        status: 200,
      });
    }
    return fetchApi<ApiSearchResult>(
      `/api/search?q=${encodeURIComponent(trimmed)}`
    );
  },

  getActivity(limit = 10, offset = 0): Promise<ApiResult<ApiActivityResponse>> {
    return fetchApi<ApiActivityResponse>(
      `/api/activity?limit=${limit}&offset=${offset}`
    );
  },

  likePost(postId: string): Promise<ApiResult<{ count: number; liked: boolean }>> {
    return fetchApi<{ count: number; liked: boolean }>(
      `/api/posts/${encodeURIComponent(postId)}/like`,
      { method: 'POST' }
    );
  },

  unlikePost(postId: string): Promise<ApiResult<{ count: number; liked: boolean }>> {
    return fetchApi<{ count: number; liked: boolean }>(
      `/api/posts/${encodeURIComponent(postId)}/like`,
      { method: 'DELETE' }
    );
  },

  getComments(postId: string): Promise<ApiResult<{ comments: ApiComment[] }>> {
    return fetchApi<{ comments: ApiComment[] }>(
      `/api/posts/${encodeURIComponent(postId)}/comments`
    );
  },

  addComment(postId: string, content: string): Promise<ApiResult<ApiComment>> {
    return fetchApi<ApiComment>(
      `/api/posts/${encodeURIComponent(postId)}/comments`,
      { method: 'POST', body: JSON.stringify({ content }) }
    );
  },

  createPost(body: {
    content: string;
    media_url?: string | null;
    media_urls?: string[];
    interest_id?: string | null;
  }): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createCheckoutSession(
    plan: 'monthly' | 'annual'
  ): Promise<ApiResult<{ url: string }>> {
    return fetchApi<{ url: string }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  getPremiumPortalUrl(): Promise<ApiResult<{ url: string }>> {
    return fetchApi<{ url: string }>('/api/premium/portal', {
      method: 'POST',
    });
  },

  /** Register Expo push token for push notifications (likes, comments, follows). */
  registerExpoPushToken(token: string): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>('/api/notifications/push/expo', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  getNotifications(limit = 20, offset = 0): Promise<ApiResult<ApiNotificationsResponse>> {
    return fetchApi<ApiNotificationsResponse>(
      `/api/notifications?limit=${limit}&offset=${offset}`
    );
  },

  getNotificationUnreadCount(): Promise<ApiResult<ApiNotificationUnreadCount>> {
    return fetchApi<ApiNotificationUnreadCount>('/api/notifications/unread-count');
  },

  markNotificationRead(id?: string | string[]): Promise<ApiResult<{ success: boolean }>> {
    const body = id == null ? {} : typeof id === 'string' ? { id } : { ids: id };
    return fetchApi<{ success: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updatePost(postId: string, body: ApiUpdatePostBody): Promise<ApiResult<ApiPost>> {
    return fetchApi<ApiPost>(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  deletePost(postId: string): Promise<ApiResult<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  },

  async uploadPostImage(uri: string, fileName?: string): Promise<ApiResult<{ url: string }>> {
    const token = await getAccessToken();
    const url = `${API_BASE_URL}/api/posts/upload`;
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: fileName ?? 'image.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const text = await res.text();
    let data: { url: string } | undefined;
    let error: string | undefined;
    try {
      const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      if (res.ok) data = parsed as { url: string };
      else error = (parsed.error as string) ?? res.statusText;
    } catch {
      error = text || res.statusText;
    }
    return { data, error, status: res.status };
  },
};
