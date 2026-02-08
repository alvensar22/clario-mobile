/**
 * API types matching clario-web. Used by the mobile API client.
 */

export interface ApiSession {
  user: ApiUser | null;
  access_token?: string;
  refresh_token?: string;
}

export interface ApiUser {
  id: string;
  email: string | null;
}

export interface ApiUserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface ApiInterest {
  id: string;
  name: string;
  slug: string;
}

export interface ApiUserInterestsResponse {
  interestIds: string[];
}

export interface ApiPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  interest_id: string | null;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null };
  interest?: { name: string } | null;
  like_count?: number;
  comment_count?: number;
  liked?: boolean;
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
}
