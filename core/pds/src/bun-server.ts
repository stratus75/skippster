/**
 * Skippster PDS Server - Bun Version
 * Uses bun:sqlite for native compatibility
 * Includes WebTorrent video upload support
 */

import { DatabaseConnection } from './database/bun-connection.js';
import { UserRepository } from './models/user-bun.js';
import { VideoRepository } from './models/video-bun.js';
import { CommentRepository } from './models/comment-bun.js';
import { getTorrentService, TorrentService } from './services/torrent.js';
import { mkdir } from 'fs/promises';

const db = DatabaseConnection.createInstance({ path: './skippster.db' });
const userRepo = new UserRepository(db);
const videoRepo = new VideoRepository(db);
const commentRepo = new CommentRepository(db);

// Initialize torrent service
const torrentService = getTorrentService('./uploads');

// Track upload status
const uploadStatus = new Map<string, {
  id: string;
  status: 'processing' | 'ready' | 'error';
  progress: number;
  error?: string;
  videoId?: string;
  magnetURI?: string;
}>();

const PORT = process.env.PORT || 4000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to parse JSON body
    const getBody = async () => {
      try {
        return await req.json();
      } catch {
        return null;
      }
    };

    // Helper for JSON responses
    const json = (data: any, status = 200) => {
      return Response.json(data, { status, headers: corsHeaders });
    };

    try {
      // Health check
      if (path === '/health' && method === 'GET') {
        return json({ ok: true, torrent: torrentService ? 'initialized' : 'pending' });
      }

      // ===== UPLOAD API =====
      if (path === '/api/videos/upload' && method === 'POST') {
        try {
          // Ensure uploads directory exists
          await mkdir('./uploads', { recursive: true });

          // Parse multipart form data
          const formData = await req.formData();
          const file = formData.get('file') as File | null;
          const title = formData.get('title') as string;
          const description = formData.get('description') as string || '';
          const tagsStr = formData.get('tags') as string || '';
          const did = formData.get('did') as string || 'did:plc:anonymous';
          const monetizationType = formData.get('monetizationType') as string || 'free';

          if (!file) {
            return json({ error: 'No file provided' }, 400);
          }

          if (!title) {
            return json({ error: 'Title is required' }, 400);
          }

          // Generate video ID
          const videoId = torrentService.generateId();
          const uploadId = `upload_${Date.now()}`;

          // Initialize status
          uploadStatus.set(uploadId, {
            id: uploadId,
            status: 'processing',
            progress: 0,
          });

          // Get file extension
          const ext = file.name?.split('.').pop() || 'mp4';
          const filename = `${videoId}.${ext}`;

          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Save file to disk
          const filePath = await torrentService.saveFile(filename, buffer);

          console.log(`File saved: ${filePath} (${buffer.length} bytes)`);

          // Update status
          uploadStatus.set(uploadId, {
            id: uploadId,
            status: 'processing',
            progress: 50,
          });

          // Create torrent and start seeding
          const torrentResult = await torrentService.seedFile(filePath, title);

          console.log(`Torrent created: ${torrentResult.magnetURI}`);

          // Parse tags
          const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : undefined;

          // Create video record in database
          const video = videoRepo.create({
            id: videoId,
            did: did,
            title: title,
            description: description || undefined,
            magnetLink: torrentResult.magnetURI,
            duration: 0, // TODO: extract from video file
            tags: tags,
            monetizationType: monetizationType as any,
          });

          // Update status to ready
          uploadStatus.set(uploadId, {
            id: uploadId,
            status: 'ready',
            progress: 100,
            videoId: videoId,
            magnetURI: torrentResult.magnetURI,
          });

          return json({
            id: videoId,
            title: video.title,
            description: video.description,
            magnetURI: torrentResult.magnetURI,
            infoHash: torrentResult.infoHash,
            size: torrentResult.size,
            status: 'ready',
            createdAt: video.createdAt,
          }, 201);

        } catch (e: any) {
          console.error('Upload error:', e);
          return json({ error: e.message || 'Upload failed' }, 500);
        }
      }

      // Upload status endpoint
      if (path.startsWith('/api/videos/upload/status/') && method === 'GET') {
        const uploadId = path.replace('/api/videos/upload/status/', '');
        const status = uploadStatus.get(uploadId);
        if (!status) {
          return json({ error: 'Upload not found' }, 404);
        }
        return json(status);
      }

      // Active torrents endpoint
      if (path === '/api/torrents' && method === 'GET') {
        const torrents = torrentService.getActiveTorrents();
        return json({ torrents });
      }

      // ===== USERS API =====
      if (path === '/api/users' && method === 'GET') {
        const users = userRepo.findAll();
        return json({ users });
      }

      if (path.startsWith('/api/users/') && method === 'GET') {
        const did = path.replace('/api/users/', '');
        const user = userRepo.findByDID(did);
        if (!user) return json({ error: 'Not found' }, 404);
        return json(user);
      }

      if (path === '/api/users' && method === 'POST') {
        const body = await getBody();
        if (!body) return json({ error: 'Invalid JSON' }, 400);
        try {
          const user = userRepo.create(body);
          return json(user, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      // ===== VIDEOS API =====
      if (path === '/api/videos' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const videos = videoRepo.findAll(limit, offset);
        return json({ videos });
      }

      if (path === '/api/videos/trending' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const videos = videoRepo.findTrending(limit);
        return json({ videos });
      }

      if (path === '/api/videos/search' && method === 'GET') {
        const query = url.searchParams.get('q') || '';
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const videos = videoRepo.search(query, limit);
        return json({ videos });
      }

      if (path.startsWith('/api/videos/creator/') && method === 'GET') {
        const did = path.replace('/api/videos/creator/', '');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const videos = videoRepo.findByDID(did, limit, offset);
        return json({ videos });
      }

      // Video by ID (must come after other /api/videos/* routes)
      if (path.match(/^\/api\/videos\/[^/]+$/) && method === 'GET') {
        const id = path.replace('/api/videos/', '');
        const video = videoRepo.findById(id);
        if (!video) return json({ error: 'Not found' }, 404);
        return json(video);
      }

      if (path === '/api/videos' && method === 'POST') {
        const body = await getBody();
        if (!body) return json({ error: 'Invalid JSON' }, 400);
        try {
          const video = videoRepo.create(body);
          return json(video, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      if (path.match(/^\/api\/videos\/[^/]+$/) && method === 'PATCH') {
        const id = path.replace('/api/videos/', '');
        const body = await getBody();
        if (!body) return json({ error: 'Invalid JSON' }, 400);
        try {
          const video = videoRepo.update(id, body);
          if (!video) return json({ error: 'Not found' }, 404);
          return json(video);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      if (path.match(/^\/api\/videos\/[^/]+$/) && method === 'DELETE') {
        const id = path.replace('/api/videos/', '');
        try {
          // Get video to find magnet link
          const video = videoRepo.findById(id);
          if (video) {
            // Stop seeding if active
            const torrents = torrentService.getActiveTorrents();
            for (const t of torrents) {
              if (t.magnetURI === video.magnetLink) {
                await torrentService.stopSeeding(t.infoHash, false);
                break;
              }
            }
          }

          const deleted = videoRepo.delete(id);
          if (!deleted) return json({ error: 'Not found' }, 404);
          return json({ deleted: true });
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      // Increment views
      if (path.match(/^\/api\/videos\/[^/]+\/view$/) && method === 'POST') {
        const id = path.replace('/api/videos/', '').replace('/view', '');
        try {
          const views = videoRepo.incrementViews(id);
          return json({ views });
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      // ===== COMMENTS API =====
      if (path.match(/^\/api\/videos\/[^/]+\/comments$/) && method === 'GET') {
        const videoId = path.replace('/api/videos/', '').replace('/comments', '');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const comments = commentRepo.findByTarget('video', videoId, limit);
        return json({ comments });
      }

      if (path.match(/^\/api\/videos\/[^/]+\/comments$/) && method === 'POST') {
        const videoId = path.replace('/api/videos/', '').replace('/comments', '');
        const body = await getBody();
        if (!body) return json({ error: 'Invalid JSON' }, 400);
        try {
          const commentData = {
            ...body,
            targetType: 'video' as const,
            targetId: videoId,
          };
          const comment = commentRepo.create(commentData);
          return json(comment, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      }

      // 404
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      console.error('Server error:', e);
      return json({ error: 'Internal server error' }, 500);
    }
  },
});

// Initialize torrent service
torrentService.initialize().then(() => {
  console.log(`Skippster PDS running on port ${PORT}`);
  console.log('Video API endpoints:');
  console.log('  GET    /api/videos');
  console.log('  GET    /api/videos/trending');
  console.log('  GET    /api/videos/search?q=query');
  console.log('  GET    /api/videos/:id');
  console.log('  GET    /api/videos/creator/:did');
  console.log('  POST   /api/videos/upload (multipart)');
  console.log('  POST   /api/videos');
  console.log('  PATCH  /api/videos/:id');
  console.log('  DELETE /api/videos/:id');
  console.log('  POST   /api/videos/:id/view');
  console.log('  GET    /api/videos/:id/comments');
  console.log('  POST   /api/videos/:id/comments');
  console.log('  GET    /api/torrents');
});