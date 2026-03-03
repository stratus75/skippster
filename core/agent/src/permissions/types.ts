/**
 * Permission types for AI Agent
 */

export enum PermissionScope {
  // Tube permissions
  TUBE_READ = 'tube:read',
  TUBE_POST = 'tube:post',
  TUBE_UPLOAD = 'tube:upload',
  TUBE_COMMENT = 'tube:comment',
  TUBE_LIKE = 'tube:like',
  TUBE_SUBSCRIBE = 'tube:subscribe',

  // Social permissions
  SOCIAL_READ = 'social:read',
  SOCIAL_POST = 'social:post',
  SOCIAL_FRIEND = 'social:friend',
  SOCIAL_MESSAGE = 'social:message',
  SOCIAL_REACT = 'social:react',

  // Marketplace permissions
  MARKETPLACE_READ = 'marketplace:read',
  MARKETPLACE_BUY = 'marketplace:buy',
  MARKETPLACE_SELL = 'marketplace:sell',
  MARKETPLACE_BID = 'marketplace:bid',

  // Payment permissions
  PAYMENTS_DONATE = 'payments:donate',
  PAYMENTS_PURCHASE = 'payments:purchase',
  PAYMENTS_SUBSCRIBE = 'payments:subscribe',

  // System permissions
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
}

export interface Permission {
  scope: PermissionScope;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  limits?: PermissionLimits;
}

export interface PermissionLimits {
  maxAmount?: number; // For payments (in smallest unit)
  maxActionsPerDay?: number;
  maxActionsPerWeek?: number;
  allowedTargets?: string[]; // Specific DIDs
  allowedCategories?: string[]; // For marketplace categories
  requireApproval?: boolean;
}

export interface PermissionRequest {
  id: string;
  scope: PermissionScope;
  action: string;
  data?: unknown;
  limits?: PermissionLimits;
  createdAt: Date;
  expiresAt?: Date;
  status: PermissionRequestStatus;
  approvedAt?: Date;
  declinedAt?: Date;
}

export enum PermissionRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Declined = 'declined',
  Expired = 'expired',
}

export interface AgentConfig {
  did: string;
  name?: string;
  description?: string;
  avatar?: string;
  permissions: Permission[];
  limits?: AgentLimits;
}

export interface AgentLimits {
  maxBudgetPerDay?: number; // In USD equivalent
  maxActionsPerDay?: number;
  requireApprovalForAll?: boolean;
  autoApproveDonationsBelow?: number;
}

export enum ActionCategory {
  FeedMonitoring = 'feed_monitoring',
  AutoPosting = 'auto_posting',
  AutoCommenting = 'auto_commenting',
  AutoReacting = 'auto_reacting',
  AutoPurchasing = 'auto_purchasing',
  AutoReply = 'auto_reply',
  SubscriptionManagement = 'subscription_management',
}