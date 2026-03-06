/**
 * PDS API Middleware
 * Authentication, rate limiting, logging
 */

import type { Request, Response, NextFunction } from 'express';

// Simple auth middleware that accepts any request for now
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement proper DID-based authentication
  // For now, allow all requests
  next();
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
