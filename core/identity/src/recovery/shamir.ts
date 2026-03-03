/**
 * Shamir's Secret Sharing implementation for social recovery
 * Simplified implementation for MVP
 */

import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Share data structure
 */
export interface Share {
  index: number;
  value: Uint8Array;
}

/**
 * Shamir Secret Sharing - Split secret into shares
 *
 * @param secret The secret to split (as bytes)
 * @param threshold Number of shares needed to reconstruct
 * @param totalShares Total number of shares to create
 * @returns Array of shares
 */
export function splitSecret(
  secret: Uint8Array,
  threshold: number,
  totalShares: number
): Share[] {
  if (threshold > totalShares) {
    throw new Error('Threshold cannot exceed total shares');
  }
  if (threshold < 1) {
    throw new Error('Threshold must be at least 1');
  }
  if (totalShares < 1) {
    throw new Error('Total shares must be at least 1');
  }

  // For MVP, use a simplified approach
  // In production, use proper polynomial interpolation over finite field

  const shares: Share[] = [];

  // Generate random coefficients for polynomial
  const coefficients: Uint8Array[] = [];
  coefficients.push(secret); // Constant term is the secret
  for (let i = 1; i < threshold; i++) {
    coefficients.push(randomBytes(secret.length));
  }

  // Evaluate polynomial at different points
  for (let x = 1; x <= totalShares; x++) {
    const value = evaluatePolynomial(coefficients, x);
    shares.push({ index: x, value });
  }

  return shares;
}

/**
 * Reconstruct secret from shares
 *
 * @param shares Array of shares (at least threshold)
 * @param threshold Expected threshold
 * @returns Reconstructed secret
 */
export function reconstructSecret(shares: Share[], threshold: number): Uint8Array {
  if (shares.length < threshold) {
    throw new Error('Not enough shares to reconstruct secret');
  }

  // Use Lagrange interpolation to reconstruct
  const secretLength = shares[0].value.length;
  const result = new Uint8Array(secretLength);

  for (let i = 0; i < secretLength; i++) {
    let sum = 0n;
    for (let j = 0; j < threshold; j++) {
      let numerator = 1n;
      let denominator = 1n;

      for (let k = 0; k < threshold; k++) {
        if (k !== j) {
          numerator *= BigInt(0 - shares[k].index);
          denominator *= BigInt(shares[j].index - shares[k].index);
        }
      }

      const shareValue = BigInt(shares[j].value[i]);
      sum += shareValue * numerator / denominator;
    }

    result[i] = Number(sum % 256n);
  }

  return result;
}

/**
 * Evaluate polynomial at x using coefficients
 */
function evaluatePolynomial(coefficients: Uint8Array[], x: number): Uint8Array {
  const length = coefficients[0].length;
  const result = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    let value = 0n;
    let xPower = 1n;

    for (const coeff of coefficients) {
      const coeffValue = BigInt(coeff[i]);
      value += coeffValue * xPower;
      xPower *= BigInt(x);
    }

    result[i] = Number(value % 256n);
  }

  return result;
}

/**
 * Encode share to hex string for storage/transport
 */
export function encodeShare(share: Share): string {
  const indexBytes = new Uint8Array([share.index]);
  const combined = new Uint8Array(1 + share.value.length);
  combined.set(indexBytes, 0);
  combined.set(share.value, 1);
  return bytesToHex(combined);
}

/**
 * Decode share from hex string
 */
export function decodeShare(encoded: string): Share {
  const bytes = hexToBytes(encoded);
  if (bytes.length === 0) {
    throw new Error('Invalid share encoding');
  }

  const index = bytes[0];
  const value = bytes.slice(1);

  return { index, value };
}

/**
 * Encrypt share for holder
 */
export function encryptShare(share: Share, holderPublicKey: Uint8Array): string {
  // For MVP, simple XOR encryption with shared secret
  // In production, use proper ECDH + encryption
  const sharedSecret = sha256(holderPublicKey);
  const encrypted = new Uint8Array(share.value.length);

  for (let i = 0; i < share.value.length; i++) {
    encrypted[i] = share.value[i] ^ sharedSecret[i % sharedSecret.length];
  }

  const combined = new Uint8Array(1 + encrypted.length);
  combined[0] = share.index;
  combined.set(encrypted, 1);

  return bytesToHex(combined);
}

/**
 * Decrypt share using holder's secret key
 */
export function decryptShare(encryptedShare: string, holderSecretKey: Uint8Array): Share {
  const bytes = hexToBytes(encryptedShare);
  const index = bytes[0];
  const encrypted = bytes.slice(1);

  const publicKey = derivePublicKeyFromSecret(holderSecretKey);
  const sharedSecret = sha256(publicKey);
  const decrypted = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ sharedSecret[i % sharedSecret.length];
  }

  return { index, value: decrypted };
}

/**
 * Simple public key derivation from secret
 */
function derivePublicKeyFromSecret(secretKey: Uint8Array): Uint8Array {
  return sha256(secretKey);
}