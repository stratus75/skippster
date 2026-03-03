/**
 * Action queue for AI Agent
 * Manages pending and executing actions
 */

import { AgentAction, ActionStatus } from './types';
import { generateId, signMessage } from '@skippster/identity';

export class ActionQueue {
  private queue: AgentAction[] = [];
  private history: AgentAction[] = [];
  private maxHistorySize = 1000;
  private processing = false;

  /**
   * Add an action to the queue
   */
  addAction(action: Omit<AgentAction, 'id' | 'signature' | 'timestamp' | 'status'>): AgentAction {
    const newAction: AgentAction = {
      ...action,
      id: generateId(),
      signature: '',
      timestamp: new Date(),
      status: ActionStatus.Pending,
    };

    // Sign the action (placeholder - would use actual signing)
    newAction.signature = `signed_${newAction.id}`;

    this.queue.push(newAction);
    return newAction;
  }

  /**
   * Get next action to execute
   */
  getNextAction(): AgentAction | null {
    if (this.processing) {
      return null;
    }

    // Get first pending action that doesn't require approval
    const index = this.queue.findIndex(
      (a) => a.status === ActionStatus.Pending && !a.requiresApproval
    );

    if (index === -1) {
      return null;
    }

    const action = this.queue[index];
    this.queue.splice(index, 1);
    return action;
  }

  /**
   * Get pending actions
   */
  getPendingActions(): AgentAction[] {
    return this.queue.filter((a) => a.status === ActionStatus.Pending);
  }

  /**
   * Get actions awaiting approval
   */
  getAwaitingApproval(): AgentAction[] {
    return this.queue.filter((a) => a.status === ActionStatus.Pending && a.requiresApproval);
  }

  /**
   * Approve an action
   */
  approveAction(actionId: string, approvedBy: string): boolean {
    const action = this.queue.find((a) => a.id === actionId);
    if (!action) {
      return false;
    }

    action.status = ActionStatus.Approved;
    action.approvedBy = approvedBy;
    return true;
  }

  /**
   * Decline an action
   */
  declineAction(actionId: string): boolean {
    const action = this.queue.find((a) => a.id === actionId);
    if (!action) {
      return false;
    }

    action.status = ActionStatus.Cancelled;
    return true;
  }

  /**
   * Execute an action
   */
  async executeAction(action: AgentAction, executor: (action: AgentAction) => Promise<unknown>): Promise<AgentAction> {
    action.status = ActionStatus.Executing;
    this.processing = true;

    try {
      const result = await executor(action);
      action.status = ActionStatus.Completed;
      action.executionResult = result;
    } catch (error) {
      action.status = ActionStatus.Failed;
      action.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.processing = false;
    this.addToHistory(action);
    return action;
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): AgentAction | null {
    return (
      this.queue.find((a) => a.id === actionId) ||
      this.history.find((a) => a.id === actionId) ||
      null
    );
  }

  /**
   * Get action history
   */
  getHistory(limit = 50): AgentAction[] {
    return this.history.slice(-limit);
  }

  /**
   * Add to history
   */
  private addToHistory(action: AgentAction): void {
    this.history.push(action);

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get queue stats
   */
  getStats(): {
    pending: number;
    awaitingApproval: number;
    executing: number;
    historySize: number;
  } {
    return {
      pending: this.queue.filter((a) => a.status === ActionStatus.Pending && !a.requiresApproval).length,
      awaitingApproval: this.queue.filter((a) => a.requiresApproval).length,
      executing: this.processing ? 1 : 0,
      historySize: this.history.length,
    };
  }
}