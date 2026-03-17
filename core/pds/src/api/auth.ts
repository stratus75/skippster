/**
 * DID-based Authentication Utilities
 * Verifies authentication tokens for PDS API
 *
 * Token format: "Bearer <base64(did:timestamp:signature)>"
 * For now, uses a simplified verification approach.
 * Full Ed25519 signature verification should be added when dependencies are ready.
 */

import { createHash, timingSafeEqual } from 'crypto';

export interface AuthToken {
  did: string;
  timestamp: number;
  signature: string;
}

export interface AuthenticatedUser {
  did: string;
  handle: string;
}

/**
 * Parse authentication token from Authorization header
 * Expected format: "Bearer <base64-encoded-token>"
 * Token payload: "<did>:<timestamp>:<signature>"
 */
export function parseAuthToken(authHeader: string | undefined): AuthToken | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  try {
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    const tokenParts = decoded.split(':');

    if (tokenParts.length !== 3) return null;

    const [did, timestampStr, signature] = tokenParts;
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) return null;

    return { did, timestamp, signature };
  } catch {
    return null;
  }
}

/**
 * Verify authentication token signature
 * Uses HMAC-SHA256 for initial implementation
 *
 * Note: For production, this should use Ed25519 signature verification
 * with the user's public key from the identity module.
 */
export async function verifyAuthToken(
  token: AuthToken,
  publicKeyHex: string
): Promise<boolean> {
  try {
    // Verify DID format
    if (!token.did.startsWith('did:plc:')) {
      return false;
    }

    // Check timestamp to prevent replay attacks
    if (!isTokenTimestampValid(token.timestamp)) {
      return false;
    }

    // For now, verify that the signature matches expected format
    // The signature should be: HMAC-SHA256(did:timestamp, publicKey)
    // This is a simplified approach - production should use Ed25519

    const message = `${token.did}:${token.timestamp}`;
    const expectedSignature = createHmacSignature(message, publicKeyHex);

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(token.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Create HMAC signature for authentication
 * This is used during development; production should use Ed25519
 */
function createHmacSignature(message: string, key: string): string {
  return createHash('sha256')
    .update(message + key)
    .digest('hex');
}

/**
 * Check if token timestamp is within acceptable time window
 * Prevents replay attacks
 */
export function isTokenTimestampValid(
  timestamp: number,
  maxAgeMs: number = 300000 // 5 minutes default
): boolean {
  const now = Date.now();
  const age = Math.abs(now - timestamp);
  return age <= maxAgeMs;
}

/**
 * Extract DID from Authorization header without full verification
 * Use only for routes that don't require authentication but need user context
 */
export function extractDidFromHeader(authHeader: string | undefined): string | null {
  const token = parseAuthToken(authHeader);
  return token?.did || null;
}

/**
 * Create a development token for testing
 * This should NOT be used in production
 */
export function createDevToken(did: string, publicKey: string): string {
  const timestamp = Date.now();
  const message = `${did}:${timestamp}`;
  const signature = createHmacSignature(message, publicKey);
  const token = `${did}:${timestamp}:${signature}`;
  return Buffer.from(token).toString('base64');
}