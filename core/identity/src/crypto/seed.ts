import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

/**
 * Generate a 24-word BIP39 seed phrase
 */
export function generateSeedPhrase(): string[] {
  const mnemonic = generateMnemonic(wordlist, 256); // 256 bits = 24 words
  return mnemonic.split(' ');
}

/**
 * Validate a seed phrase
 */
export function validateSeedPhrase(words: string[]): boolean {
  try {
    const mnemonic = words.join(' ');
    // This will throw if invalid
    mnemonicToSeedSync(mnemonic, wordlist);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate checksum for seed phrase verification
 */
export function calculateChecksum(words: string[]): string {
  const mnemonic = words.join(' ');
  const seed = mnemonicToSeedSync(mnemonic, wordlist);
  return bytesToHex(sha256(seed)).substring(0, 8);
}

/**
 * Derive key from seed phrase using BIP39
 */
export function deriveKeyFromSeed(words: string[], path: string = ''): Uint8Array {
  const mnemonic = words.join(' ');
  const seed = mnemonicToSeedSync(mnemonic, wordlist);

  if (path === '') {
    return seed;
  }

  // Simple path-based derivation (for production, use HD key derivation)
  // This is a simplified version - use HD keys for full implementation
  const pathBytes = new TextEncoder().encode(path);
  const combined = new Uint8Array(seed.length + pathBytes.length);
  combined.set(seed);
  combined.set(pathBytes, seed.length);
  return sha256(combined);
}

/**
 * Encrypt data using password-derived key
 */
export function encrypt(data: Uint8Array, password: string): { encrypted: Uint8Array; nonce: Uint8Array } {
  // Derive key from password
  const key = sha256(new TextEncoder().encode(password));
  const nonce = crypto.getRandomValues(new Uint8Array(24)); // XChaCha20 nonce
  const cipher = xchacha20poly1305(key, nonce);
  const encrypted = cipher.encrypt(data);
  return { encrypted, nonce };
}

/**
 * Decrypt data using password-derived key
 */
export function decrypt(encrypted: Uint8Array, nonce: Uint8Array, password: string): Uint8Array {
  const key = sha256(new TextEncoder().encode(password));
  const cipher = xchacha20poly1305(key, nonce);
  return cipher.decrypt(encrypted);
}