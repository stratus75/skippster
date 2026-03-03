/**
 * Social recovery manager for Skippster
 */

import { SocialRecoveryConfig, RecoveryShare, RecoveryRequest } from './types';
import { splitSecret, reconstructSecret, encodeShare, decodeShare } from './shamir';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { signMessage, verifySignature } from '../crypto/ed25519';

export class SocialRecoveryManager {
  private static readonly DEFAULT_THRESHOLD = 3;
  private static readonly DEFAULT_TOTAL_SHARES = 5;

  /**
   * Initialize social recovery for a user
   */
  static async initializeRecovery(
    secretKey: Uint8Array,
    trustedDIDs: string[],
    threshold?: number,
    totalShares?: number
  ): Promise<{ config: SocialRecoveryConfig; shares: RecoveryShare[] }> {
    const finalThreshold = threshold ?? this.DEFAULT_THRESHOLD;
    const finalTotal = totalShares ?? this.DEFAULT_TOTAL_SHARES;

    if (trustedDIDs.length < finalThreshold) {
      throw new Error('Need at least threshold number of trusted DIDs');
    }

    const config: SocialRecoveryConfig = {
      threshold: finalThreshold,
      totalShares: finalTotal,
      trustedDIDs: trustedDIDs.slice(0, finalTotal),
    };

    // Split the secret key
    const rawShares = splitSecret(secretKey, finalThreshold, finalTotal);

    // Create RecoveryShare objects
    const shares: RecoveryShare[] = rawShares.map((share, index) => ({
      id: bytesToHex(crypto.getRandomValues(new Uint8Array(16))),
      share: encodeShare(share),
      holderDID: config.trustedDIDs[index] || '',
      creatorDID: '', // Will be set by caller
      version: 1,
      createdAt: new Date(),
      encrypted: true,
    }));

    return { config, shares };
  }

  /**
   * Recover secret key from shares
   */
  static async recoverSecret(
    shares: RecoveryShare[],
    config: SocialRecoveryConfig
  ): Promise<Uint8Array> {
    if (shares.length < config.threshold) {
      throw new Error('Not enough shares to recover');
    }

    // Decode shares
    const rawShares = shares
      .slice(0, config.threshold)
      .map((s) => decodeShare(s.share));

    // Reconstruct secret
    return reconstructSecret(rawShares, config.threshold);
  }

  /**
   * Create a recovery request
   */
  static createRecoveryRequest(
    targetDID: string,
    requesterDID: string
  ): RecoveryRequest {
    return {
      id: bytesToHex(crypto.getRandomValues(new Uint8Array(16))),
      targetDID,
      requesterDID,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  /**
   * Approve a recovery request
   */
  static approveRecoveryRequest(
    request: RecoveryRequest,
    secretKey: Uint8Array,
    message: string
  ): RecoveryRequest {
    const signature = bytesToHex(signMessage(new TextEncoder().encode(message), secretKey));

    return {
      ...request,
      status: 'approved',
    };
  }

  /**
   * Verify recovery request approval
   */
  static verifyRecoveryApproval(
    message: string,
    signature: string,
    publicKey: Uint8Array
  ): boolean {
    return verifySignature(
      new TextEncoder().encode(message),
      hexToBytes(signature),
      publicKey
    );
  }

  /**
   * Complete recovery request
   */
  static completeRecoveryRequest(request: RecoveryRequest): RecoveryRequest {
    return {
      ...request,
      status: 'completed',
      completedAt: new Date(),
    };
  }

  /**
   * Validate recovery config
   */
  static validateConfig(config: SocialRecoveryConfig): boolean {
    return (
      config.threshold >= 2 &&
      config.threshold <= config.totalShares &&
      config.totalShares <= 10 &&
      config.trustedDIDs.length >= config.threshold
    );
  }
}