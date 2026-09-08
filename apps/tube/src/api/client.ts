import axios from 'axios';
import type { Video, VideoUpload } from '../types';
import { loadIdentity, authHeaders } from './identity';

const PDS_URL = typeof process !== 'undefined' 
  ? (process.env.VITE_PDS_URL || 'http://localhost:4000')
  : 'http://localhost:4000';

const api = axios.create({
  baseURL: PDS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach a fresh Ed25519 DID token to every request (if an identity exists).
// Tokens are single-use (server replay cache), so each request gets its own.
api.interceptors.request.use((config) => {
  const id = loadIdentity();
  const headers = authHeaders(id);
  if (headers.Authorization) {
    config.headers.set('Authorization', headers.Authorization);
  }
  return config;
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

  /**
   * Upload video to PDS
   * Handles IPFS storage and torrent creation on server side
   */
  async uploadVideo(
    file: File,
    metadata: VideoUpload,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{
    id: string;
    cid: string;
    infoHash: string;
    magnetUri: string;
    video: Video;
  }> {
    // Report initial stage
    onProgress?.('transcoding', 0);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    onProgress?.('transcoding', 100);
    onProgress?.('uploading-ipfs', 0);

    const response = await api.post('/api/videos/upload', {
      videoData: base64,
      filename: file.name,
      fileSize: file.size,
      title: metadata.title,
      description: metadata.description,
      tags: JSON.stringify(metadata.tags || []),
      monetizationType: metadata.monetizationType,
      price: metadata.price?.toString(),
      currency: metadata.currency,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    onProgress?.('uploading-ipfs', 100);
    onProgress?.('seeding', 100);

    return {
      id: response.data.id,
      cid: response.data.cid,
      infoHash: response.data.infoHash,
      magnetUri: response.data.magnetUri,
      video: parseVideo(response.data),
    };
  },

  /**
   * Get upload status for a video
   */
  async getUploadStatus(id: string): Promise<{
    status: string;
    progress: number;
    stage: string;
  }> {
    const response = await api.get(`/api/videos/upload/${id}/status`);
    return response.data;
  },
};