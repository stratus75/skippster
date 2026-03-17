import axios from 'axios';
import type {
  Post,
  CreatePostDto,
  Comment,
  CreateCommentDto,
  Reaction,
  CreateReactionDto,
  Friend,
  FriendRequest,
  Notification,
  User,
  FeedResponse,
  FriendsResponse,
  FriendRequestsResponse,
  NotificationsResponse,
  FriendStatusResponse,
} from '../types';

const PDS_URL = import.meta.env.VITE_PDS_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: PDS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to parse date fields
function parseDate(date: any): Date {
  return new Date(date);
}

// Post API
export const postApi = {
  async getById(id: string): Promise<Post> {
    const response = await api.get(`/api/posts/${id}`);
    return {
      ...response.data,
      createdAt: parseDate(response.data.createdAt),
      updatedAt: parseDate(response.data.updatedAt),
    };
  },

  async getFeed(did: string, limit = 20, offset = 0): Promise<FeedResponse> {
    const response = await api.get('/api/posts', {
      params: { feed: did, limit, offset },
    });
    return {
      posts: response.data.posts.map((p: any) => ({
        ...p,
        createdAt: parseDate(p.createdAt),
        updatedAt: parseDate(p.updatedAt),
      })),
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async getPublic(limit = 20, offset = 0): Promise<FeedResponse> {
    const response = await api.get('/api/posts', {
      params: { public: true, limit, offset },
    });
    return {
      posts: response.data.posts.map((p: any) => ({
        ...p,
        createdAt: parseDate(p.createdAt),
        updatedAt: parseDate(p.updatedAt),
      })),
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async getByUser(did: string, limit = 20, offset = 0): Promise<FeedResponse> {
    const response = await api.get('/api/posts', {
      params: { did, limit, offset },
    });
    return {
      posts: response.data.posts.map((p: any) => ({
        ...p,
        createdAt: parseDate(p.createdAt),
        updatedAt: parseDate(p.updatedAt),
      })),
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async create(data: CreatePostDto): Promise<Post> {
    const response = await api.post('/api/posts', data);
    return {
      ...response.data,
      createdAt: parseDate(response.data.createdAt),
      updatedAt: parseDate(response.data.updatedAt),
    };
  },
};

// Comment API
export const commentApi = {
  async getByTarget(targetType: 'video' | 'post', targetId: string, limit = 50): Promise<Comment[]> {
    const response = await api.get('/api/comments', {
      params: { targetType, targetId, limit },
    });
    return response.data.comments.map((c: any) => ({
      ...c,
      createdAt: parseDate(c.createdAt),
    }));
  },

  async create(data: CreateCommentDto): Promise<Comment> {
    const response = await api.post('/api/comments', data);
    return {
      ...response.data,
      createdAt: parseDate(response.data.createdAt),
    };
  },
};

// Reaction API
export const reactionApi = {
  async getByTarget(targetType: 'video' | 'post', targetId: string): Promise<Reaction[]> {
    const response = await api.get('/api/reactions', {
      params: { targetType, targetId },
    });
    return response.data.reactions.map((r: any) => ({
      ...r,
      createdAt: parseDate(r.createdAt),
    }));
  },

  async getGrouped(targetType: 'video' | 'post', targetId: string): Promise<Record<string, number>> {
    const response = await api.get('/api/reactions', {
      params: { targetType, targetId, grouped: true },
    });
    return response.data;
  },

  async create(data: CreateReactionDto): Promise<Reaction> {
    const response = await api.post('/api/reactions', data);
    return {
      ...response.data,
      createdAt: parseDate(response.data.createdAt),
    };
  },

  async delete(did: string, targetType: 'video' | 'post', targetId: string): Promise<void> {
    await api.delete('/api/reactions', {
      params: { did, targetType, targetId },
    });
  },
};

// Friend API
export const friendApi = {
  async getFriends(did: string): Promise<FriendsResponse> {
    const response = await api.get(`/api/friends/${did}`);
    return {
      friends: response.data.friends.map((u: any) => ({
        ...u,
        createdAt: parseDate(u.createdAt),
        updatedAt: parseDate(u.updatedAt),
      })),
      count: response.data.count,
    };
  },

  async getPendingRequests(did: string): Promise<FriendRequestsResponse> {
    const response = await api.get(`/api/friends/requests/${did}`);
    return {
      requests: response.data.requests.map((r: any) => ({
        ...r,
        requestedAt: parseDate(r.requestedAt),
        acceptedAt: r.acceptedAt ? parseDate(r.acceptedAt) : null,
        requester: r.requester ? {
          ...r.requester,
          createdAt: parseDate(r.requester.createdAt),
          updatedAt: parseDate(r.requester.updatedAt),
        } : undefined,
      })),
      count: response.data.count,
    };
  },

  async getSentRequests(did: string): Promise<FriendRequestsResponse> {
    const response = await api.get(`/api/friends/sent/${did}`);
    return {
      requests: response.data.requests.map((r: any) => ({
        ...r,
        requestedAt: parseDate(r.requestedAt),
        acceptedAt: r.acceptedAt ? parseDate(r.acceptedAt) : null,
        target: r.target ? {
          ...r.target,
          createdAt: parseDate(r.target.createdAt),
          updatedAt: parseDate(r.target.updatedAt),
        } : undefined,
      })),
      count: response.data.count,
    };
  },

  async getCount(did: string): Promise<{ friends: number; pendingRequests: number }> {
    const response = await api.get(`/api/friends/count/${did}`);
    return response.data;
  },

  async getStatus(did1: string, did2: string): Promise<FriendStatusResponse> {
    const response = await api.get('/api/friends/status', {
      params: { did1, did2 },
    });
    return {
      ...response.data,
      relationship: response.data.relationship ? {
        ...response.data.relationship,
        requestedAt: parseDate(response.data.relationship.requestedAt),
        acceptedAt: response.data.relationship.acceptedAt
          ? parseDate(response.data.relationship.acceptedAt)
          : null,
      } : null,
    };
  },

  async sendRequest(fromDid: string, toDid: string): Promise<Friend> {
    const response = await api.post('/api/friends/request', { fromDid, toDid });
    return {
      ...response.data,
      requestedAt: parseDate(response.data.requestedAt),
      acceptedAt: response.data.acceptedAt ? parseDate(response.data.acceptedAt) : null,
    };
  },

  async acceptRequest(fromDid: string, toDid: string): Promise<Friend> {
    const response = await api.post('/api/friends/accept', { fromDid, toDid });
    return {
      ...response.data,
      requestedAt: parseDate(response.data.requestedAt),
      acceptedAt: response.data.acceptedAt ? parseDate(response.data.acceptedAt) : null,
    };
  },

  async deleteFriend(did1: string, did2: string): Promise<{ deleted: boolean }> {
    const response = await api.delete('/api/friends', {
      params: { did1, did2 },
    });
    return response.data;
  },
};

// Notification API
export const notificationApi = {
  async getAll(did: string, limit = 50, offset = 0): Promise<NotificationsResponse> {
    const response = await api.get(`/api/notifications/${did}`, {
      params: { limit, offset },
    });
    return {
      notifications: response.data.notifications.map((n: any) => ({
        ...n,
        createdAt: parseDate(n.createdAt),
      })),
      unreadCount: response.data.unreadCount,
    };
  },

  async getUnread(did: string): Promise<{ notifications: Notification[]; count: number }> {
    const response = await api.get(`/api/notifications/unread/${did}`);
    return {
      notifications: response.data.notifications.map((n: any) => ({
        ...n,
        createdAt: parseDate(n.createdAt),
      })),
      count: response.data.count,
    };
  },

  async getUnreadCount(did: string): Promise<{ unreadCount: number }> {
    const response = await api.get(`/api/notifications/count/${did}`);
    return response.data;
  },

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(did: string): Promise<{ markedAsRead: number }> {
    const response = await api.patch(`/api/notifications/read-all/${did}`);
    return response.data;
  },

  async delete(id: string): Promise<{ deleted: boolean }> {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

// User API
export const userApi = {
  async getByDid(did: string): Promise<User | null> {
    try {
      const response = await api.get(`/api/users/${did}`);
      return {
        ...response.data,
        createdAt: parseDate(response.data.createdAt),
        updatedAt: parseDate(response.data.updatedAt),
      };
    } catch {
      return null;
    }
  },

  async create(data: { did: string; handle: string; publicKey: string }): Promise<User> {
    const response = await api.post('/api/users', data);
    return {
      ...response.data,
      createdAt: parseDate(response.data.createdAt),
      updatedAt: parseDate(response.data.updatedAt),
    };
  },
};

export { api };