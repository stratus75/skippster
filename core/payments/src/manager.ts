/**
 * Main payments manager
 * Coordinates Lightning, Solana, and escrow operations
 */

import { LightningAddressManager } from './lightning/address';
import { SolanaWalletManager } from './solana/wallet';
import { EscrowManager } from './escrow/manager';
import { Payment, PaymentType, PaymentStatus, Currency, SubscriptionPlan, SubscriptionStatus } from './types';

export interface CreatePaymentOptions {
  fromDID: string;
  toDID: string;
  amount: number;
  currency: Currency;
  type: PaymentType;
  memo?: string;
}

export class PaymentsManager {
  private lightning: LightningAddressManager;
  private solana: SolanaWalletManager;
  private escrow: EscrowManager;
  private payments: Map<string, Payment> = new Map();

  constructor(solanaRpcUrl?: string) {
    this.solana = new SolanaWalletManager(solanaRpcUrl);
    this.escrow = new EscrowManager(this.solana);
    this.lightning = new LightningAddressManager();
  }

  /**
   * Create a new payment
   */
  async createPayment(options: CreatePaymentOptions): Promise<Payment> {
    const id = this.generateId();
    const now = new Date();

    const payment: Payment = {
      id,
      fromDID: options.fromDID,
      toDID: options.toDID,
      amount: options.amount,
      currency: options.currency,
      type: options.type,
      status: PaymentStatus.Pending,
      createdAt: now,
      memo: options.memo,
    };

    this.payments.set(id, payment);

    // Process based on currency
    await this.processPayment(payment);

    return payment;
  }

  /**
   * Send a donation (Lightning)
   */
  async sendDonation(
    fromDID: string,
    toLightningAddress: string,
    amountSats: number,
    memo?: string
  ): Promise<Payment> {
    const parsed = LightningAddressManager.parseAddress(toLightningAddress);
    if (!parsed) {
      throw new Error('Invalid Lightning address');
    }

    // Create invoice for the recipient
    const lnAddress = LightningAddressManager.createAddress(parsed.username, parsed.domain);
    const { bolt11 } = await LightningAddressManager.createInvoice(lnAddress, amountSats, memo);

    // Pay the invoice
    const result = await LightningAddressManager.payInvoice(bolt11);

    if (!result.success) {
      throw new Error(result.error || 'Payment failed');
    }

    const payment = await this.createPayment({
      fromDID,
      toDID: '', // Would be looked up from Lightning address
      amount: amountSats,
      currency: Currency.SATS,
      type: PaymentType.Donation,
      memo,
    });

    payment.transactionId = result.paymentHash;
    payment.status = PaymentStatus.Completed;
    payment.completedAt = new Date();
    this.payments.set(payment.id, payment);

    return payment;
  }

  /**
   * Create a subscription plan
   */
  createSubscriptionPlan(
    creatorDID: string,
    name: string,
    description: string,
    amount: number,
    currency: Currency,
    interval: 'monthly' | 'yearly',
    features: string[]
  ): SubscriptionPlan {
    return {
      id: this.generateId(),
      creatorDID,
      name,
      description,
      amount,
      currency,
      interval: interval === 'monthly' ? 0 : 1,
      features,
    };
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(
    subscriberDID: string,
    plan: SubscriptionPlan
  ): Promise<Payment> {
    const payment = await this.createPayment({
      fromDID: subscriberDID,
      toDID: plan.creatorDID,
      amount: plan.amount,
      currency: plan.currency,
      type: PaymentType.Subscription,
      memo: `Subscription to ${plan.name}`,
    });

    return payment;
  }

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): Payment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Get payments for a DID
   */
  getPaymentsForDID(did: string): Payment[] {
    return Array.from(this.payments.values()).filter(
      (p) => p.fromDID === did || p.toDID === did
    );
  }

  /**
   * Get Lightning address manager
   */
  getLightning(): LightningAddressManager {
    return this.lightning;
  }

  /**
   * Get Solana wallet manager
   */
  getSolana(): SolanaWalletManager {
    return this.solana;
  }

  /**
   * Get escrow manager
   */
  getEscrow(): EscrowManager {
    return this.escrow;
  }

  /**
   * Process a payment based on currency
   */
  private async processPayment(payment: Payment): Promise<void> {
    try {
      switch (payment.currency) {
        case Currency.SATS:
        case Currency.BTC:
          await this.processLightningPayment(payment);
          break;
        case Currency.SOL:
          await this.processSolanaPayment(payment);
          break;
        case Currency.USD:
          await this.processFiatPayment(payment);
          break;
      }
    } catch (error) {
      payment.status = PaymentStatus.Failed;
      this.payments.set(payment.id, payment);
      throw error;
    }
  }

  private async processLightningPayment(payment: Payment): Promise<void> {
    // In production, this would process Lightning payment
    payment.status = PaymentStatus.Processing;
    this.payments.set(payment.id, payment);
  }

  private async processSolanaPayment(payment: Payment): Promise<void> {
    const lamports = payment.amount * 1_000_000_000;

    const result = await this.solana.transferSOL(
      payment.fromDID,
      payment.toDID,
      lamports
    );

    payment.transactionId = result.signature;
    payment.status = PaymentStatus.Completed;
    payment.completedAt = new Date();
    this.payments.set(payment.id, payment);
  }

  private async processFiatPayment(payment: Payment): Promise<void> {
    // Fiat payments would be handled by a payment processor
    payment.status = PaymentStatus.Processing;
    this.payments.set(payment.id, payment);
  }

  /**
   * Generate unique payment ID
   */
  private generateId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert between currencies
   */
  convertAmount(
    amount: number,
    from: Currency,
    to: Currency,
    rates?: { [key: string]: number }
  ): number {
    if (from === to) {
      return amount;
    }

    const defaultRates = {
      [`${Currency.SATS}-${Currency.BTC}`]: 1 / 100_000_000,
      [`${Currency.BTC}-${Currency.SATS}`]: 100_000_000,
      [`${Currency.BTC}-${Currency.USD}`]: 65000,
      [`${Currency.USD}-${Currency.BTC}`]: 1 / 65000,
      [`${Currency.USD}-${Currency.SOL}`]: 0.017,
      [`${Currency.SOL}-${Currency.USD}`]: 58,
    };

    const ratesToUse = rates || defaultRates;
    const key = `${from}-${to}`;
    const rate = ratesToUse[key];

    if (!rate) {
      // Try to convert through USD as intermediate
      const toUsd = this.convertAmount(amount, from, Currency.USD, rates);
      return this.convertAmount(toUsd, Currency.USD, to, rates);
    }

    return amount * rate;
  }
}