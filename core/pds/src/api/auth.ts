/**
 * DID-based Authentication Utilities (Ed25519)
 * Verifies authentication tokens for the PDS API.
 *
 * Token format: "Bearer <base64url("<did>|<timestamp>|<sigHex>")>"
 *   - signature = Ed25519 sign of the UTF-8 bytes of "<did>|<timestamp>"
 *     (the SAME string the verifier reconstructs), made with the user's
 *     Ed25519 secret key.
 *   - The DID itself may contain ':' (did:plc:abc123), so the payload uses
 *     '|' as its field separator. The old ':'-split format was actually
 *     broken: a real DID produced 5 ':'-separated fields and the parser
 *     demanded exactly 3, so every real DID token failed to parse.
 *
 * Security notes:
 *   - REAL asymmetric verification (tweetnacl.sign.detached.verify).
 *     Replaces the old broken scheme that "verified"
 *     sha256(did:timestamp + publicKey) — forgeable by anyone since the
 *     public key is public.
 *   - Timestamp window (default 5 min) prevents trivial replay.
 *   - Nonce replay cache: a given (did, signature) can only be accepted
 *     once within the window, so an intercepted token can't be replayed.
 */

import { timingSafeEqual } from 'crypto';
import nacl from 'tweetnacl';

export interface AuthToken {
  did: string;
  timestamp: number;
  /** hex-encoded 64-byte Ed25519 detached signature */
  signature: string;
}

export interface AuthenticatedUser {
  did: string;
  handle: string;
}

/** Canonical signing message — verifier and signer MUST agree on this. */
export function authMessage(did: string, timestamp: number): Uint8Array {
  return new TextEncoder().encode(`${did}|${timestamp}`);
}

/** Base64url (no padding) — safe in headers regardless of charset handling. */
function b64urlEncode(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf-8');
}

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

/**
 * Parse authentication token from Authorization header.
 * Returns null for any malformed input (never throws).
 */
export function parseAuthToken(authHeader: string | undefined): AuthToken | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  let decoded: string;
  try {
    decoded = b64urlDecode(parts[1]);
  } catch {
    return null;
  }

  const sep = decoded.indexOf('|');
  if (sep <= 0) return null;

  const did = decoded.slice(0, sep);
  const rest = decoded.slice(sep + 1);
  const sep2 = rest.lastIndexOf('|');
  if (sep2 <= 0) return null;

  const timestampStr = rest.slice(0, sep2);
  const signature = rest.slice(sep2 + 1);

  const timestamp = Number.parseInt(timestampStr, 10);
  if (!Number.isFinite(timestamp)) return null;

  if (!did.startsWith('did:')) return null;
  if (!/^[0-9a-f]{128}$/.test(signature)) return null; // Ed25519 sig = 64 bytes hex

  return { did, timestamp, signature };
}

/**
 * Verify authentication token signature with REAL Ed25519.
 * publicKeyHex = 32-byte Ed25519 public key of the DID owner (hex).
 * The key comes from the server's user registry — it is NOT trusted from
 * the request itself.
 */
export async function verifyAuthToken(
  token: AuthToken,
  publicKeyHex: string
): Promise<boolean> {
  try {
    if (!token.did.startsWith('did:plc:')) return false;
    if (!isTokenTimestampValid(token.timestamp)) return false;

    // hex -> bytes; also normalizes case
    const sig = Buffer.from(token.signature, 'hex');
    if (sig.length !== nacl.sign.signatureLength) return false;

    const pub = hexToBytes32(publicKeyHex);
    if (!pub) return false;

    const ok = nacl.sign.detached.verify(
      authMessage(token.did, token.timestamp),
      new Uint8Array(sig),
      pub
    );
    if (!ok) return false;

    // Anti-replay: remember (did|signature) until the token's window expires.
    return !replayCache.checkAndAdd(token.did, token.signature, token.timestamp);
  } catch {
    return false;
  }
}

function hexToBytes32(hex: string): Uint8Array | null {
  if (typeof hex !== 'string') return null;
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{64}$/.test(clean)) return null; // must be 32 bytes
  return new Uint8Array(Buffer.from(clean, 'hex'));
}

/**
 * Replay cache for token signatures.
 * Keyed by did|sigHex; entries expire when their token's 5-min window ends.
 */
class ReplayCache {
  private entries = new Map<string, number>();
  private lastSweep = 0;

  checkAndAdd(did: string, sigHex: string, tokenTimestamp: number): boolean {
    const key = `${did}|${sigHex.toLowerCase()}`;
    const now = Date.now();
    const expiresAt = tokenTimestamp + MAX_TIMESTAMP_DRIFT_MS;

    if (this.entries.has(key)) {
      return true; // already used -> REPLAY
    }
    this.entries.set(key, expiresAt);

    // cheap periodic sweep
    if (now - this.lastSweep > 30_000) {
      this.lastSweep = now;
      this.sweep(now);
    }
    return false;
  }

  clear(): void {
    this.entries.clear();
  }

  private sweep(now: number): void {
    for (const [k, exp] of this.entries) {
      if (exp < now) this.entries.delete(k);
    }
  }
}

const replayCache = new ReplayCache();

/** Test-only: clear replay state between test runs. */
export function __clearReplayCacheForTests(): void {
  replayCache.clear();
}

/**
 * Check if token timestamp is within acceptable time window.
 * Prevents replay attacks (together with the signature replay cache).
 */
export function isTokenTimestampValid(
  timestamp: number,
  maxAgeMs: number = MAX_TIMESTAMP_DRIFT_MS
): boolean {
  const age = Math.abs(Date.now() - timestamp);
  return age <= maxAgeMs;
}

/**
 * Extract DID from Authorization header without full verification.
 * Use only for routes that don't require authentication but need user context.
 */
export function extractDidFromHeader(authHeader: string | undefined): string | null {
  const token = parseAuthToken(authHeader);
  return token?.did || null;
}

/**
 * Sign a DID authorization token (client side).
 * did and secretKeyHex must belong to the same identity.
 * Returns the base64url value to place after "Bearer ".
 */
export function createAuthToken(did: string, secretKeyHex: string): string {
  const timestamp = Date.now();
  const message = authMessage(did, timestamp);

  const clean = secretKeyHex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{128}$/.test(clean)) {
    throw new Error('Ed25519 secret key must be 64 bytes hex (128 chars)');
  }
  const secret = new Uint8Array(Buffer.from(clean, 'hex'));

  const sig = nacl.sign.detached(message, secret);
  const payload = `${did}|${timestamp}|${Buffer.from(sig).toString('hex')}`;
  return b64urlEncode(payload);
}