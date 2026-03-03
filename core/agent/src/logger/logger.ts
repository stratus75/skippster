/**
 * Agent logger
 * Logs all agent actions for transparency and auditing
 */

import { AgentAction } from '../actions/types';

export interface LogEntry {
  id: string;
  actionId: string;
  type: string;
  scope: string;
  timestamp: Date;
  data: unknown;
  result?: unknown;
  error?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  executionTime?: number;
}

export interface LogFilter {
  type?: string;
  scope?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export class AgentLogger {
  private logs: LogEntry[] = new Array<LogEntry>();
  private maxLogSize = 10000;

  /**
   * Log an action
   */
  logAction(action: AgentAction, executionTime?: number): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      actionId: action.id,
      type: action.type,
      scope: action.scope,
      timestamp: action.timestamp,
      data: action.data,
      result: action.executionResult,
      error: action.error,
      requiresApproval: action.requiresApproval,
      approvedBy: action.approvedBy,
      executionTime,
    };

    this.logs.push(entry);

    // Trim logs if too large
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    return entry;
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: LogFilter, limit = 100): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter((l) => l.type === filter.type);
      }
      if (filter.scope) {
        filtered = filtered.filter((l) => l.scope === filter.scope);
      }
      if (filter.startDate) {
        filtered = filtered.filter((l) => l.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter((l) => l.timestamp <= filter.endDate!);
      }
    }

    return filtered.slice(-limit);
  }

  /**
   * Get a log entry by action ID
   */
  getLogByActionId(actionId: string): LogEntry | null {
    return this.logs.find((l) => l.actionId === actionId) || null;
  }

  /**
   * Get logs for a specific scope
   */
  getLogsForScope(scope: string, limit = 100): LogEntry[] {
    return this.logs.filter((l) => l.scope === scope).slice(-limit);
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit = 100): LogEntry[] {
    return this.logs.filter((l) => l.error).slice(-limit);
  }

  /**
   * Get logs requiring approval
   */
  getApprovalLogs(limit = 100): LogEntry[] {
    return this.logs.filter((l) => l.requiresApproval).slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalActions: number;
    byType: Record<string, number>;
    byScope: Record<string, number>;
    errors: number;
    approvalsRequired: number;
    avgExecutionTime: number;
  } {
    const byType: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    let totalExecutionTime = 0;
    let executionTimeCount = 0;

    for (const log of this.logs) {
      byType[log.type] = (byType[log.type] || 0) + 1;
      byScope[log.scope] = (byScope[log.scope] || 0) + 1;

      if (log.executionTime) {
        totalExecutionTime += log.executionTime;
        executionTimeCount++;
      }
    }

    return {
      totalActions: this.logs.length,
      byType,
      byScope,
      errors: this.logs.filter((l) => l.error).length,
      approvalsRequired: this.logs.filter((l) => l.requiresApproval).length,
      avgExecutionTime: executionTimeCount > 0 ? totalExecutionTime / executionTimeCount : 0,
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a custom log entry
   */
  addCustomLog(entry: Omit<LogEntry, 'id'>): LogEntry {
    const fullEntry: LogEntry = {
      ...entry,
      id: this.generateId(),
    };

    this.logs.push(fullEntry);
    return fullEntry;
  }
}