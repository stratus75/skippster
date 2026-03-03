/**
 * Express middleware for PDS
 */

import { Request, Response, NextFunction } from 'express';
import { verifySignature } from '@skippster/identity';

/**
 * Authentication middleware
 * Verifies requests using DID signatures
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  try {
    const signature = authHeader.replace('Bearer ', '');
    const did = req.headers['x-did'] as string;

    if (!did) {
      res.status(401).json({ error: 'Missing DID header' });
      return;
    }

    // Verify signature against request body/path
    const message = `${req.method}:${req.path}:${JSON.stringify(req.body)}`;
    const publicKey = Buffer.from(req.headers['x-public-key'] as string, 'hex');

    if (!verifySignature(
      Buffer.from(message),
      Buffer.from(signature, 'hex'),
      publicKey
    )) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Attach DID to request
    (req as any).did = did;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Rate limiting middleware (in-memory for MVP)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req as any).did || req.ip;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', resetIn.toString());
      res.status(429).json({ error: 'Too many requests', retryAfter: resetIn });
      return;
    }

    record.count++;
    next();
  };
}

/**
 * Request logger
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}