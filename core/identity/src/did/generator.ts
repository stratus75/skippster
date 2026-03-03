/**
 * DID:PLC generator
 * PLC = Permissionless Ledger Controller
 */

import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { encodeKeyToMultibase, sign, verify } from '../crypto/keys';
import type { DID, DIDDocument, VerificationMethod, Service } from './types';

/**
 * Generate a DID:PLC identifier
 * Format: did:plc:<genesis-cid>
 */
export async function generateDID(
  signingKey: Uint8Array,
  recoveryKey: Uint8Array,
  handle: string
): Promise<DID> {
  // Create the PLC operation document
  const didDoc = createInitialDIDDocument(signingKey, recoveryKey, handle);

  // Serialize the document
  const serialized = JSON.stringify(didDoc, null, 2);

  // Generate genesis CID (using simple hash for demo)
  const genesisBytes = new TextEncoder().encode(serialized);
  const genesisHash = sha256(genesisBytes);

  // Create CID (multibase base58btc with sha-256 prefix)
  const genesisCID = encodeKeyToMultibase(genesisHash, 0x12); // 0x12 = sha-256

  // Construct the DID
  const did = `did:plc:${genesisCID}`;

  return {
    did,
    handle: `@${handle}.skippster.social`,
    verificationMethods: didDoc.verificationMethod,
    services: didDoc.service,
    rotationKeys: [encodeKeyToMultibase(recoveryKey)],
    alsoKnownAs: [handle],
  };
}

/**
 * Create the initial DID document for PLC
 */
function createInitialDIDDocument(
  signingKey: Uint8Array,
  recoveryKey: Uint8Array,
  handle: string
): DIDDocument {
  const did = 'did:plc:placeholder'; // Will be replaced with actual DID

  const signingKeyMultibase = encodeKeyToMultibase(signingKey);
  const recoveryKeyMultibase = encodeKeyToMultibase(recoveryKey);

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1',
    ],
    id: did,
    alsoKnownAs: [handle],
    verificationMethod: [
      {
        id: `${did}#atproto`,
        type: 'Multikey',
        publicKeyMultibase: signingKeyMultibase,
      },
      {
        id: `${did}#recovery`,
        type: 'Multikey',
        publicKeyMultibase: recoveryKeyMultibase,
      },
    ],
    service: [
      {
        id: `${did}#atproto_pds`,
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: 'https://pds.skippster.social',
      },
    ],
    rotationKeys: [recoveryKeyMultibase],
  };
}

/**
 * Resolve a DID to its document
 * For production, this would query the PLC directory
 */
export async function resolveDID(did: string): Promise<DIDDocument> {
  // In production, fetch from PLC directory or cache
  throw new Error('DID resolution not implemented - would query PLC directory');
}

/**
 * Validate a DID format
 */
export function validateDID(did: string): boolean {
  const plcRegex = /^did:plc:[a-z0-9]+$/;
  return plcRegex.test(did);
}

/**
 * Extract handle from DID (if available)
 */
export function extractHandle(did: string): string | null {
  // In production, resolve DID and extract from document
  return null;
}

/**
 * Update DID document with new keys (rotation)
 */
export async function rotateKeys(
  currentDID: string,
  newSigningKey: Uint8Array,
  recoveryKey: Uint8Array
): Promise<DID> {
  // In production, this would create a rotation operation and submit to PLC
  throw new Error('Key rotation not implemented');
}