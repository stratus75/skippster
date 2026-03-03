/**
 * Encrypted storage for identity data
 * Stores data in localStorage (browser) or file system (Node.js)
 */

import { encrypt, decrypt } from '../crypto/seed';
import { StoredIdentity, StoredHandleReservation, EncryptedData } from './types';

export class EncryptedStore {
  private static readonly IDENTITY_KEY = 'skippster:identity';
  private static readonly HANDLES_KEY = 'skippster:handles';
  private static readonly VERSION = 1;

  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  /**
   * Store identity data
   */
  async storeIdentity(identity: StoredIdentity): Promise<void> {
    const data = JSON.stringify(identity);
    const { encrypted, nonce } = encrypt(new TextEncoder().encode(data), this.password);

    const encryptedData: EncryptedData = {
      data: btoa(String.fromCharCode(...encrypted)),
      nonce: btoa(String.fromCharCode(...nonce)),
      version: EncryptedStore.VERSION,
    };

    this.setItem(EncryptedStore.IDENTITY_KEY, JSON.stringify(encryptedData));
  }

  /**
   * Retrieve identity data
   */
  async retrieveIdentity(): Promise<StoredIdentity | null> {
    const encryptedJson = this.getItem(EncryptedStore.IDENTITY_KEY);
    if (!encryptedJson) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedJson);

      const encrypted = Uint8Array.from(atob(encryptedData.data), (c) => c.charCodeAt(0));
      const nonce = Uint8Array.from(atob(encryptedData.nonce), (c) => c.charCodeAt(0));

      const decrypted = decrypt(encrypted, nonce, this.password);
      const data = new TextDecoder().decode(decrypted);

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to decrypt identity:', error);
      return null;
    }
  }

  /**
   * Store handle reservation
   */
  async storeHandleReservation(reservation: StoredHandleReservation): Promise<void> {
    const reservations = this.getHandleReservations();
    reservations.push(reservation);
    this.setItem(EncryptedStore.HANDLES_KEY, JSON.stringify(reservations));
  }

  /**
   * Get all handle reservations
   */
  getHandleReservations(): StoredHandleReservation[] {
    const json = this.getItem(EncryptedStore.HANDLES_KEY);
    if (!json) {
      return [];
    }
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  /**
   * Get handle reservation by handle
   */
  getHandleReservation(handle: string): StoredHandleReservation | null {
    const reservations = this.getHandleReservations();
    return reservations.find((r) => r.handle === handle) || null;
  }

  /**
   * Delete identity data
   */
  async deleteIdentity(): Promise<void> {
    this.removeItem(EncryptedStore.IDENTITY_KEY);
  }

  /**
   * Check if identity exists
   */
  hasIdentity(): boolean {
    return this.getItem(EncryptedStore.IDENTITY_KEY) !== null;
  }

  /**
   * Export identity data for backup
   */
  async exportIdentity(): Promise<string> {
    const identity = await this.retrieveIdentity();
    if (!identity) {
      throw new Error('No identity to export');
    }
    return JSON.stringify(identity);
  }

  /**
   * Import identity data from backup
   */
  async importIdentity(data: string): Promise<void> {
    const identity = JSON.parse(data) as StoredIdentity;
    await this.storeIdentity(identity);
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    this.removeItem(EncryptedStore.IDENTITY_KEY);
    this.removeItem(EncryptedStore.HANDLES_KEY);
  }

  // Private helper methods

  private setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      // Node.js fallback - would use fs in production
      console.warn('File storage not implemented, using memory');
      (this as any)[key] = value;
    }
  }

  private getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    } else {
      // Node.js fallback
      return (this as any)[key] || null;
    }
  }

  private removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      delete (this as any)[key];
    }
  }
}