/**
 * Request validation schemas using Zod
 */

import { z } from 'zod';

// DID validation pattern
const DID_REGEX = /^did:plc:[a-z0-9]{24}$/;
const HANDLE_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,28}[a-zA-Z0-9])?$/;

// User schemas
export const createUserSchema = z.object({
  did: z.string().regex(DID_REGEX, 'Invalid DID format'),
  handle: z.string().regex(HANDLE_REGEX, 'Invalid handle format'),
  publicKey: z.string().length(64, 'Public key must be 64 hex characters'),
});

export const updateUserSchema = z.object({
  handle: z.string().regex(HANDLE_REGEX, 'Invalid handle format').optional(),
  publicKey: z.string().length(64, 'Public key must be 64 hex characters').optional(),
});

// Video schemas
export const createVideoSchema = z.object({
  id: z.string().min(1, 'Video ID required'),
  did: z.string().regex(DID_REGEX, 'Invalid creator DID'),
  title: z.string().min(1).max(200, 'Title must be 1-200 characters'),
  description: z.string().max(5000).optional(),
  thumbnailCid: z.string().max(200).optional(),
  magnetLink: z.string().min(1, 'Magnet link required'),
  duration: z.number().int().nonnegative().default(0),
  tags: z.array(z.string().max(50)).max(20).optional(),
  monetizationType: z.enum(['free', 'donations', 'payperview', 'subscription']).default('free'),
  price: z.number().positive().optional(),
  currency: z.string().max(8).optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  thumbnailCid: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  monetizationType: z.enum(['free', 'donations', 'payperview', 'subscription']).optional(),
  price: z.number().positive().optional(),
  currency: z.string().max(8).optional(),
});

// Post schemas
export const createPostSchema = z.object({
  id: z.string().min(1, 'Post ID required'),
  did: z.string().regex(DID_REGEX, 'Invalid author DID'),
  content: z.string().max(5000, 'Content must be under 5000 characters'),
  mediaCids: z.array(z.string().max(200)).max(10).optional(),
  videoId: z.string().max(100).optional(),
  privacy: z.enum(['public', 'friends', 'group', 'specific']).default('public'),
});

export const updatePostSchema = z.object({
  content: z.string().max(5000).optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  id: z.string().min(1, 'Comment ID required'),
  did: z.string().regex(DID_REGEX, 'Invalid author DID'),
  targetType: z.enum(['video', 'post']),
  targetId: z.string().min(1, 'Target ID required'),
  content: z.string().max(2000, 'Comment must be under 2000 characters'),
  parentId: z.string().optional(),
});

// Reaction schemas
export const createReactionSchema = z.object({
  id: z.string().min(1, 'Reaction ID required'),
  did: z.string().regex(DID_REGEX, 'Invalid author DID'),
  targetType: z.enum(['video', 'post']),
  targetId: z.string().min(1, 'Target ID required'),
  emoji: z.string().max(16).optional(),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  subscriberDID: z.string().regex(DID_REGEX, 'Invalid subscriber DID'),
  creatorDID: z.string().regex(DID_REGEX, 'Invalid creator DID'),
});

// Friend schemas
export const friendRequestSchema = z.object({
  fromDid: z.string().regex(DID_REGEX, 'Invalid from DID'),
  toDid: z.string().regex(DID_REGEX, 'Invalid to DID'),
});

export const friendActionSchema = z.object({
  fromDid: z.string().regex(DID_REGEX, 'Invalid from DID'),
  toDid: z.string().regex(DID_REGEX, 'Invalid to DID'),
});

// Notification schemas
export const createNotificationSchema = z.object({
  id: z.string().optional(),
  toDid: z.string().regex(DID_REGEX, 'Invalid recipient DID'),
  type: z.enum(['friend_request', 'friend_accepted', 'post_like', 'comment', 'mention', 'video_comment', 'video_like', 'subscription', 'system']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().max(500).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const videoQuerySchema = paginationSchema.extend({
  did: z.string().regex(DID_REGEX).optional(),
  trending: z.enum(['true', 'false']).optional(),
  recommended: z.string().optional(),
  search: z.string().max(200).optional(),
});

export const postQuerySchema = paginationSchema.extend({
  did: z.string().regex(DID_REGEX).optional(),
  feed: z.string().regex(DID_REGEX).optional(),
  public: z.enum(['true', 'false']).optional(),
});

export const commentQuerySchema = paginationSchema.extend({
  targetType: z.enum(['video', 'post']).optional(),
  targetId: z.string().optional(),
  parentId: z.string().optional(),
  did: z.string().regex(DID_REGEX).optional(),
});

// Validation helper
export function validate<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  return { success: false, error: errorMessage };
}