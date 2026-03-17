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
