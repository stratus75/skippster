/**
 * Utility functions for crypto operations
 */

import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';

/**
 * Text encoder
 */
export const textEncoder = new TextEncoder();

/**
 * Text decoder
 */
export const textDecoder = new TextDecoder();

/**
 * Convert string to bytes
 */
export function stringToBytes(str: string): Uint8Array {
  return textEncoder.encode(str);
}

/**
 * Convert bytes to string
 */
export function bytesToString(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

/**
 * Generate random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return randomBytes(length);
}

/**
 * Generate random ID
 */
export function generateId(): string {
  const bytes = generateRandomBytes(16);
  return bytesToHex(bytes);
}

/**
 * Concatenate byte arrays
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compare byte arrays for equality
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}