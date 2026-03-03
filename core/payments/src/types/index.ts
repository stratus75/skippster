/**
 * Payment types for Skippster
 */

export enum Currency {
  SATS = 'SATS',
  BTC = 'BTC',
  SOL = 'SOL',
  USD = 'USD',
}

export enum PaymentType {
  Donation = 'donation',
  Purchase = 'purchase',
  Subscription = 'subscription',
  Tip = 'tip',
}

export interface Payment {
  id: string;
  fromDID: string;
  toDID: string;
  amount: number;
  currency: Currency;
  type: PaymentType;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  memo?: string;
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}

export interface LightningAddress {
  username: string;
  domain: string;
  did: string;
  lnurl: string;
}

export interface SolanaWallet {
  publicKey: string;
  did: string;
  balance: number;
}

export interface EscrowConfig {
  id: string;
  buyerDID: string;
  sellerDID: string;
  amount: number;
  currency: Currency;
  expiry: Date;
  status: EscrowStatus;
  releasedAt?: Date;
  refundedAt?: Date;
}

export enum EscrowStatus {
  Created = 'created',
  Funded = 'funded',
  Released = 'released',
  Refunded = 'refunded',
  Expired = 'expired',
}

export interface SubscriptionPlan {
  id: string;
  creatorDID: string;
  name: string;
  description: string;
  amount: number;
  currency: Currency;
  interval: SubscriptionInterval;
  features: string[];
}

export enum SubscriptionInterval {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export interface UserSubscription {
  id: string;
  planId: string;
  subscriberDID: string;
  creatorDID: string;
  status: SubscriptionStatus;
  startedAt: Date;
  nextBilling: Date;
  cancelledAt?: Date;
}

export enum SubscriptionStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Expired = 'expired',
  PastDue = 'past_due',
}

export interface Invoice {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  bolt11?: string; // Lightning invoice
  createdAt: Date;
  expiresAt: Date;
  status: InvoiceStatus;
}

export enum InvoiceStatus {
  Pending = 'pending',
  Paid = 'paid',
  Expired = 'expired',
  Cancelled = 'cancelled',
}