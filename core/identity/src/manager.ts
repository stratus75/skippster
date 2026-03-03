/**
 * Main Identity Manager for Skippster
 * Coordinates all identity operations
 */

import { generateSeedPhrase, validateSeedPhrase, deriveKeyFromSeed } from './crypto/seed';
import { generateKeyPair, signMessage, Ed25519KeyPair } from './crypto/ed25519';
import { generatePLCDID, createPLCDocument, isValidPLCDID } from './did/plc';
import { DID } from './did/types';
import { HandleManager, HandleDomain } from './handle/manager';
import { SocialRecoveryManager } from './recovery/manager';
import { EncryptedStore } from './storage/encrypted-store';
import { MemoryStore } from './storage/memory-store';

export interface IdentityConfig {
  pdsEndpoint?: string;
  enableRecovery?: boolean;
  autoBackup?: boolean;
}

export interface CreateIdentityOptions {
  handle: string;
  password: string;
  enableRecovery?: boolean;
  trustedDIDs?: string[];
  recoveryThreshold?: number;
  recoveryTotalShares?: number;
}

export class IdentityManager {
  private did: string | null = null;
  private handle: string | null = null;
  private keyPair: Ed25519KeyPair | null = null;
  private seedPhrase: string[] | null = null;
  private encryptedStore: EncryptedStore | null = null;
  private config: IdentityConfig;

  constructor(config: IdentityConfig = {}) {
    this.config = {
      pdsEndpoint: config.pdsEndpoint || 'http://localhost:4000',
      enableRecovery: config.enableRecovery ?? true,
      autoBackup: config.autoBackup ?? true,
    };
  }

  /**
   * Create a new identity
   */
  async createIdentity(options: CreateIdentityOptions): Promise<{
    did: string;
    handle: string;
    seedPhrase: string[];
  }> {
    // Validate handle
    const normalizedHandle = HandleManager.normalizeHandle(options.handle);
    if (!HandleManager.validateHandle(normalizedHandle)) {
      throw new Error('Invalid handle');
    }

    // Generate seed phrase
    const seedPhraseWords = generateSeedPhrase();

    // Derive key from seed
    const seed = deriveKeyFromSeed(seedPhraseWords);
    this.keyPair = generateKeyPairFromSeed(seed);

    // Generate DID
    this.did = generatePLCDID(this.keyPair.publicKey);
    this.handle = HandleManager.createFullHandle(normalizedHandle, HandleDomain.SKIPPSTER_SOCIAL);
    this.seedPhrase = seedPhraseWords;

    // Set up encrypted storage
    this.encryptedStore = new EncryptedStore(options.password);

    // Store identity
    await this.saveIdentity(options.password);

    // Set up recovery if enabled
    if (this.config.enableRecovery && options.trustedDIDs && options.trustedDIDs.length > 0) {
      await this.setupRecovery(
        this.keyPair.secretKey,
        options.trustedDIDs,
        options.recoveryThreshold,
        options.recoveryTotalShares
      );
    }

    return {
      did: this.did,
      handle: this.handle,
      seedPhrase: this.seedPhrase,
    };
  }

  /**
   * Load existing identity from storage
   */
  async loadIdentity(password: string): Promise<{ did: string; handle: string } | null> {
    this.encryptedStore = new EncryptedStore(password);

    const stored = await this.encryptedStore.retrieveIdentity();
    if (!stored) {
      return null;
    }

    this.did = stored.did;
    this.handle = stored.handle;
    this.seedPhrase = stored.seedPhrase.split(' ');

    // Reconstruct key pair
    const seed = deriveKeyFromSeed(this.seedPhrase);
    this.keyPair = generateKeyPairFromSeed(seed);

    return {
      did: this.did,
      handle: this.handle,
    };
  }

  /**
   * Recover identity using seed phrase
   */
  async recoverIdentity(seedPhrase: string[], password: string, newHandle?: string): Promise<{
    did: string;
    handle: string;
  }> {
    // Validate seed phrase
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error('Invalid seed phrase');
    }

    // Derive key from seed
    const seed = deriveKeyFromSeed(seedPhrase);
    this.keyPair = generateKeyPairFromSeed(seed);

    // Generate DID from existing key
    this.did = generatePLCDID(this.keyPair.publicKey);
    this.seedPhrase = seedPhrase;

