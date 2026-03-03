/**
 * DID (Decentralized Identifier) types for Skippster
 */

export interface DID {
  did: string; // did:plc:abc123...
  handle: string; // @alice.skippster.social
  verificationMethods: VerificationMethod[];
  services: Service[];
}

export interface VerificationMethod {
  id: string;
  type: 'Multikey' | 'EcdsaSecp256k1VerificationKey2019';
  publicKeyMultibase: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  alsoKnownAs?: string[];
  verificationMethod: VerificationMethod[];
  service?: Service[];
}

export enum DIDMethod {
  PLC = 'plc', // Primary Ledger Control (AT Protocol style)
  KEY = 'key', // Web Key
  WEB = 'web', // Web Domain
}

export enum DIDResolver {
  LOCAL = 'local',
  NETWORK = 'network',
  IPFS = 'ipfs',
}