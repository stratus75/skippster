/**
 * Skippster AI Agent Framework
 * Permission-based autonomous agent with audit logging
 */

// Types
export {
  PermissionScope,
  PermissionRequestStatus,
  AgentLimits,
  ActionCategory,
} from './permissions/types';
export type {
  Permission,
  PermissionLimits,
  PermissionRequest,
  AgentConfig,
} from './permissions/types';

export {
  ActionStatus,
} from './actions/types';
export type {
  AgentAction,
  FeedMonitoringConfig,
  AutoPostConfig,
  AutoReplyConfig,
  AutoPurchaseConfig,
  AgentSchedule,
} from './actions/types';

// Permissions
export { PermissionManager } from './permissions/manager';

// Actions
export { ActionQueue } from './actions/queue';

// Executor
export { AgentExecutor } from './executor/agent';
export type { ExecutionContext } from './executor/agent';

// Logger
export { AgentLogger } from './logger/logger';
export type { LogEntry, LogFilter } from './logger/logger';

// Helper to create a default agent
export function createAgent(did: string, name?: string): AgentExecutor {
  const config: AgentConfig = {
    did,
    name,
    permissions: [],
  };

  return new AgentExecutor(config);
}

import { AgentExecutor } from './executor/agent';
import { AgentConfig } from './permissions/types';