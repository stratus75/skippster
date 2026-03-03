/**
 * Skippster Personal Data Server (PDS)
 * Local data storage with HTTP API
 */

export { DatabaseConnection } from './database/connection';
export type { DatabaseConfig } from './database/connection';
export { SCHEMA, SCHEMA_VERSION } from './database/schema';

// Models
export { UserRepository } from './models/user';
export type { User, CreateUserDto } from './models/user';

export { VideoRepository } from './models/video';
export type { Video, CreateVideoDto } from './models/video';

export { PostRepository } from './models/post';
export type { Post, CreatePostDto } from './models/post';

export { CommentRepository } from './models/comment';
export type { Comment, CreateCommentDto } from './models/comment';

export { ReactionRepository } from './models/reaction';
export type { Reaction, CreateReactionDto } from './models/reaction';

export { SubscriptionRepository } from './models/subscription';
export type { Subscription } from './models/subscription';

// API
export { PDSServer } from './api/server';
export type { ServerConfig } from './api/server';
export { authMiddleware, rateLimitMiddleware, loggerMiddleware } from './api/middleware';

// IPFS
export { ipfsClient, getIPFSClient } from './ipfs/client';

// Main entry point
export function startPDS(config?: { port?: number; dbPath?: string }): Promise<void> {
  const db = DatabaseConnection.createInstance({ path: config?.dbPath });
  const server = new PDSServer(db, { port: config?.port });
  return server.start();
}