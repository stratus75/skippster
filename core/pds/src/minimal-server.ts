import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DatabaseConnection } from './database/connection.js';
import { UserRepository } from './models/user.js';
import { VideoRepository } from './models/video.js';
import { CommentRepository } from './models/comment.js';

const app = express();
const db = DatabaseConnection.createInstance({ path: './skippster.db' });

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const userRepo = new UserRepository(db);
const videoRepo = new VideoRepository(db);
const commentRepo = new CommentRepository(db);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ===== USERS API =====
app.get('/api/users', (_req: Request, res: Response) => {
  try {
    const stmt = db.getDb().prepare('SELECT * FROM users LIMIT 50');
    const users = stmt.all();
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/users/:did', (req: Request, res: Response) => {
  try {
    const user = userRepo.findByDID(req.params.did);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/users', (req: Request, res: Response) => {
  try {
    const user = userRepo.create(req.body);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ===== VIDEOS API =====
app.get('/api/videos', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const videos = videoRepo.findAll(limit, offset);
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos/trending', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const videos = videoRepo.findTrending(limit);
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos/search', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;
    const videos = videoRepo.search(query, limit);
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos/:id', (req: Request, res: Response) => {
  try {
    const video = videoRepo.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Not found' });
    res.json(video);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos/creator/:did', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const videos = videoRepo.findByDID(req.params.did, limit, offset);
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/videos', (req: Request, res: Response) => {
  try {
    const video = videoRepo.create(req.body);
    res.status(201).json(video);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.patch('/api/videos/:id', (req: Request, res: Response) => {
  try {
    const video = videoRepo.update(req.params.id, req.body);
    if (!video) return res.status(404).json({ error: 'Not found' });
    res.json(video);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/videos/:id', (req: Request, res: Response) => {
  try {
    const deleted = videoRepo.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/videos/:id/view', (req: Request, res: Response) => {
  try {
    const views = videoRepo.incrementViews(req.params.id);
    res.json({ views });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ===== VIDEO UPLOAD API (IPFS + Torrent) =====
// Note: Uses base64-encoded file data for simplicity
// In production, install multer or use busboy for multipart handling

import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { createHash, randomBytes } from 'crypto';

async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {}
}

// Simple torrent info hash generator
function generateInfoHash(data: Buffer, name: string): string {
  const hash = createHash('sha1');
  hash.update(data.slice(0, Math.min(data.length, 1024 * 1024)));
  hash.update(name);
  hash.update(Date.now().toString());
  return hash.digest('hex');
}

// Upload endpoint - handles video file as base64, stores to disk, creates torrent
app.post('/api/videos/upload', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    
    if (!body.videoData) {
      res.status(400).json({ error: 'No video data provided' });
      return;
    }

    const { 
      title, 
      description, 
      tags, 
      monetizationType, 
      price, 
      currency,
      filename,
      fileSize 
    } = body;
    
    // Decode base64 video data
    const videoBuffer = Buffer.from(body.videoData, 'base64');
    const originalName = filename || 'video.mp4';
    const size = fileSize || videoBuffer.length;

    // Generate video ID
    const id = `vid_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;

    // Generate IPFS-style CID (stub)
    const cid = `bafk${generateInfoHash(videoBuffer, originalName)}`;

    // Generate torrent info hash and magnet URI
    const infoHash = generateInfoHash(videoBuffer, originalName);
    const trackers = [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'udp://tracker.opentrackr.org:1337/announce',
    ];
    const magnetUri = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(originalName)}` +
      trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), 'uploads');
    await ensureDir(uploadsDir);
    const filePath = join(uploadsDir, `${id}-${originalName}`);
    await writeFile(filePath, videoBuffer);

    // Parse tags
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = [];
      }
    }

    // Create video record
    const videoData = {
      id,
      did: 'anonymous',
      title: title || originalName,
      description: description || null,
      thumbnailCid: null,
      magnetLink: magnetUri,
      duration: 0,
      views: 0,
      tags: parsedTags.length > 0 ? parsedTags : null,
      monetizationType: monetizationType || 'free',
      price: price ? parseFloat(price) : null,
      currency: currency || null,
    };

    const video = videoRepo.create(videoData);

    console.log(`[Upload] Video ${id} uploaded: ${size} bytes`);
    console.log(`[Upload] CID: ${cid}`);
    console.log(`[Upload] Magnet: ${magnetUri.slice(0, 80)}...`);

    res.status(201).json({
      id,
      cid,
      infoHash,
      magnetUri,
      ...video,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upload status (stub for transcoding progress)
app.get('/api/videos/upload/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    id,
    status: 'complete',
    progress: 100,
    stage: 'seeding',
  });
});

// ===== COMMENTS API =====
app.get('/api/videos/:id/comments', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const comments = commentRepo.findByTarget('video', req.params.id, limit);
    res.json({ comments });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/videos/:id/comments', (req: Request, res: Response) => {
  try {
    const commentData = {
      ...req.body,
      targetType: 'video' as const,
      targetId: req.params.id
    };
    const comment = commentRepo.create(commentData);
    res.status(201).json(comment);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Skippster PDS running on port ' + PORT);
  console.log('Video API endpoints:');
  console.log('  GET    /api/videos');
  console.log('  GET    /api/videos/trending');
  console.log('  GET    /api/videos/search?q=query');
  console.log('  GET    /api/videos/:id');
  console.log('  GET    /api/videos/creator/:did');
  console.log('  POST   /api/videos');
  console.log('  PATCH  /api/videos/:id');
  console.log('  DELETE /api/videos/:id');
  console.log('  POST   /api/videos/:id/view');
});
