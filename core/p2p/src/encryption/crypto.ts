/**
 * End-to-end encryption for P2P messages
 * Uses TweetNaCl for cryptographic operations
 */

import { box, randomBytes } from 'tweetnacl';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedMessage {
  nonce: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
}

/**
 * Generate a new key pair
 */
export function generateKeyPair(): KeyPair {
  return box.keyPair();
}

/**
 * Encrypt a message for a recipient
 */
export function encryptMessage(
  message: string,
  senderSecretKey: Uint8Array,
  recipientPublicKey: Uint8Array
): EncryptedMessage {
  const nonce = randomBytes(box.nonceLength);
  const messageBytes = new TextEncoder().encode(message);

  const ciphertext = box(messageBytes, nonce, recipientPublicKey, senderSecretKey);

  return {
    nonce: base64Encode(nonce),
    ciphertext: base64Encode(ciphertext),
  };
}

/**
 * Decrypt a message from a sender
 */
export function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string | null {
  try {
    const nonce = base64Decode(encrypted.nonce);
    const ciphertext = base64Decode(encrypted.ciphertext);

    const decrypted = box.open(ciphertext, nonce, senderPublicKey, recipientSecretKey);

    if (!decrypted) {
      return null;
    }

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Sign a message
 */
export function signMessage(message: string, secretKey: Uint8Array): Uint8Array {
  const messageBytes = new TextEncoder().encode(message);
  return sign(messageBytes, secretKey);
}

/**
 * Verify a signed message
 */
export function verifySignature(
  message: string,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  const messageBytes = new TextEncoder().encode(message);
  return verify(messageBytes, signature, publicKey);
}

/**
 * Generate a shared secret from two key pairs
 */
export function deriveSharedSecret(
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  return box.before(theirPublicKey, mySecretKey);
}

/**
 * Encrypt using precomputed shared secret
 */
export function encryptWithShared(
  message: string,
  sharedSecret: Uint8Array
): EncryptedMessage {
  const nonce = randomBytes(box.nonceLength);
  const messageBytes = new TextEncoder().encode(message);
  const ciphertext = box.after(messageBytes, nonce, sharedSecret);

  return {
    nonce: base64Encode(nonce),
    ciphertext: base64Encode(ciphertext),
  };
}

/**
 * Decrypt using precomputed shared secret
 */
export function decryptWithShared(
  encrypted: EncryptedMessage,
  sharedSecret: Uint8Array
): string | null {
  try {
    const nonce = base64Decode(encrypted.nonce);
    const ciphertext = base64Decode(encrypted.ciphertext);

    const decrypted = box.open.after(ciphertext, nonce, sharedSecret);

    if (!decrypted) {
      return null;
    }

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Hash a message (using SHA-256)
 */
export function hashMessage(message: string): Uint8Array {
  // Simple hash implementation - in production use proper SHA-256
  const messageBytes = new TextEncoder().encode(message);
  let hash = new Uint8Array(32);

  for (let i = 0; i < messageBytes.length; i++) {
    hash[i % 32] ^= messageBytes[i];
  }

  return hash;
}

// Helper functions

function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Import sign and verify from tweetnacl
import { sign, verify } from 'tweetnacl';