/**
 * Main Identity class - combines all identity functionality
 */

import {
  generateSeedPhrase,
  validateSeedPhrase,
  generateChecksum,
  deriveKeyPairFromSeed,
} from './crypto/keys';
import { generateDID, validateHandle, formatHandle } from './did';
import { generateShares, defaultRecoveryConfig } from './recovery';
import type { DID, SeedPhrase, SocialRecoveryShare } from '../shared-types';
import { encryptSync, storeKeySync } from './storage';

export class Identity {
  public did: DID | null = null;
  public seedPhrase: SeedPhrase | null = null;
  public signingKey: Uint8Array | null = null;
  public recoveryKey: Uint8Array | null = null;

  /**
   * Create a new identity
   */
  static async create(handle: string): Promise<Identity> {
    const identity = new Identity();

    // Generate seed phrase
    const words = generateSeedPhrase();
    const checksum = generateChecksum(words);

    identity.seedPhrase = { words, checksum };

    // Derive keys
    const signingKeyPair = deriveKeyPairFromSeed(words, 0, 0);
    const recoveryKeyPair = deriveKeyPairFromSeed(words, 0, 1);

    identity.signingKey = signingKeyPair.secretKey;
    identity.recoveryKey = recoveryKeyPair.secretKey;

    // Generate DID
    identity.did = await generateDID(
      signingKeyPair.publicKey,
      recoveryKeyPair.publicKey,
      handle
    );

    return identity;
  }

  /**
   * Restore identity from seed phrase
   */
  static async restore(words: string[], handle: string): Promise<Identity> {
    if (!validateSeedPhrase(words)) {
      throw new Error('Invalid seed phrase');
    }

    const identity = new Identity();
    const checksum = generateChecksum(words);

    identity.seedPhrase = { words, checksum };

    // Derive keys
    const signingKeyPair = deriveKeyPairFromSeed(words, 0, 0);
    const recoveryKeyPair = deriveKeyPairFromSeed(words, 0, 1);

    identity.signingKey = signingKeyPair.secretKey;
    identity.recoveryKey = recoveryKeyPair.secretKey;

    // Generate DID
    identity.did = await generateDID(
      signingKeyPair.publicKey,
      recoveryKeyPair.publicKey,
      handle
    );

    return identity;
  }

  /**
   * Generate social recovery shares
   */
  generateRecoveryShares(trustedDIDs: string[]): SocialRecoveryShare[] {
    if (!this.recoveryKey) {
      throw new Error('Identity not initialized');
    }

    const config = defaultRecoveryConfig();
    const shares = generateShares(this.recoveryKey, config);

    // Assign trusted DIDs to shares
    shares.forEach((share, index) => {
      if (index < trustedDIDs.length) {
        share.trustedDID = trustedDIDs[index];
      }
    });

    return shares;
  }

  /**
   * Export identity for backup (encrypted)
   */
  exportEncrypted(password: string): Uint8Array {
    if (!this.seedPhrase || !this.signingKey || !this.recoveryKey) {
      throw new Error('Identity not fully initialized');
    }

    const data = JSON.stringify({
      seedPhrase: this.seedPhrase.words,
      did: this.did?.did,
      handle: this.did?.handle,
    });

    return encryptSync(new TextEncoder().encode(data), password);
  }

  /**
   * Save identity to storage (Node.js)
   */
  saveToStorage(password: string, storagePath: string): void {
    if (!this.did) {
      throw new Error('Identity not initialized');
    }

    const encrypted = this.exportEncrypted(password);
    storeKeySync(this.did.did, encrypted, storagePath);
  }

  /**
   * Validate handle
   */
  validateHandle(username: string): boolean {
    return validateHandle(username);
  }

  /**
   * Get formatted handle
   */
  getFormattedHandle(username: string): string {
    return formatHandle(username);
  }

  /**
   * Get DID
   */
  getDID(): string {
    if (!this.did) {
      throw new Error('Identity not initialized');
    }
    return this.did.did;
  }

  /**
   * Get handle
   */
  getHandle(): string {
    if (!this.did) {
      throw new Error('Identity not initialized');
    }
    return this.did.handle;
  }

  /**
   * Get verification methods
   */
  getVerificationMethods() {
    if (!this.did) {
      throw new Error('Identity not initialized');
    }
    return this.did.verificationMethods;
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData(): void {
    this.signingKey = null;
    this.recoveryKey = null;
  }

  /**
   * Check if identity is initialized
   */
  isInitialized(): boolean {
    return this.did !== null && this.seedPhrase !== null;
  }
}