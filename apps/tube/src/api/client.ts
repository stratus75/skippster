import axios from 'axios';
import type { Video } from '../types';

const PDS_URL = import.meta.env.VITE_PDS_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: PDS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function parseVideo(data: Record<string, unknown>): Video {
  return {
    ...data,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  } as Video;
}

export const apiClient = {
  async getVideo(id: string): Promise<Video> {
    const response = await api.get(`/api/videos/${id}`);
    return parseVideo(response.data);
  },

  async getVideos(): Promise<Video[]> {
    const response = await api.get('/api/videos');
    return response.data.map(parseVideo);
  },

  async incrementViews(id: string): Promise<void> {
    await api.post(`/api/videos/${id}/view`);
  },

  async uploadVideo(formData: FormData): Promise<Video> {
    const response = await api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return parseVideo(response.data);
  },
};