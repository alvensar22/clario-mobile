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

/** Public profile from GET /api/users/[username] */
export interface ApiPublicProfile {
  id: string;
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

/** Response from GET /api/users/[username]/interests */
export interface ApiPublicProfileInterestsResponse {
  interests: ApiInterest[];
}

/** Follow status from GET /api/users/[username]/follow */
export interface ApiFollowStatus {
  following: boolean;
  followerCount: number;
  followingCount: number;
}

/** User summary in followers/following list */
export interface ApiFollowListUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ApiFollowListResponse {
  users: ApiFollowListUser[];
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

/** Body for PATCH /api/posts/[id] */
export interface ApiUpdatePostBody {
  content?: string;
  media_url?: string | null;
  interest_id?: string | null;
}

export interface ApiComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null };
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
}
