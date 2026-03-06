import { create } from 'zustand';
import type { Video } from '../types';
import { apiClient } from '../api';

export interface PlayerState {
  progress: number;
  downloadSpeed: number;
  peers: number;
  isReady: boolean;
  error: string | null;
}

interface VideoStore {
  currentVideo: Video | null;
  videos: Video[];
  isLoading: boolean;
  error: string | null;
  playerState: PlayerState;
  fetchVideo: (id: string) => Promise<void>;
  fetchVideos: () => Promise<void>;
  updatePlayerState: (state: Partial<PlayerState>) => void;
  incrementViews: (id: string) => Promise<void>;
  reset: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  currentVideo: null,
  videos: [],
  isLoading: false,
  error: null,
  playerState: {
    progress: 0,
    downloadSpeed: 0,
    peers: 0,
    isReady: false,
    error: null,
  },

  fetchVideo: async (id: string) => {
    set({ isLoading: true, error: null, playerState: { progress: 0, downloadSpeed: 0, peers: 0, isReady: false, error: null } });
    try {
      const video = await apiClient.getVideo(id);
      set({ currentVideo: video, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch video';
      set({ error: message, isLoading: false });
    }
  },

  fetchVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const videos = await apiClient.getVideos();
      set({ videos, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch videos';
      set({ error: message, isLoading: false });
    }
  },

  updatePlayerState: (state) => {
    set((prev) => ({
      playerState: { ...prev.playerState, ...state },
    }));
  },

  incrementViews: async (id: string) => {
    try {
      await apiClient.incrementViews(id);
      const currentVideo = get().currentVideo;
      if (currentVideo && currentVideo.id === id) {
        set({ currentVideo: { ...currentVideo, views: currentVideo.views + 1 } });
      }
    } catch {
      // Silently fail view count increment
    }
  },

  reset: () => {
    set({
      currentVideo: null,
      isLoading: false,
      error: null,
      playerState: { progress: 0, downloadSpeed: 0, peers: 0, isReady: false, error: null },
    });
  },
}));