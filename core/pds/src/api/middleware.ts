/**
 * PDS API Middleware
 * Authentication (Ed25519 DID tokens), rate limiting, logging
 */

import type { Request, Response, NextFunction } from 'express';
import { parseAuthToken, verifyAuthToken, isTokenTimestampValid } from './auth';
import { DatabaseConnection } from '../database/connection';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        did: string;
        handle: string;
      };
    }
  }
}

// Repository will be injected via closure in the middleware factory
let userRepo: { findByDID: (did: string) => { did: string; handle: string; publicKey: string } | null } | null = null;

/**
 * Set the user repository for authentication
 * Must be called before authMiddleware is used
 */
export function setUserRepository(
  repo: { findByDID: (did: string) => { did: string; handle: string; publicKey: string } | null }
): void {
  userRepo = repo;
}

async function authenticate(
  authHeader: string | undefined
): Promise<{ did: string; handle: string } | { error: string; status: number } | null> {
  const token = parseAuthToken(authHeader);

  if (!token) {
    return { error: 'Invalid authorization format', status: 401 };
  }

  // Validate DID format
  if (!token.did.startsWith('did:plc:')) {
    return { error: 'Invalid DID format', status: 401 };
  }

  // Check timestamp to prevent replay attacks
  if (!isTokenTimestampValid(token.timestamp)) {
    return { error: 'Token expired', status: 401 };
  }

  // Look up user to get public key (server-side source of truth)
  if (!userRepo) {
    console.error('User repository not configured for authentication');
    return { error: 'Authentication not configured', status: 500 };
  }

  const user = userRepo.findByDID(token.did);
  if (!user) {
    return { error: 'User not found', status: 401 };
  }

  // Verify REAL Ed25519 signature + anti-replay
  const isValid = await verifyAuthToken(token, user.publicKey);
  if (!isValid) {
    return { error: 'Invalid signature', status: 401 };
  }

  return { did: user.did, handle: user.handle };
}

/**
 * DID-based authentication middleware
 * Verifies the Ed25519 signature in the Authorization header
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const result = await authenticate(authHeader);

    if (!result || 'error' in result) {
      res.status(result?.status ?? 401).json({ error: result?.error ?? 'Authentication failed' });
      return;
    }

    req.user = result;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Extracts user info if present, but doesn't require authentication
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const result = await authenticate(authHeader);

    if (result && !('error' in result)) {
      req.user = result;
    }
    next();
  } catch {
    next();
  }
}

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  windowMs: number = 60000,
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(ip);
    
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (record.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    
    record.count++;
    next();
  };
}

// Logger middleware
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}