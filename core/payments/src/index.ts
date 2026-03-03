/**
 * Skippster Payments Module
 * Lightning Network and Solana payment integration
 */

// Types
export {
  Currency,
  PaymentType,
  PaymentStatus,
  EscrowStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  InvoiceStatus,
} from './types';
export type {
  Payment,
  LightningAddress,
  SolanaWallet,
  EscrowConfig,
  SubscriptionPlan,
  UserSubscription,
  Invoice,
} from './types';

// Lightning
export { LightningAddressManager } from './lightning/address';
export type from './lightning/address';

// Solana
export { SolanaWalletManager } from './solana/wallet';

// Escrow
export { EscrowManager } from './escrow/manager';
export type { CreateEscrowOptions } from './escrow/manager';

// Manager
export { PaymentsManager } from './manager';
export type { CreatePaymentOptions } from './manager';

// Helpers
export function createPaymentsManager(solanaRpcUrl?: string): PaymentsManager {
  return new PaymentsManager(solanaRpcUrl);
}