import { create } from 'zustand';
import type { User, FriendRequest } from '../types';
import { friendApi } from '../api';

interface FriendState {
  friends: User[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendCount: number;
  pendingRequestCount: number;
  isLoading: boolean;
  error: string | null;
}

interface FriendActions {
  fetchFriends: (did: string) => Promise<void>;
  fetchPendingRequests: (did: string) => Promise<void>;
  fetchSentRequests: (did: string) => Promise<void>;
  fetchCounts: (did: string) => Promise<void>;
  sendRequest: (fromDid: string, toDid: string) => Promise<void>;
  acceptRequest: (fromDid: string, toDid: string) => Promise<void>;
  declineRequest: (fromDid: string, toDid: string) => Promise<void>;
  removeFriend: (did1: string, did2: string) => Promise<void>;
  reset: () => void;
}

type FriendStore = FriendState & FriendActions;

export const useFriendStore = create<FriendStore>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  friendCount: 0,
  pendingRequestCount: 0,
  isLoading: false,
  error: null,

  fetchFriends: async (did: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendApi.getFriends(did);
      set({
        friends: response.friends,
        friendCount: response.count,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch friends';
      set({ error: message, isLoading: false });
    }
  },

  fetchPendingRequests: async (did: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendApi.getPendingRequests(did);
      set({
        pendingRequests: response.requests,
        pendingRequestCount: response.count,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      set({ error: message, isLoading: false });
    }
  },

  fetchSentRequests: async (did: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendApi.getSentRequests(did);
      set({
        sentRequests: response.requests,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sent requests';
      set({ error: message, isLoading: false });
    }
  },

  fetchCounts: async (did: string) => {
    try {
      const counts = await friendApi.getCount(did);
      set({
        friendCount: counts.friends,
        pendingRequestCount: counts.pendingRequests,
      });
    } catch {
      // Silently fail count updates
    }
  },

  sendRequest: async (fromDid: string, toDid: string) => {
    set({ isLoading: true, error: null });
    try {
      await friendApi.sendRequest(fromDid, toDid);
      // Refresh sent requests
      await get().fetchSentRequests(fromDid);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send request';
      set({ error: message, isLoading: false });
    }
  },

  acceptRequest: async (fromDid: string, toDid: string) => {
    set({ isLoading: true, error: null });
    try {
      await friendApi.acceptRequest(fromDid, toDid);
      // Remove from pending and add to friends
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (r) => !(r.did1 === fromDid && r.did2 === toDid)
        ),
        pendingRequestCount: Math.max(0, state.pendingRequestCount - 1),
      }));
      // Refresh friends list
      await get().fetchFriends(toDid);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept request';
      set({ error: message, isLoading: false });
    }
  },

  declineRequest: async (fromDid: string, toDid: string) => {
    set({ isLoading: true, error: null });
    try {
      await friendApi.deleteFriend(fromDid, toDid);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (r) => !(r.did1 === fromDid && r.did2 === toDid)
        ),
        pendingRequestCount: Math.max(0, state.pendingRequestCount - 1),
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline request';
      set({ error: message, isLoading: false });
    }
  },

  removeFriend: async (did1: string, did2: string) => {
    set({ isLoading: true, error: null });
    try {
      await friendApi.deleteFriend(did1, did2);
      set((state) => ({
        friends: state.friends.filter((f) => f.did !== did1 && f.did !== did2),
        friendCount: Math.max(0, state.friendCount - 1),
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove friend';
      set({ error: message, isLoading: false });
    }
  },

  reset: () => {
    set({
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      friendCount: 0,
      pendingRequestCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));