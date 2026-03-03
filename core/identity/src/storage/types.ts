/**
 * Storage types for identity data
 */

export interface StoredIdentity {
  did: string;
  handle: string;
  seedPhrase: string; // Encrypted
  keyPair: {
    publicKey: string; // Hex, not encrypted
    secretKey: string; // Encrypted
  };
  recoveryConfig?: string; // JSON string, encrypted
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredHandleReservation {
  handle: string;
  did: string;
  signature: string;
  reservedAt: Date;
  expiresAt?: Date;
}

export interface StorageConfig {
  encryptionKey?: Uint8Array;
  autoBackup?: boolean;
  backupPath?: string;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  nonce: string; // Base64 encoded nonce
  version: number;
}

export interface StorageError {
  code: string;
  message: string;
  details?: unknown;
}