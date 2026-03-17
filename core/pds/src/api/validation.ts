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
  creatorDID: z.string().regex(DID_REGEX, 'Invalid creator DID'),
  title: z.string().min(1).max(200, 'Title must be 1-200 characters'),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().optional(),
  magnetLink: z.string().min(1, 'Magnet link required'),
  duration: z.number().int().positive().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  monetizationType: z.enum(['free', 'paid', 'subscription']).default('free'),
  price: z.number().positive().optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  monetizationType: z.enum(['free', 'paid', 'subscription']).optional(),
  price: z.number().positive().optional(),
});

// Post schemas
export const createPostSchema = z.object({
  id: z.string().min(1, 'Post ID required'),
  authorDID: z.string().regex(DID_REGEX, 'Invalid author DID'),
  content: z.string().max(5000, 'Content must be under 5000 characters'),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
});

export const updatePostSchema = z.object({
  content: z.string().max(5000).optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  id: z.string().min(1, 'Comment ID required'),
  authorDID: z.string().regex(DID_REGEX, 'Invalid author DID'),
  targetType: z.enum(['video', 'post']),
  targetId: z.string().min(1, 'Target ID required'),
  content: z.string().max(2000, 'Comment must be under 2000 characters'),
  parentId: z.string().optional(),
});

// Reaction schemas
export const createReactionSchema = z.object({
  authorDID: z.string().regex(DID_REGEX, 'Invalid author DID'),
  targetType: z.enum(['video', 'post']),
  targetId: z.string().min(1, 'Target ID required'),
  reactionType: z.enum(['like', 'love', 'laugh', 'wow', 'sad', 'angry']),
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
  recipientDID: z.string().regex(DID_REGEX, 'Invalid recipient DID'),
  type: z.enum(['friend_request', 'friend_accepted', 'comment', 'reaction', 'mention', 'system']),
  title: z.string().min(1).max(200),
  content: z.string().max(1000).optional(),
  data: z.record(z.unknown()).optional(),
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
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  return { success: false, error: errorMessage };
}