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
  is_premium?: boolean;
}

/** Public profile from GET /api/users/[username] */
export interface ApiPublicProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_premium?: boolean;
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
  /** Parsed list of image URLs (use for display; fallback to [media_url] when absent) */
  media_urls?: string[];
  interest_id: string | null;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null; is_premium?: boolean };
  interest?: { name: string } | null;
  like_count?: number;
  comment_count?: number;
  liked?: boolean;
}

/** Body for PATCH /api/posts/[id] */
export interface ApiUpdatePostBody {
  content?: string;
  media_url?: string | null;
  /** Multiple image URLs (overwrites media_url) */
  media_urls?: string[];
  interest_id?: string | null;
}

/** One user in GET /api/search response */
export interface ApiSearchUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/** Response from GET /api/search */
export interface ApiSearchResult {
  users: ApiSearchUser[];
  interests: ApiInterest[];
  posts: ApiPost[];
}

/** Activity item: only actions you did (like, comment, follow) */
export type ApiActivityItem =
  | {
      type: 'like';
      id: string;
      created_at: string;
      post_id: string;
      post: {
        id: string;
        content: string;
        author: { username: string | null; avatar_url: string | null };
      };
    }
  | {
      type: 'comment';
      id: string;
      created_at: string;
      post_id: string;
      comment_id: string;
      comment_content: string;
      post: {
        id: string;
        content: string;
        author: { username: string | null; avatar_url: string | null };
      };
    }
  | {
      type: 'follow';
      id: string;
      created_at: string;
      user: { id: string; username: string | null; avatar_url: string | null };
    };

/** Response from GET /api/activity */
export interface ApiActivityResponse {
  activity: ApiActivityItem[];
  hasMore: boolean;
}

/** Notification type (like, comment, follow, mention) */
export type ApiNotificationType = 'like' | 'comment' | 'follow' | 'mention';

/** Aggregated notification item from GET /api/notifications */
export interface ApiNotificationAggregated {
  ids: string[];
  type: ApiNotificationType;
  post_id: string | null;
  comment_id: string | null;
  actors: { id: string; username: string | null; avatar_url: string | null }[];
  total_count: number;
  read_at: string | null;
  created_at: string;
}

/** Response from GET /api/notifications */
export interface ApiNotificationsResponse {
  notifications: ApiNotificationAggregated[];
  hasMore: boolean;
}

/** Response from GET /api/notifications/unread-count */
export interface ApiNotificationUnreadCount {
  count: number;
}

/** Chat list item from GET /api/chats */
export interface ApiChat {
  id: string;
  other_user: { id: string; username: string | null; avatar_url: string | null };
  last_message: { content: string; created_at: string; sender_id: string } | null;
  unread_count: number;
  updated_at: string;
}

/** Response from GET /api/chats */
export interface ApiChatsResponse {
  chats: ApiChat[];
  hasMore: boolean;
}

/** Reply target on a message */
export interface ApiChatReplyTo {
  id: string;
  content: string;
  sender_id: string;
}

/** Reaction on a message */
export interface ApiChatReaction {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
}

/** Single message from GET/POST /api/chats/[id]/messages */
export interface ApiChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
  reply_to?: ApiChatReplyTo | null;
  reactions?: ApiChatReaction[];
}

/** Response from GET /api/chats/[id]/messages */
export interface ApiChatMessagesResponse {
  messages: ApiChatMessage[];
  hasMore: boolean;
  recipient_last_read_at?: string | null;
  my_last_read_at?: string | null;
}

/** Response from GET /api/chats/unread-count */
export interface ApiChatUnreadCount {
  count: number;
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