    // Set handle
    if (newHandle) {
      const normalized = HandleManager.normalizeHandle(newHandle);
      if (!HandleManager.validateHandle(normalized)) {
        throw new Error('Invalid handle');
      }
      this.handle = HandleManager.createFullHandle(normalized, HandleDomain.SKIPPSTER_SOCIAL);
    } else {
      this.handle = HandleManager.createFullHandle(
        HandleManager.generateHandleSuggestion(this.did),
        HandleDomain.SKIPPSTER_SOCIAL
      );
    }

    // Store with new password
    this.encryptedStore = new EncryptedStore(password);
    await this.saveIdentity(password);

    return {
      did: this.did,
      handle: this.handle,
    };
  }

  /**
   * Recover identity using social recovery shares
   */
  async recoverWithShares(
    shares: string[],
    config: { threshold: number; totalShares: number },
    password: string
  ): Promise<{ did: string; handle: string }> {
    throw new Error('Social recovery implementation pending');
  }

  /**
   * Get DID
   */
  getDID(): string {
    if (!this.did) {
      throw new Error('Identity not loaded');
    }
    return this.did;
  }

  /**
   * Get handle
   */
  getHandle(): string {
    if (!this.handle) {
      throw new Error('Identity not loaded');
    }
    return this.handle;
  }

  /**
   * Get public key
   */
  getPublicKey(): Uint8Array {
    if (!this.keyPair) {
      throw new Error('Identity not loaded');
    }
    return this.keyPair.publicKey;
  }

  /**
   * Get key pair
   */
  getKeyPair(): Ed25519KeyPair {
    if (!this.keyPair) {
      throw new Error('Identity not loaded');
    }
    return this.keyPair;
  }

  /**
   * Sign a message
   */
  sign(message: Uint8Array): Uint8Array {
    if (!this.keyPair) {
      throw new Error('Identity not loaded');
    }
    return signMessage(message, this.keyPair.secretKey);
  }

  /**
   * Get DID document
   */
  getDIDDocument(): any {
    if (!this.did || !this.keyPair || !this.handle) {
      throw new Error('Identity not loaded');
    }

    return createPLCDocument(
      this.did,
      this.keyPair,
      this.handle,
      this.config.pdsEndpoint || 'http://localhost:4000'
    );
  }

  /**
   * Export identity for backup
   */
  async exportIdentity(): Promise<string> {
    if (!this.encryptedStore) {
      throw new Error('Storage not initialized');
    }
    return this.encryptedStore.exportIdentity();
  }

  /**
   * Import identity from backup
   */
  async importIdentity(data: string, password: string): Promise<void> {
    this.encryptedStore = new EncryptedStore(password);
    await this.encryptedStore.importIdentity(data);
    await this.loadIdentity(password);
  }

  /**
   * Clear identity from storage
   */
  async clearIdentity(): Promise<void> {
    if (this.encryptedStore) {
      await this.encryptedStore.deleteIdentity();
    }
    this.did = null;
    this.handle = null;
    this.keyPair = null;
    this.seedPhrase = null;
  }

  /**
   * Check if identity exists in storage
   */
  hasIdentity(): boolean {
    if (!this.encryptedStore) {
      return false;
    }
    return this.encryptedStore.hasIdentity();
  }

  // Private methods

  private async saveIdentity(password: string): Promise<void> {
    if (!this.did || !this.handle || !this.keyPair || !this.seedPhrase) {
      throw new Error('Cannot save incomplete identity');
    }

    const { importKeyPair, exportKeyPair } = await import('./crypto/ed25519');
    const exported = exportKeyPair(this.keyPair);

    const stored = {
      did: this.did,
      handle: this.handle,
      seedPhrase: this.seedPhrase.join(' '),
      keyPair: {
        publicKey: exported.publicKeyHex,
        secretKey: exported.secretKeyHex,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.encryptedStore!.storeIdentity(stored);
  }

  private async setupRecovery(
    secretKey: Uint8Array,
    trustedDIDs: string[],
    threshold?: number,
    totalShares?: number
  ): Promise<void> {
    const { config, shares } = await SocialRecoveryManager.initializeRecovery(
      secretKey,
      trustedDIDs,
      threshold,
      totalShares
    );

    // Store recovery config
    // In production, send shares to trusted DIDs via P2P network
  }
}