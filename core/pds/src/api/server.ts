/**
 * PDS HTTP Server
 * Express-based REST API for Personal Data Server
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DatabaseConnection } from '../database/connection';
import {
  UserRepository,
  VideoRepository,
  PostRepository,
  CommentRepository,
  ReactionRepository,
  SubscriptionRepository,
} from '../models';
import { authMiddleware } from './middleware';
// IPFS disabled: import { ipfsClient } from '../ipfs/client';

export interface ServerConfig {
  port?: number;
  host?: string;
  corsOrigin?: string;
}

export class PDSServer {
  private app: express.Application;
  private db: DatabaseConnection;
  private config: ServerConfig;

  constructor(db: DatabaseConnection, config: ServerConfig = {}) {
    this.db = db;
    this.config = {
      port: config.port || 4000,
      host: config.host || '0.0.0.0',
      corsOrigin: config.corsOrigin || '*',
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({ origin: this.config.corsOrigin }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    const userRepo = new UserRepository(this.db);
    const videoRepo = new VideoRepository(this.db);
    const postRepo = new PostRepository(this.db);
    const commentRepo = new CommentRepository(this.db);
    const reactionRepo = new ReactionRepository(this.db);
    const subscriptionRepo = new SubscriptionRepository(this.db);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Users
    this.app.get('/api/users/:did', authMiddleware, (req, res) => {
      const user = userRepo.findByDID(req.params.did);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    });

    this.app.post('/api/users', authMiddleware, (req, res) => {
      try {
        const user = userRepo.create(req.body);
        res.status(201).json(user);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Videos
    this.app.get('/api/videos/:id', (req, res) => {
      const video = videoRepo.findById(req.params.id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      res.json(video);
    });

    this.app.get('/api/videos', (req, res) => {
      const { did, trending, recommended, search, limit = '20', offset = '0' } = req.query;

      let videos;
      if (trending === 'true') {
        videos = videoRepo.findTrending(Number(limit), Number(offset));
      } else if (recommended && typeof recommended === 'string') {
        videos = videoRepo.findRecommended(recommended, Number(limit));
      } else if (search && typeof search === 'string') {
        videos = videoRepo.search(search, Number(limit));
      } else if (did && typeof did === 'string') {
        videos = videoRepo.findByDID(did, Number(limit), Number(offset));
      } else {
        videos = [];
      }

      res.json({ videos, limit: Number(limit), offset: Number(offset) });
    });

    this.app.post('/api/videos', authMiddleware, async (req, res) => {
      try {
        const video = videoRepo.create(req.body);
        res.status(201).json(video);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.patch('/api/videos/:id', authMiddleware, (req, res) => {
      try {
        const video = videoRepo.update(req.params.id, req.body);
        if (!video) {
          return res.status(404).json({ error: 'Video not found' });
        }
        res.json(video);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/videos/:id/view', (req, res) => {
      const views = videoRepo.incrementViews(req.params.id);
      res.json({ views });
    });

    // Posts
    this.app.get('/api/posts/:id', (req, res) => {
      const post = postRepo.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    });

    this.app.get('/api/posts', (req, res) => {
      const { did, feed, public, limit = '20', offset = '0' } = req.query;

      let posts;
      if (feed && typeof feed === 'string') {
        posts = postRepo.findFeed(feed, Number(limit), Number(offset));
      } else if (isPublic === 'true') {
        posts = postRepo.findPublic(Number(limit), Number(offset));
      } else if (did && typeof did === 'string') {
        posts = postRepo.findByDID(did, Number(limit), Number(offset));
      } else {
        posts = [];
      }

      res.json({ posts, limit: Number(limit), offset: Number(offset) });
    });

    this.app.post('/api/posts', authMiddleware, (req, res) => {
      try {
        const post = postRepo.create(req.body);
        res.status(201).json(post);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Comments
    this.app.get('/api/comments/:id', (req, res) => {
      const comment = commentRepo.findById(req.params.id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json(comment);
    });

    this.app.get('/api/comments', (req, res) => {
      const { targetType, targetId, parentId, did, limit = '50' } = req.query;

      let comments;
      if (parentId && typeof parentId === 'string') {
        comments = commentRepo.findByParent(parentId, Number(limit));
      } else if (targetType && targetId && typeof targetType === 'string' && typeof targetId === 'string') {
        comments = commentRepo.findByTarget(targetType as 'video' | 'post', targetId, Number(limit));
      } else if (did && typeof did === 'string') {
        comments = commentRepo.findByDID(did, Number(limit));
      } else {
        comments = [];
      }

      res.json({ comments, limit: Number(limit) });
    });

    this.app.post('/api/comments', authMiddleware, (req, res) => {
      try {
        const comment = commentRepo.create(req.body);
        res.status(201).json(comment);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Reactions
    this.app.get('/api/reactions', (req, res) => {
      const { targetType, targetId, did, grouped } = req.query;

      if (grouped === 'true' && targetType && targetId && typeof targetType === 'string' && typeof targetId === 'string') {
        const groupedReactions = reactionRepo.findByTargetGrouped(targetType as 'video' | 'post', targetId);
        res.json(Object.fromEntries(groupedReactions));
      } else if (targetType && targetId && typeof targetType === 'string' && typeof targetId === 'string') {
        const reactions = reactionRepo.findByTarget(targetType as 'video' | 'post', targetId);
        res.json({ reactions });
      } else if (did && typeof did === 'string') {
        const reactions = reactionRepo.findByDID(did);
        res.json({ reactions });
      } else {
        res.json({ reactions: [] });
      }
    });

    this.app.post('/api/reactions', authMiddleware, (req, res) => {
      try {
        const reaction = reactionRepo.create(req.body);
        res.status(201).json(reaction);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/reactions', authMiddleware, (req, res) => {
      const { did, targetType, targetId } = req.query;
      if (!did || !targetType || !targetId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      reactionRepo.delete(did as string, targetType as 'video' | 'post', targetId as string);
      res.status(204).send();
    });

    // Subscriptions
    this.app.get('/api/subscriptions/subscribers/:creatorDID', (req, res) => {
      const { limit = '100', offset = '0' } = req.query;
      const subscriptions = subscriptionRepo.findSubscribers(req.params.creatorDID, Number(limit), Number(offset));
      res.json({ subscriptions, count: subscriptionRepo.getSubscriberCount(req.params.creatorDID) });
    });

    this.app.get('/api/subscriptions/user/:subscriberDID', (req, res) => {
      const { limit = '100', offset = '0' } = req.query;
      const subscriptions = subscriptionRepo.findSubscriptions(req.params.subscriberDID, Number(limit), Number(offset));
      res.json({ subscriptions, count: subscriptionRepo.getSubscriptionCount(req.params.subscriberDID) });
    });

    this.app.post('/api/subscriptions', authMiddleware, (req, res) => {
      try {
        const { subscriberDID, creatorDID } = req.body;
        const subscription = subscriptionRepo.create(subscriberDID, creatorDID);
        res.status(201).json(subscription);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/subscriptions', authMiddleware, (req, res) => {
      const { subscriberDID, creatorDID } = req.query;
      if (!subscriberDID || !creatorDID) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      subscriptionRepo.delete(subscriberDID as string, creatorDID as string);
      res.status(204).send();
    });

    // IPFS upload
    this.app.post('/api/ipfs/upload', authMiddleware, async (req, res) => {
      try {
        const { data } = req.body;
        const cid = await ipfsClient.add(data);
        res.json({ cid: cid.toString() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // IPFS retrieve
    this.app.get('/api/ipfs/:cid', async (req, res) => {
      try {
        const data = await ipfsClient.cat(req.params.cid);
        res.send(data);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`PDS server listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        server.close(() => {
          console.log('PDS server closed');
          this.db.close();
        });
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}