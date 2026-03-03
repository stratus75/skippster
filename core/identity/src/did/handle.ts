/**
 * Handle management (@username.skippster.social)
 */

import { sha256 } from '@noble/hashes/sha256';

const DOMAIN = 'skippster.social';
const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * Validate a handle username
 */
export function validateHandle(username: string): boolean {
  if (!username || username.length < 3 || username.length > 63) {
    return false;
  }
  return HANDLE_REGEX.test(username);
}

/**
 * Format a handle (@username.skippster.social)
 */
export function formatHandle(username: string): string {
  const cleanUsername = username.trim().toLowerCase();
  if (!validateHandle(cleanUsername)) {
    throw new Error('Invalid handle username');
  }
  return `@${cleanUsername}.${DOMAIN}`;
}

/**
 * Parse a handle to extract username
 */
export function parseHandle(handle: string): string | null {
  const parts = handle.match(/^@([^.]+)\.?/);
  return parts ? parts[1] : null;
}

/**
 * Check if handle is available (reserved handles)
 */
export function isHandleAvailable(username: string): boolean {
  const reserved = ['admin', 'support', 'api', 'www', 'root', 'system'];
  const cleanUsername = username.toLowerCase();
  return !reserved.includes(cleanUsername);
}

/**
 * Generate handle claim hash
 */
export function generateHandleClaim(did: string, handle: string): string {
  const data = `${did}:${handle}`;
  const hash = sha256(new TextEncoder().encode(data));
  return Buffer.from(hash).toString('hex');
}