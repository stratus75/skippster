import { HandleDomain, Handle, HandleReservation } from './types';
import { Ed25519KeyPair } from '../crypto/ed25519';
import { signMessage, bytesToHex } from '../crypto/ed25519';
import { textEncoder } from '../crypto/utils';

/**
 * Handle manager for Skippster handles
 */

export class HandleManager {
  private static readonly MIN_HANDLE_LENGTH = 3;
  private static readonly MAX_HANDLE_LENGTH = 63;
  private static readonly RESERVED_HANDLES = ['www', 'admin', 'api', 'dns', 'ns1', 'ns2', 'mail', 'help', 'support'];

  /**
   * Validate a handle value
   */
  static validateHandle(value: string): boolean {
    // Check length
    if (value.length < this.MIN_HANDLE_LENGTH || value.length > this.MAX_HANDLE_LENGTH) {
      return false;
    }

    // Check for reserved handles
    if (this.RESERVED_HANDLES.includes(value.toLowerCase())) {
      return false;
    }

    // Check characters (alphanumeric, hyphens)
    const validPattern = /^[a-z0-9-]+$/i;
    if (!validPattern.test(value)) {
      return false;
    }

    // Cannot start or end with hyphen
    if (value.startsWith('-') || value.endsWith('-')) {
      return false;
    }

    // No consecutive hyphens
    if (value.includes('--')) {
      return false;
    }

    return true;
  }

  /**
   * Normalize handle to lowercase
   */
  static normalizeHandle(value: string): string {
    return value.toLowerCase().trim();
  }

  /**
   * Create a full handle string from local part
   */
  static createFullHandle(localPart: string, domain: HandleDomain = HandleDomain.SKIPPSTER_SOCIAL): string {
    const normalized = this.normalizeHandle(localPart);
    return `${normalized}.${domain}`;
  }

  /**
   * Parse a full handle into local part and domain
   */
  static parseHandle(fullHandle: string): { local: string; domain: string } | null {
    const parts = fullHandle.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [local, domain] = parts;
    if (!this.validateHandle(local)) {
      return null;
    }

    return { local, domain };
  }

  /**
   * Generate a suggested handle from DID
   */
  static generateHandleSuggestion(did: string): string {
    // Extract hash part from did:plc:abc123...
    const hashPart = did.split(':')[2] || '';
    const shortHash = hashPart.substring(0, 8);
    return `user${shortHash}`;
  }

  /**
   * Create a handle reservation with signature
   */
  static reserveHandle(
    handle: string,
    did: string,
    keyPair: Ed25519KeyPair,
    expiresAt?: Date
  ): HandleReservation {
    const now = new Date();
    const message = this.createReservationMessage(handle, did, now, expiresAt);
    const signature = bytesToHex(signMessage(message, keyPair.secretKey));

    return {
      handle,
      did,
      reservedAt: now,
      expiresAt,
      signature,
    };
  }

  /**
   * Verify handle reservation signature
   */
  static verifyReservation(
    reservation: HandleReservation,
    publicKey: Uint8Array
  ): boolean {
    const message = this.createReservationMessage(
      reservation.handle,
      reservation.did,
      reservation.reservedAt,
      reservation.expiresAt
    );

    if (!reservation.signature) {
      return false;
    }

    try {
      const { verifySignature } = require('../crypto/ed25519');
      return verifySignature(message, hexToBytes(reservation.signature), publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Check if reservation is expired
   */
  static isExpired(reservation: HandleReservation): boolean {
    if (!reservation.expiresAt) {
      return false;
    }
    return new Date() > reservation.expiresAt;
  }

  /**
   * Create message for signing handle reservation
   */
  private static createReservationMessage(
    handle: string,
    did: string,
    reservedAt: Date,
    expiresAt?: Date
  ): Uint8Array {
    const parts = [
      'skippster:handle-reservation',
      `handle:${handle}`,
      `did:${did}`,
      `reservedAt:${reservedAt.toISOString()}`,
    ];

    if (expiresAt) {
      parts.push(`expiresAt:${expiresAt.toISOString()}`);
    }

    return textEncoder.encode(parts.join('\n'));
  }
}

/**
 * Helper text encoder
 */
export const textEncoder = new TextEncoder();

/**
 * Helper for hex to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}