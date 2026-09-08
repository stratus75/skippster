/**
 * Client-side Ed25519 identity + DID auth token signing.
 *
 * The browser NEVER sends secret keys to the server. Keys are generated
 * locally, persisted in localStorage, and used only to sign:
 *   - the auth message "<did>|<timestamp>" for every authenticated request
 *   - registration ownership proof "<did>|<publicKeyHex>|register"
 *
 * Server side source of truth is core/pds/src/api/auth.ts — the message
 * format MUST stay in sync (see authMessage there).
 */

import nacl from 'tweetnacl';

const STORAGE_KEY = 'skippster.identity.v1';

export interface LocalIdentity {
  did: string;
  handle: string;
  /** 32-byte Ed25519 public key, hex */
  publicKeyHex: string;
  /** 64-byte Ed25519 secret key (seed+pub), hex — NEVER sent to the server */
  secretKeyHex: string;
}

function bytesToHex(b: Uint8Array): string {
  return Buffer.from(b).toString('hex');
}

export function generateIdentity(handle: string): LocalIdentity {
  const kp = nacl.sign.keyPair();
  const did = `did:plc:${bytesToHex(kp.publicKey).slice(0, 24)}`;
  return {
    did,
    handle,
    publicKeyHex: bytesToHex(kp.publicKey),
    secretKeyHex: bytesToHex(kp.secretKey),
  };
}

export function loadIdentity(): LocalIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as LocalIdentity;
    if (!id?.did?.startsWith('did:plc:') || !/^[0-9a-f]{128}$/.test(id.secretKeyHex)) return null;
    return id;
  } catch {
    return null;
  }
}

export function saveIdentity(id: LocalIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Canonical message for request auth. MUST match server's authMessage(). */
export function authMessage(did: string, timestamp: number): Uint8Array {
  return new TextEncoder().encode(`${did}|${timestamp}`);
}

/**
 * Build the Bearer token value for an authenticated request:
 * base64url("<did>|<timestamp>|<sigHex>")
 */
export function createAuthToken(id: LocalIdentity): string {
  const timestamp = Date.now();
  const sig = nacl.sign.detached(authMessage(id.did, timestamp), hexToSecret(id.secretKeyHex));
  const payload = `${id.did}|${timestamp}|${bytesToHex(sig)}`;
  return b64urlEncode(payload);
}

/** Auth headers object to spread into fetch/axios calls. */
export function authHeaders(id: LocalIdentity | null): Record<string, string> {
  if (!id) return {};
  return { Authorization: `Bearer ${createAuthToken(id)}` };
}

/** Registration ownership proof over "<did>|<publicKeyHex>|register". */
export function signRegistration(id: LocalIdentity): string {
  const msg = new TextEncoder().encode(`${id.did}|${id.publicKeyHex.toLowerCase()}|register`);
  return bytesToHex(nacl.sign.detached(msg, hexToSecret(id.secretKeyHex)));
}

/** Login proof over a server challenge string. */
export function signChallenge(id: LocalIdentity, challenge: string): string {
  return bytesToHex(nacl.sign.detached(new TextEncoder().encode(challenge), hexToSecret(id.secretKeyHex)));
}

function hexToSecret(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{128}$/.test(clean)) {
    throw new Error('Ed25519 secret key must be 64 bytes hex (128 chars)');
  }
  return new Uint8Array(
    clean.match(/.{2}/g)!.map((h) => parseInt(h, 16))
  );
}

function b64urlEncode(input: string): string {
  // btoa-safe: payload is ASCII (hex + digits + did chars)
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}