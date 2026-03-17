// User types
export interface User {
  did: string;
  handle: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// Post types
export interface Post {
  id: string;
  did: string;
  content: string;
  mediaCids: string[] | null;
  videoId: string | null;
  privacy: 'public' | 'friends' | 'group' | 'specific';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostDto {
  id: string;
  did: string;
  content: string;
  mediaCids?: string[];
  videoId?: string;
  privacy?: Post['privacy'];
}

// Comment types
export interface Comment {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
}

export interface CreateCommentDto {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  parentId?: string;
  content: string;
}

// Reaction types
export interface Reaction {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  emoji: string;
  createdAt: Date;
}

export interface CreateReactionDto {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  emoji?: string;
}

// Friend types
export interface Friend {
  did1: string;
  did2: string;
  status: 'pending' | 'accepted';
  requestedAt: Date;
  acceptedAt: Date | null;
}

export interface FriendRequest extends Friend {
  requester?: User;
  target?: User;
}

// Notification types
export interface Notification {
  id: string;
  toDid: string;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'comment' | 'mention' | 'video_comment' | 'video_like' | 'subscription' | 'system';
  title: string;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationDto {
  id?: string;
  toDid: string;
  type: Notification['type'];
  title: string;
  message: string;
  actionUrl?: string;
}

// Video types (for cross-app integration)
export interface Video {
  id: string;
  did: string;
  title: string;
  description: string | null;
  thumbnailCid: string | null;
  magnetLink: string;
  duration: number;
  views: number;
  tags: string[] | null;
  monetizationType: 'free' | 'rent' | 'purchase';
  price: number | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  limit: number;
  offset: number;
  hasMore?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface FeedResponse {
  posts: Post[];
  limit: number;
  offset: number;
}

export interface FriendsResponse {
  friends: User[];
  count: number;
}

export interface FriendRequestsResponse {
  requests: FriendRequest[];
  count: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface FriendStatusResponse {
  isFriend: boolean;
  hasPendingRequest: boolean;
  relationship: Friend | null;
}