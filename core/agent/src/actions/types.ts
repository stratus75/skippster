/**
 * Action types for AI Agent
 */

export interface AgentAction {
  id: string;
  type: ActionCategory;
  scope: string;
  data: unknown;
  signature: string;
  timestamp: Date;
  status: ActionStatus;
  executionResult?: unknown;
  error?: string;
  requiresApproval: boolean;
  approvedBy?: string; // User DID
}

export enum ActionStatus {
  Pending = 'pending',
  Approved = 'approved',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface FeedMonitoringConfig {
  keywords: string[];
  dids: string[];
  hashtags: string[];
  interval: number; // minutes
}

export interface AutoPostConfig {
  templates: string[];
  schedule: string[]; // cron expressions or time ranges
  platforms: string[]; // 'tube', 'social'
}

export interface AutoReplyConfig {
  triggers: string[]; // keywords or phrases
  responses: string[];
  delayMs: number;
}

export interface AutoPurchaseConfig {
  maxPrice: number;
  currency: string;
  categories: string[];
  requireApproval: boolean;
}

export interface AgentSchedule {
  id: string;
  actionId: string;
  scheduledFor: Date;
  interval?: number; // For recurring actions
  lastRun?: Date;
  active: boolean;
}