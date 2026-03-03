/**
 * Social recovery types
 */

export interface SocialRecoveryConfig {
  threshold: number; // Number of shares needed to recover
  totalShares: number; // Total number of shares to distribute
  trustedDIDs: string[]; // DIDs of trusted friends
}

export interface RecoveryShare {
  id: string;
  share: string; // Encrypted share data
  holderDID: string; // The DID holding this share
  creatorDID: string; // The DID that created the recovery setup
  version: number;
  createdAt: Date;
  encrypted: boolean;
}

export interface RecoveryChallenge {
  id: string;
  requesterDID: string;
  sharesProvided: string[];
  signatures: string[];
  expiresAt: Date;
  createdAt: Date;
}

export interface RecoveryRequest {
  id: string;
  targetDID: string; // The DID being recovered
  requesterDID: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}