/**
 * Escrow manager for marketplace transactions
 * Handles secure payment holding until conditions are met
 */

import { EscrowConfig, EscrowStatus, Currency } from '../types';
import { SolanaWalletManager } from '../solana/wallet';

export interface CreateEscrowOptions {
  buyerDID: string;
  sellerDID: string;
  amount: number;
  currency: Currency;
  expiryHours?: number;
}

export class EscrowManager {
  private escrows: Map<string, EscrowConfig> = new Map();
  private solanaWallet: SolanaWalletManager;

  constructor(solanaWallet: SolanaWalletManager) {
    this.solanaWallet = solanaWallet;
  }

  /**
   * Create a new escrow
   */
  async createEscrow(options: CreateEscrowOptions): Promise<EscrowConfig> {
    const id = this.generateId();
    const expiry = new Date(Date.now() + (options.expiryHours || 24) * 60 * 60 * 1000);

    const escrow: EscrowConfig = {
      id,
      buyerDID: options.buyerDID,
      sellerDID: options.sellerDID,
      amount: options.amount,
      currency: options.currency,
      expiry,
      status: EscrowStatus.Created,
    };

    this.escrows.set(id, escrow);

    // If using SOL, create on-chain escrow
    if (options.currency === Currency.SOL) {
      await this.createOnChainEscrow(escrow);
    }

    return escrow;
  }

  /**
   * Fund an escrow
   */
  async fundEscrow(escrowId: string): Promise<EscrowConfig> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.Created) {
      throw new Error('Escrow cannot be funded in current state');
    }

    // In production, this would lock the funds
    escrow.status = EscrowStatus.Funded;
    this.escrows.set(escrowId, escrow);

    return escrow;
  }

  /**
   * Release funds to seller
   */
  async releaseEscrow(escrowId: string, sellerDID: string): Promise<EscrowConfig> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.sellerDID !== sellerDID) {
      throw new Error('Unauthorized: not the seller');
    }

    if (escrow.status !== EscrowStatus.Funded) {
      throw new Error('Escrow must be funded before release');
    }

    if (escrow.currency === Currency.SOL) {
      await this.solanaWallet.releaseEscrow(escrowId, sellerDID);
    }

    escrow.status = EscrowStatus.Released;
    escrow.releasedAt = new Date();
    this.escrows.set(escrowId, escrow);

    return escrow;
  }

  /**
   * Refund escrow to buyer
   */
  async refundEscrow(escrowId: string, buyerDID: string): Promise<EscrowConfig> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.buyerDID !== buyerDID) {
      throw new Error('Unauthorized: not the buyer');
    }

    if (escrow.status !== EscrowStatus.Funded) {
      throw new Error('Escrow must be funded for refund');
    }

    if (escrow.currency === Currency.SOL) {
      await this.solanaWallet.refundEscrow(escrowId, buyerDID);
    }

    escrow.status = EscrowStatus.Refunded;
    escrow.refundedAt = new Date();
    this.escrows.set(escrowId, escrow);

    return escrow;
  }

  /**
   * Get escrow by ID
   */
  getEscrow(escrowId: string): EscrowConfig | null {
    return this.escrows.get(escrowId) || null;
  }

  /**
   * Get all escrows for a DID
   */
  getEscrowsForDID(did: string): EscrowConfig[] {
    return Array.from(this.escrows.values()).filter(
      (e) => e.buyerDID === did || e.sellerDID === did
    );
  }

  /**
   * Check for expired escrows
   */
  checkExpiredEscrows(): EscrowConfig[] {
    const now = Date.now();
    const expired: EscrowConfig[] = [];

    for (const [id, escrow] of this.escrows) {
      if (
        escrow.status === EscrowStatus.Funded &&
        escrow.expiry.getTime() < now
      ) {
        escrow.status = EscrowStatus.Expired;
        this.escrows.set(id, escrow);
        expired.push(escrow);
      }
    }

    return expired;
  }

  /**
   * Delete an escrow
   */
  deleteEscrow(escrowId: string): boolean {
    return this.escrows.delete(escrowId);
  }

  /**
   * Create on-chain escrow (Solana)
   */
  private async createOnChainEscrow(escrow: EscrowConfig): Promise<void> {
    // Convert amount to lamports
    const lamports = Math.floor(escrow.amount * 1_000_000_000);

    await this.solanaWallet.createEscrowAccount(
      escrow.buyerDID,
      escrow.sellerDID,
      lamports,
      escrow.expiry
    );
  }

  /**
   * Generate unique escrow ID
   */
  private generateId(): string {
    return `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate escrow status transition
   */
  static canTransition(
    fromStatus: EscrowStatus,
    toStatus: EscrowStatus
  ): boolean {
    const validTransitions: Record<EscrowStatus, EscrowStatus[]> = {
      [EscrowStatus.Created]: [EscrowStatus.Funded],
      [EscrowStatus.Funded]: [EscrowStatus.Released, EscrowStatus.Refunded, EscrowStatus.Expired],
      [EscrowStatus.Released]: [],
      [EscrowStatus.Refunded]: [],
      [EscrowStatus.Expired]: [EscrowStatus.Refunded],
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }
}