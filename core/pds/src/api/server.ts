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
  FriendRepository,
  NotificationRepository,
} from '../models';
import { authMiddleware, setUserRepository } from './middleware';
import { validate, createUserSchema, createVideoSchema, updateVideoSchema, createPostSchema, createCommentSchema, createReactionSchema, createSubscriptionSchema, friendRequestSchema, friendActionSchema, createNotificationSchema } from './validation';
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
    const friendRepo = new FriendRepository(this.db);
    const notificationRepo = new NotificationRepository(this.db);

    // Configure authentication middleware with user repository
    setUserRepository(userRepo);

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
      const validation = validate(createUserSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const user = userRepo.create(validation.data);
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
      const validation = validate(createVideoSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const video = videoRepo.create(validation.data);
        res.status(201).json(video);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.patch('/api/videos/:id', authMiddleware, (req, res) => {
      const validation = validate(updateVideoSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const video = videoRepo.update(req.params.id, validation.data);
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
      const { did, feed, public: isPublic, limit = '20', offset = '0' } = req.query;

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
      const validation = validate(createPostSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const post = postRepo.create(validation.data);
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
      const validation = validate(createCommentSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const comment = commentRepo.create(validation.data);
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
      const validation = validate(createReactionSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const reaction = reactionRepo.create(validation.data);
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
      const validation = validate(createSubscriptionSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const { subscriberDID, creatorDID } = validation.data;
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

    // Friends
    // Get friends list for a user
    this.app.get('/api/friends/:did', (req, res) => {
      const friends = friendRepo.findFriends(req.params.did);
      res.json({ friends, count: friends.length });
    });

    // Get pending friend requests (received)
    this.app.get('/api/friends/requests/:did', (req, res) => {
      const requests = friendRepo.findPendingRequests(req.params.did);
      res.json({ requests, count: requests.length });
    });

    // Get sent friend requests
    this.app.get('/api/friends/sent/:did', (req, res) => {
      const requests = friendRepo.findSentRequests(req.params.did);
      res.json({ requests, count: requests.length });
    });

    // Get friend count
    this.app.get('/api/friends/count/:did', (req, res) => {
      const count = friendRepo.getFriendCount(req.params.did);
      const pendingCount = friendRepo.getPendingRequestCount(req.params.did);
      res.json({ friends: count, pendingRequests: pendingCount });
    });

    // Check friendship status
    this.app.get('/api/friends/status', (req, res) => {
      const { did1, did2 } = req.query;
      if (!did1 || !did2) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      const isFriend = friendRepo.isFriend(did1 as string, did2 as string);
      const hasPending = friendRepo.hasPendingRequest(did1 as string, did2 as string);
      const relationship = friendRepo.findRelationship(did1 as string, did2 as string);
      res.json({ isFriend, hasPendingRequest: hasPending, relationship });
    });

    // Send friend request
    this.app.post('/api/friends/request', authMiddleware, (req, res) => {
      const validation = validate(friendRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const { fromDid, toDid } = validation.data;

        // Check if relationship already exists
        const existing = friendRepo.findRelationship(fromDid, toDid);
        if (existing) {
          return res.status(400).json({ error: 'Friend relationship already exists' });
        }

        const friend = friendRepo.create(fromDid, toDid);

        // Create notification for the recipient
        const fromUser = userRepo.findByDID(fromDid);
        if (fromUser) {
          notificationRepo.createFriendRequestNotification(fromDid, toDid, fromUser.handle);
        }

        res.status(201).json(friend);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Accept friend request
    this.app.post('/api/friends/accept', authMiddleware, (req, res) => {
      const validation = validate(friendActionSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const { fromDid, toDid } = validation.data;

        const friend = friendRepo.accept(fromDid, toDid);
        if (!friend) {
          return res.status(404).json({ error: 'Friend request not found' });
        }

        // Create notification for the requester
        const toUser = userRepo.findByDID(toDid);
        if (toUser) {
          notificationRepo.createFriendAcceptedNotification(toDid, fromDid, toUser.handle);
        }

        res.json(friend);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Delete friend / decline request
    this.app.delete('/api/friends', authMiddleware, (req, res) => {
      const { did1, did2 } = req.query;
      if (!did1 || !did2) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      const deleted = friendRepo.delete(did1 as string, did2 as string);
      res.json({ deleted });
    });

    // Notifications
    // Get notifications for a user
    this.app.get('/api/notifications/:did', (req, res) => {
      const { limit = '50', offset = '0' } = req.query;
      const notifications = notificationRepo.findByDid(req.params.did, Number(limit), Number(offset));
      const unreadCount = notificationRepo.getUnreadCount(req.params.did);
      res.json({ notifications, unreadCount });
    });

    // Get unread notifications
    this.app.get('/api/notifications/unread/:did', (req, res) => {
      const notifications = notificationRepo.findUnread(req.params.did);
      res.json({ notifications, count: notifications.length });
    });

    // Get unread count
    this.app.get('/api/notifications/count/:did', (req, res) => {
      const count = notificationRepo.getUnreadCount(req.params.did);
      res.json({ unreadCount: count });
    });

    // Mark notification as read
    this.app.patch('/api/notifications/:id/read', (req, res) => {
      const success = notificationRepo.markAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ success: true });
    });

    // Mark all notifications as read
    this.app.patch('/api/notifications/read-all/:did', (req, res) => {
      const count = notificationRepo.markAllAsRead(req.params.did);
      res.json({ markedAsRead: count });
    });

    // Delete notification
    this.app.delete('/api/notifications/:id', (req, res) => {
      const deleted = notificationRepo.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ deleted: true });
    });

    // Create notification (for testing or system notifications)
    this.app.post('/api/notifications', authMiddleware, (req, res) => {
      const validation = validate(createNotificationSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      try {
        const notification = notificationRepo.create(validation.data);
        res.status(201).json(notification);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // IPFS endpoints disabled - uncomment when IPFS is configured
    // this.app.post('/api/ipfs/upload', authMiddleware, async (req, res) => {
    //   try {
    //     const { data } = req.body;
    //     const cid = await ipfsClient.add(data);
    //     res.json({ cid: cid.toString() });
    //   } catch (error: any) {
    //     res.status(500).json({ error: error.message });
    //   }
    // });

    // this.app.get('/api/ipfs/:cid', async (req, res) => {
    //   try {
    //     const data = await ipfsClient.cat(req.params.cid);
    //     res.send(data);
    //   } catch (error: any) {
    //     res.status(500).json({ error: error.message });
    //   }
    // });
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