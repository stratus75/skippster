/**
 * Skippster Identity Module
 * Provides DID generation, key management, and social recovery
 */

// Re-export main classes
export { IdentityManager } from './manager';
export type { IdentityConfig, CreateIdentityOptions } from './manager';

// Crypto utilities
export {
  generateSeedPhrase,
  validateSeedPhrase,
  deriveKeyFromSeed,
  encrypt,
  decrypt,
} from './crypto/seed';

export {
  generateKeyPair,
  generateKeyPairFromSeed,
  signMessage,
  verifySignature,
  derivePublicKey,
  exportKeyPair,
  importKeyPair,
} from './crypto/ed25519';
export type { Ed25519KeyPair } from './crypto/ed25519';

export {
  stringToBytes,
  bytesToString,
  generateRandomBytes,
  generateId,
  concatBytes,
  bytesEqual,
} from './crypto/utils';

// DID functions
export {
  generatePLCDID,
  createPLCDocument,
  isValidPLCDID,
  resolveHandleToDID,
  cacheHandleForDID,
} from './did/plc';

export {
  DIDDocument,
  DID,
  VerificationMethod,
  Service,
  DIDMethod,
  DIDResolver,
} from './did/types';

// Handle management
export {
  HandleManager,
  validateHandle,
  normalizeHandle,
  createFullHandle,
  parseHandle,
  generateHandleSuggestion,
} from './handle/manager';
export type { Handle, HandleDomain, HandleReservation } from './handle/types';

// Social recovery
export { SocialRecoveryManager } from './recovery/manager';
export {
  splitSecret,
  reconstructSecret,
  encodeShare,
  decodeShare,
  encryptShare,
  decryptShare,
} from './recovery/shamir';
export type {
  SocialRecoveryConfig,
  RecoveryShare,
  RecoveryChallenge,
  RecoveryRequest,
} from './recovery/types';

// Storage
export { EncryptedStore } from './storage/encrypted-store';
export { MemoryStore } from './storage/memory-store';
export type {
  StoredIdentity,
  StoredHandleReservation,
  StorageConfig,
  EncryptedData,
  StorageError,
} from './storage/types';