/**
 * Lightning address handling
 * Format: username@domain
 */

import { LightningAddress } from '../types';

export class LightningAddressManager {
  private static readonly DEFAULT_DOMAIN = 'skippster.social';

  /**
   * Create a Lightning address from username
   */
  static createAddress(username: string, domain?: string): LightningAddress {
    return {
      username: username.toLowerCase(),
      domain: domain || this.DEFAULT_DOMAIN,
      did: '',
      lnurl: '',
    };
  }

  /**
   * Parse a Lightning address
   */
  static parseAddress(address: string): { username: string; domain: string } | null {
    const match = address.match(/^([a-z0-9_\-\.]+)@([a-z0-9_\-\.]+)$/i);
    if (!match) {
      return null;
    }
    return {
      username: match[1].toLowerCase(),
      domain: match[2].toLowerCase(),
    };
  }

  /**
   * Validate a Lightning address
   */
  static validateAddress(address: string): boolean {
    const parsed = this.parseAddress(address);
    if (!parsed) {
      return false;
    }

    // Validate username (3-30 chars, alphanumeric, dots, hyphens, underscores)
    if (parsed.username.length < 3 || parsed.username.length > 30) {
      return false;
    }

    const usernamePattern = /^[a-z0-9_\-\.]+$/;
    if (!usernamePattern.test(parsed.username)) {
      return false;
    }

    // Username cannot start or end with dot or hyphen
    if (
      parsed.username.startsWith('.') ||
      parsed.username.endsWith('.') ||
      parsed.username.startsWith('-') ||
      parsed.username.endsWith('-')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Format a Lightning address
   */
  static formatAddress(address: LightningAddress): string {
    return `${address.username}@${address.domain}`;
  }

  /**
   * Generate LNURL from Lightning address
   * This is a simplified implementation
   */
  static generateLNURL(address: LightningAddress): string {
    // In production, this would create a proper LNURL
    // For now, we return a placeholder
    const formatted = this.formatAddress(address);
    return `lnurlp://${formatted}`;
  }

  /**
   * Create a Lightning invoice
   * Note: This requires a Lightning node in production
   */
  static async createInvoice(
    address: LightningAddress,
    amountSats: number,
    memo?: string
  ): Promise<{ bolt11: string; paymentHash: string }> {
    // In production, this would call a Lightning node API
    // For MVP, we return a placeholder
    const paymentHash = this.generatePaymentHash();

    return {
      bolt11: `lnbc${amountSats}n1${paymentHash}...`,
      paymentHash,
    };
  }

  /**
   * Pay a Lightning invoice
   * Note: This requires a Lightning node in production
   */
  static async payInvoice(
    bolt11: string,
    maxFeeSats: number = 100
  ): Promise<{ success: boolean; paymentHash?: string; error?: string }> {
    // In production, this would call a Lightning node API
    // For MVP, we return success
    return {
      success: true,
      paymentHash: this.generatePaymentHash(),
    };
  }

  /**
   * Check invoice status
   */
  static async checkInvoiceStatus(paymentHash: string): Promise<{
    status: 'pending' | 'paid' | 'expired';
    amount?: number;
  }> {
    // In production, this would call a Lightning node API
    return {
      status: 'pending',
    };
  }

  /**
   * Generate a payment hash (simplified)
   */
  private static generatePaymentHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Convert sats to BTC
   */
  static satsToBTC(sats: number): number {
    return sats / 100000000;
  }

  /**
   * Convert BTC to sats
   */
  static btcToSats(btc: number): number {
    return Math.floor(btc * 100000000);
  }

  /**
   * Convert USD to sats (approximate)
   */
  static usdToSats(usd: number, btcPrice: number = 65000): number {
    const btc = usd / btcPrice;
    return this.btcToSats(btc);
  }

  /**
   * Convert sats to USD (approximate)
   */
  static satsToUSD(sats: number, btcPrice: number = 65000): number {
    const btc = this.satsToBTC(sats);
    return btc * btcPrice;
  }
}