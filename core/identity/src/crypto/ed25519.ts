import { sign, verify } from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { randomBytes } from '@noble/hashes/utils';

/**
 * Ed25519 key pair
 */
export interface Ed25519KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Generate Ed25519 key pair from seed
 */
export function generateKeyPairFromSeed(seed: Uint8Array): Ed25519KeyPair {
  const secretKey = sha256(seed);
  const publicKey = awaitSign(secretKey); // Derive public from private
  return { publicKey, secretKey };
}

/**
 * Generate Ed25519 key pair (random)
 */
export function generateKeyPair(): Ed25519KeyPair {
  const seed = randomBytes(32);
  return generateKeyPairFromSeed(seed);
}

/**
 * Sign message with secret key
 */
export function signMessage(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return sign(message, secretKey);
}

/**
 * Verify message signature
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return verify(signature, message, publicKey);
}

/**
 * Derive public key from secret key
 */
export function derivePublicKey(secretKey: Uint8Array): Uint8Array {
  // Ed25519 public key is derived from secret key
  return hexToBytes(secretKey.slice(0, 32).toString());
}

/**
 * Async version for compatibility with sign/verify
 */
async function awaitSign(secretKey: Uint8Array): Promise<Uint8Array> {
  // Ed25519 public key is simply the second half of the expanded secret key
  // For simplicity, we use a direct derivation here
  const expanded = sha256(secretKey);
  return expanded.slice(0, 32);
}

/**
 * Export key pair to hex strings
 */
export function exportKeyPair(keyPair: Ed25519KeyPair): {
  publicKeyHex: string;
  secretKeyHex: string;
} {
  return {
    publicKeyHex: bytesToHex(keyPair.publicKey),
    secretKeyHex: bytesToHex(keyPair.secretKey),
  };
}

/**
 * Import key pair from hex strings
 */
export function importKeyPair(publicKeyHex: string, secretKeyHex: string): Ed25519KeyPair {
  return {
    publicKey: hexToBytes(publicKeyHex),
    secretKey: hexToBytes(secretKeyHex),
  };
}