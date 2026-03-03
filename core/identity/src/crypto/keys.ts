/**
 * Cryptographic key generation and operations using Ed25519
 */

import * as nacl from 'tweetnacl';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { hdKeyFromSeed } from 'bip32';

/**
 * Generate a 24-word BIP39 mnemonic seed phrase
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
    const phrase = words.join(' ');
    const entropy = mnemonicToSeedSync(phrase);
    return entropy.length > 0;
  } catch {
    return false;
  }
}

/**
 * Generate checksum for seed phrase verification
 */
export function generateChecksum(words: string[]): string {
  const phrase = words.join(' ');
  const seed = mnemonicToSeedSync(phrase);
  return Buffer.from(sha256(seed)).toString('hex').slice(0, 8);
}

/**
 * Derive Ed25519 key pair from seed phrase using BIP32
 */
export function deriveKeyPairFromSeed(
  words: string[],
  accountIndex: number = 0,
  keyIndex: number = 0
): { publicKey: Uint8Array; secretKey: Uint8Array } {
  const phrase = words.join(' ');
  const seed = mnemonicToSeedSync(phrase);

  // Use BIP32 derivation
  const root = hdKeyFromSeed(seed);

  // Derivation path: m/44'/393'/account'/0/key
  // 393' is the SLIP-0043 index for AT Protocol (similar to DID:PLC)
  const path = `m/44'/393'/${accountIndex}'/0/${keyIndex}`;
  const child = root.derivePath(path);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  // Derive Ed25519 key pair from the private key
  const keyPair = nacl.sign.keyPair.fromSeed(
    Buffer.from(child.privateKey).slice(0, 32)
  );

  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Generate a random Ed25519 key pair
 */
export function generateKeyPair(): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  return nacl.sign.keyPair();
}

/**
 * Sign a message with a secret key
 */
export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

/**
 * Verify a signature
 */
export function verify(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/**
 * Encode key to multibase format (base58btc)
 */
export function encodeKeyToMultibase(key: Uint8Array, prefix: number = 0xe7): string {
  // Multibase header: 0xe7 for base58btc Ed25519 public key
  const header = new Uint8Array([prefix]);
  const combined = new Uint8Array(header.length + key.length);
  combined.set(header);
  combined.set(key, header.length);

  // Simple base58 encoding (for production, use proper library)
  return base58Encode(combined);
}

/**
 * Decode multibase key
 */
export function decodeMultibaseKey(encoded: string): Uint8Array {
  const decoded = base58Decode(encoded);
  // Remove multibase header byte
  return decoded.slice(1);
}

/**
 * Simple base58 encode (for demo - use bs58 in production)
 */
function base58Encode(data: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = [0];
  for (let i = 0; i < data.length; i++) {
    let carry = data[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = '';
  for (let i = 0; i < data.length && data[i] === 0; i++) {
    result += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += alphabet[digits[i]];
  }
  return result;
}

/**
 * Simple base58 decode
 */
function base58Decode(encoded: string): Uint8Array {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const alphabetMap: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i++) {
    alphabetMap[alphabet[i]] = i;
  }

  const result = [0];
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const value = alphabetMap[char];
    if (value === undefined) {
      throw new Error('Invalid base58 character');
    }

    let carry = value;
    for (let j = 0; j < result.length; j++) {
      carry += result[j] * 58;
      result[j] = carry & 0xff;
      carry = carry >> 8;
    }
    while (carry) {
      result.push(carry & 0xff);
      carry = carry >> 8;
    }
  }

  // Remove leading zeros
  let i = 0;
  while (i < encoded.length && encoded[i] === '1') {
    i++;
  }

  const buffer = new Uint8Array(result.length);
  for (let j = 0; j < result.length; j++) {
    buffer[result.length - 1 - j] = result[j];
  }

  return buffer.slice(i);
}

/**
 * Generate a unique verification method ID
 */
export function generateVerificationMethodId(did: string, keyNumber: number = 0): string {
  return `${did}#key-${keyNumber}`;
}