import { bytesToHex, hexToBytes, sha256 } from '@noble/hashes/sha256';
import { Ed25519KeyPair } from '../crypto/ed25519';
import { DIDDocument, VerificationMethod, Service } from './types';

/**
 * PLC (Primary Ledger Control) DID implementation
 * Similar to AT Protocol's DID:PLC method
 */

const PLC_DID_PREFIX = 'did:plc:';
const MULTICODEC_ED25519_PUB = 0xed01; // Ed25519 public key multicodec

/**
 * Generate a PLC DID from verification key
 */
export function generatePLCDID(verificationKey: Uint8Array): string {
  // PLC DIDs are computed as: did:plc:<hash of genesis operation>
  // For simplicity, we hash the verification key
  const hash = sha256(verificationKey);
  const hashHex = bytesToHex(hash);
  return `${PLC_DID_PREFIX}${hashHex.substring(0, 24)}`;
}

/**
 * Create DID document for a PLC identity
 */
export function createPLCDocument(
  did: string,
  keyPair: Ed25519KeyPair,
  handle: string,
  pdsEndpoint: string
): DIDDocument {
  const publicKeyMultibase = encodeMultibase(keyPair.publicKey);

  const verificationMethods: VerificationMethod[] = [
    {
      id: `${did}#atproto`,
      type: 'Multikey',
      publicKeyMultibase,
    },
  ];

  const services: Service[] = [
    {
      id: `${did}#atproto_pds`,
      type: 'AtprotoPersonalDataServer',
      serviceEndpoint: pdsEndpoint,
    },
  ];

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1',
      'https://bsky.social/xrpc/com/atproto/lexicon',
    ],
    id: did,
    alsoKnownAs: [`at://${handle}`],
    verificationMethod: verificationMethods,
    service: services,
  };
}

/**
 * Encode bytes to multibase (base58btc)
 */
function encodeMultibase(bytes: Uint8Array): string {
  // Simplified multibase encoding
  // In production, use proper base58btc encoding
  const prefix = 'z'; // base58btc prefix
  const base58 = bytesToBase58(bytes);
  return prefix + base58;
}

/**
 * Simple base58 encoding
 */
function bytesToBase58(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const num = bytesToBigInt(bytes);
  let result = '';
  while (num > 0n) {
    result = alphabet[Number(num % 58n)] + result;
    num = num / 58n;
  }
  return result || '1';
}

/**
 * Convert bytes to big integer
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}

/**
 * Validate PLC DID format
 */
export function isValidPLCDID(did: string): boolean {
  return did.startsWith(PLC_DID_PREFIX) && did.length === PLC_DID_PREFIX.length + 24;
}

/**
 * Extract DID from handle
 */
export function resolveHandleToDID(handle: string, didCache: Map<string, string>): string | null {
  return didCache.get(handle) || null;
}

/**
 * Cache DID for handle
 */
export function cacheHandleForDID(handle: string, did: string, didCache: Map<string, string>): void {
  didCache.set(handle, did);
}