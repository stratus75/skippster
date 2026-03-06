/**
 * Skippster Personal Data Server (PDS)
 * Local data storage with HTTP API
 */

// Database
export { DatabaseConnection } from './database/connection';
export type { DatabaseConfig } from './database/connection';
export { SCHEMA, SCHEMA_VERSION } from './database/schema';

// Models - export through barrel file
export {
  UserRepository,
  VideoRepository,
  PostRepository,
  CommentRepository,
  ReactionRepository,
  SubscriptionRepository,
} from './models';

export type {
  User,
  CreateUserDto,
  Video,
  CreateVideoDto,
  Post,
  CreatePostDto,
  Comment,
  CreateCommentDto,
  Reaction,
  CreateReactionDto,
  Subscription,
} from './models';

// API
export { PDSServer } from './api/server';
export type { ServerConfig } from './api/server';
export { authMiddleware, rateLimitMiddleware, loggerMiddleware } from './api/middleware';

// IPFS
export { ipfsClient, getIPFSClient } from './ipfs/client';

// Main entry point
import { DatabaseConnection } from './database/connection';
import { PDSServer } from './api/server';

export function startPDS(config?: { port?: number; dbPath?: string }): Promise<void> {
  const db = DatabaseConnection.createInstance({ path: config?.dbPath });
  const server = new PDSServer(db, { port: config?.port || 4000 });
  return server.start();
}
