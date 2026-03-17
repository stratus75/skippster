/**
 * PDS API Middleware
 * Authentication, rate limiting, logging
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

/**
 * DID-based authentication middleware
 * Verifies the signature in the Authorization header
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = parseAuthToken(authHeader);

  if (!token) {
    res.status(401).json({ error: 'Invalid authorization format' });
    return;
  }

  // Validate DID format
  if (!token.did.startsWith('did:plc:')) {
    res.status(401).json({ error: 'Invalid DID format' });
    return;
  }

  // Check timestamp to prevent replay attacks
  if (!isTokenTimestampValid(token.timestamp)) {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  // Look up user to get public key
  if (!userRepo) {
    console.error('User repository not configured for authentication');
    res.status(500).json({ error: 'Authentication not configured' });
    return;
  }

  const user = userRepo.findByDID(token.did);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  // Verify signature asynchronously
  verifyAuthToken(token, user.publicKey)
    .then((isValid) => {
      if (!isValid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Attach authenticated user to request
      req.user = {
        did: user.did,
        handle: user.handle,
      };
      next();
    })
    .catch((err) => {
      console.error('Authentication error:', err);
      res.status(401).json({ error: 'Authentication failed' });
    });
}

/**
 * Optional authentication middleware
 * Extracts user info if present, but doesn't require authentication
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = parseAuthToken(authHeader);

  if (!token || !token.did.startsWith('did:plc:')) {
    next();
    return;
  }

  if (!userRepo || !isTokenTimestampValid(token.timestamp)) {
    next();
    return;
  }

  const user = userRepo.findByDID(token.did);
  if (user) {
    verifyAuthToken(token, user.publicKey)
      .then((isValid) => {
        if (isValid) {
          req.user = { did: user.did, handle: user.handle };
        }
        next();
      })
      .catch(() => {
        next();
      });
  } else {
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
