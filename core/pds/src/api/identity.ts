/**
 * Identity API routes — Ed25519 DID identity for the minimal PDS server.
 *
 * Register is itself authenticated: you must SIGN with the secret key
 * matching the public key you register. This prevents the old attack where
 * anyone could register any (did, publicKey) pair they liked.
 *
 * Token issuance is CLIENT-side: the caller signs "<did>|<timestamp>" with
 * its own secret key (createAuthToken in ./auth) and presents the Bearer
 * token to authenticated endpoints. The server never holds secret keys.
 *
 * Challenge flow (proof of key control):
 *   1. GET  /api/identity/challenge?did=did:plc:xyz  -> { challenge, expiresIn }
 *   2. Sign the challenge string with your Ed25519 secret key.
 *   3. POST /api/identity/verify { did, challenge, signatureHex }
 *      -> { ok: true, did, handle }
 */

import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import nacl from 'tweetnacl';
import { UserRepository } from '../models/user.js';
import { DatabaseConnection } from '../database/connection.js';

export function createIdentityRouter(db: DatabaseConnection): Router {
  const router = Router();
  const userRepo = new UserRepository(db);

  // pending challenges: did -> { challenge, expiresAt }
  const challenges = new Map<string, { challenge: string; expiresAt: number }>();
  const CHALLENGE_TTL_MS = 5 * 60 * 1000;

  function sweepChallenges() {
    const now = Date.now();
    for (const [did, c] of challenges) {
      if (c.expiresAt < now) challenges.delete(did);
    }
  }

  function isValidDid(did: unknown): did is string {
    return typeof did === 'string' && /^did:plc:[a-zA-Z0-9+/_=.-]{1,120}$/.test(did);
  }

  function isValidEd25519PubHex(pub: unknown): pub is string {
    return typeof pub === 'string' && /^[0-9a-fA-F]{64}$/.test(pub);
  }

  function isValidSigHex(sig: unknown): sig is string {
    return typeof sig === 'string' && /^[0-9a-fA-F]{128}$/.test(sig);
  }

  /**
   * Issue a fresh registration/login challenge for a DID.
   * GET /api/identity/challenge?did=did:plc:xyz
   */
  router.get('/challenge', (req: Request, res: Response) => {
    const did = req.query.did;
    if (!isValidDid(did)) {
      res.status(400).json({ error: 'Invalid DID format (expected did:plc:<id>)' });
      return;
    }

    sweepChallenges();
    const challenge = randomBytes(16).toString('hex'); // 128-bit nonce
    challenges.set(did, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });

    res.json({ challenge, expiresIn: CHALLENGE_TTL_MS });
  });

  /**
   * Register a new identity. Body must include a signature of
   * "<did>|<publicKeyHex-lowercase>|register" made with the corresponding
   * Ed25519 secret key — proving control of the key pair.
   *
   * POST /api/identity/register
   * { did, handle, publicKey, signatureHex }
   */
  router.post('/register', (req: Request, res: Response) => {
    const { did, handle, publicKey, signatureHex } = req.body ?? {};

    if (!isValidDid(did)) {
      res.status(400).json({ error: 'Invalid DID format (expected did:plc:<id>)' });
      return;
    }
    if (typeof handle !== 'string' || !/^[a-zA-Z0-9._-]{1,64}$/.test(handle)) {
      res.status(400).json({ error: 'Invalid handle (1-64 chars: letters, digits, . _ -)' });
      return;
    }
    if (!isValidEd25519PubHex(publicKey)) {
      res.status(400).json({ error: 'publicKey must be a 32-byte hex string' });
      return;
    }
    if (typeof signatureHex !== 'string' || signatureHex.length === 0) {
      res.status(401).json({ error: 'Ownership proof required: sign "<did>|<publicKeyHex>|register" with the matching Ed25519 secret key' });
      return;
    }
    if (!isValidSigHex(signatureHex)) {
      res.status(400).json({ error: 'signatureHex must be a 64-byte hex Ed25519 signature' });
      return;
    }

    // Uniqueness constraints
    if (userRepo.findByDID(did)) {
      res.status(409).json({ error: 'DID already registered' });
      return;
    }
    if (userRepo.findByHandle(handle)) {
      res.status(409).json({ error: 'Handle already taken' });
      return;
    }
    if (userRepo.findByPublicKey(publicKey.toLowerCase())) {
      res.status(409).json({ error: 'Public key already registered to another DID' });
      return;
    }

    // Ownership proof: sign("<did>|<publicKey>|register")
    const message = new TextEncoder().encode(`${did}|${publicKey.toLowerCase()}|register`);
    const ok = nacl.sign.detached.verify(
      message,
      new Uint8Array(Buffer.from(signatureHex, 'hex')),
      new Uint8Array(Buffer.from(publicKey, 'hex'))
    );
    if (!ok) {
      res.status(401).json({ error: 'Signature does not prove control of publicKey' });
      return;
    }

    const user = userRepo.create({
      did,
      handle,
      publicKey: publicKey.toLowerCase(),
    });

    res.status(201).json({
      did: user.did,
      handle: user.handle,
      createdAt: user.createdAt,
    });
  });

  /**
   * Login: prove control of a registered DID by signing a fresh challenge.
   * The token used on subsequent requests is created CLIENT-side via
   * createAuthToken(did, secretKeyHex) — the server never sees secret keys.
   *
   * POST /api/identity/verify
   * { did, challenge, signatureHex }
   * -> { ok: true, did, handle }
   */
  router.post('/verify', (req: Request, res: Response) => {
    const { did, challenge, signatureHex } = req.body ?? {};

    if (!isValidDid(did) || typeof challenge !== 'string' || !isValidSigHex(signatureHex)) {
      res.status(400).json({ error: 'did (did:plc:...), challenge and signatureHex (128 hex) are required' });
      return;
    }

    const user = userRepo.findByDID(did);
    if (!user) {
      res.status(404).json({ error: 'DID not registered' });
      return;
    }

    const pending = challenges.get(did);
    if (!pending || pending.challenge !== challenge || pending.expiresAt < Date.now()) {
      res.status(401).json({ error: 'Challenge invalid or expired' });
      return;
    }
    challenges.delete(did); // single use

    // signature over the raw challenge string
    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(challenge),
      new Uint8Array(Buffer.from(signatureHex, 'hex')),
      new Uint8Array(Buffer.from(user.publicKey, 'hex'))
    );
    if (!ok) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    res.json({ ok: true, did: user.did, handle: user.handle });
  });

  /**
   * Whoami: validates a Bearer token and returns the authenticated identity.
   * GET /api/identity/whoami  (Authorization: Bearer <token>)
   */
  router.get('/whoami', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Bearer token required' });
      return;
    }

    // Reuse the shared token machinery via a tiny inline check
    const { parseAuthToken } = await import('./auth.js');
    const { verifyAuthToken } = await import('./auth.js');
    const token = parseAuthToken(authHeader);
    if (!token) {
      res.status(401).json({ error: 'Malformed token' });
      return;
    }
    const user = userRepo.findByDID(token.did);
    if (!user) {
      res.status(401).json({ error: 'Unknown DID' });
      return;
    }
    const ok = await verifyAuthToken(token, user.publicKey);
    if (!ok) {
      res.status(401).json({ error: 'Invalid or replayed token' });
      return;
    }
    res.json({ did: user.did, handle: user.handle });
  });

  return router;
}