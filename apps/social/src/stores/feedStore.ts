import { create } from 'zustand';
import type { Post, CreatePostDto } from '../types';
import { postApi, reactionApi } from '../api';
import { toast } from './toastStore';

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
}

interface FeedActions {
  fetchFeed: (did: string, reset?: boolean) => Promise<void>;
  fetchPublic: (reset?: boolean) => Promise<void>;
  createPost: (data: CreatePostDto) => Promise<Post>;
  likePost: (postId: string, did: string) => Promise<boolean>;
  unlikePost: (postId: string, did: string) => Promise<boolean>;
  reset: () => void;
}

type FeedStore = FeedState & FeedActions;

const POSTS_PER_PAGE = 20;

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  hasMore: true,
  offset: 0,

  fetchFeed: async (did: string, reset = false) => {
    const currentOffset = reset ? 0 : get().offset;
    set({ isLoading: true, error: null });

    try {
      const response = await postApi.getFeed(did, POSTS_PER_PAGE, currentOffset);
      const newPosts = response.posts;

      set((state) => ({
        posts: reset ? newPosts : [...state.posts, ...newPosts],
        offset: currentOffset + POSTS_PER_PAGE,
        hasMore: newPosts.length === POSTS_PER_PAGE,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch feed';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchPublic: async (reset = false) => {
    const currentOffset = reset ? 0 : get().offset;
    set({ isLoading: true, error: null });

    try {
      const response = await postApi.getPublic(POSTS_PER_PAGE, currentOffset);
      const newPosts = response.posts;

      set((state) => ({
        posts: reset ? newPosts : [...state.posts, ...newPosts],
        offset: currentOffset + POSTS_PER_PAGE,
        hasMore: newPosts.length === POSTS_PER_PAGE,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  createPost: async (data: CreatePostDto) => {
    try {
      const post = await postApi.create(data);
      set((state) => ({
        posts: [post, ...state.posts],
      }));
      toast.success('Post created successfully');
      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      toast.error(message);
      throw err;
    }
  },

  likePost: async (postId: string, did: string) => {
    try {
      await reactionApi.create({
        id: crypto.randomUUID(),
        did,
        targetType: 'post',
        targetId: postId,
        emoji: '👍',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to like post';
      toast.error(message);
      return false;
    }
  },

  unlikePost: async (postId: string, did: string) => {
    try {
      await reactionApi.delete(did, 'post', postId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlike post';
      toast.error(message);
      return false;
    }
  },

  reset: () => {
    set({
      posts: [],
      isLoading: false,
      error: null,
      hasMore: true,
      offset: 0,
    });
  },
}));