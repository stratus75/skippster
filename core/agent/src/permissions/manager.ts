/**
 * Permission manager for AI Agent
 * Handles scope-based permissions and limits
 */

import {
  Permission,
  PermissionScope,
  PermissionLimits,
  PermissionRequest,
  PermissionRequestStatus,
} from './types';
import { generateId } from '@skippster/identity';

export class PermissionManager {
  private permissions: Map<string, Permission> = new Map();
  private requests: Map<string, PermissionRequest> = new Map();
  private actionCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private did: string;

  constructor(did: string) {
    this.did = did;
  }

  /**
   * Grant a permission
   */
  grantPermission(
    scope: PermissionScope,
    limits?: PermissionLimits
  ): Permission {
    const permission: Permission = {
      scope,
      granted: true,
      grantedAt: new Date(),
      limits,
    };

    this.permissions.set(scope, permission);
    return permission;
  }

  /**
   * Revoke a permission
   */
  revokePermission(scope: PermissionScope): boolean {
    const permission = this.permissions.get(scope);
    if (!permission) {
      return false;
    }

    permission.granted = false;
    permission.revokedAt = new Date();
    this.permissions.set(scope, permission);
    return true;
  }

  /**
   * Check if a permission is granted
   */
  hasPermission(scope: PermissionScope): boolean {
    const permission = this.permissions.get(scope);
    return permission?.granted === true;
  }

  /**
   * Get a permission
   */
  getPermission(scope: PermissionScope): Permission | null {
    return this.permissions.get(scope) || null;
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Check if an action is allowed based on permissions and limits
   */
  async checkActionAllowed(
    scope: PermissionScope,
    action: string,
    data?: unknown,
    targetDID?: string
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
    const permission = this.permissions.get(scope);

    if (!permission || !permission.granted) {
      return { allowed: false, reason: `Permission ${scope} not granted` };
    }

    // Check approval requirement
    if (permission.limits?.requireApproval) {
      return { allowed: false, requiresApproval: true };
    }

    // Check allowed targets
    if (permission.limits?.allowedTargets && targetDID) {
      if (!permission.limits.allowedTargets.includes(targetDID)) {
        return { allowed: false, reason: 'Target not in allowed list' };
      }
    }

    // Check action limits
    const key = `${this.did}:${scope}`;
    const now = Date.now();
    const record = this.actionCounts.get(key);

    if (record) {
      // Check if reset time has passed
      if (now > record.resetTime) {
        // Reset counter
        this.actionCounts.set(key, { count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
      } else {
        // Check daily limit
        const maxPerDay = permission.limits?.maxActionsPerDay || 100;
        if (record.count >= maxPerDay) {
          return { allowed: false, reason: 'Daily action limit reached' };
        }
        record.count++;
      }
    } else {
      this.actionCounts.set(key, { count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
    }

    // Check amount limits for payments
    if (data && typeof data === 'object' && 'amount' in data) {
      const amount = (data as any).amount;
      const maxAmount = permission.limits?.maxAmount;

      if (maxAmount && amount > maxAmount) {
        return { allowed: false, reason: 'Amount exceeds limit' };
      }
    }

    return { allowed: true };
  }

  /**
   * Create a permission request
   */
  createPermissionRequest(
    scope: PermissionScope,
    action: string,
    data?: unknown,
    limits?: PermissionLimits,
    expiresAt?: Date
  ): PermissionRequest {
    const request: PermissionRequest = {
      id: generateId(),
      scope,
      action,
      data,
      limits,
      createdAt: new Date(),
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: PermissionRequestStatus.Pending,
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Approve a permission request
   */
  approveRequest(requestId: string): PermissionRequest | null {
    const request = this.requests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = PermissionRequestStatus.Approved;
    request.approvedAt = new Date();

    // Grant the permission if not already granted
    if (!this.hasPermission(request.scope)) {
      this.grantPermission(request.scope, request.limits);
    }

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * Decline a permission request
   */
  declineRequest(requestId: string): PermissionRequest | null {
    const request = this.requests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = PermissionRequestStatus.Declined;
    request.declinedAt = new Date();
    this.requests.set(requestId, request);
    return request;
  }

  /**
   * Get a permission request
   */
  getRequest(requestId: string): PermissionRequest | null {
    return this.requests.get(requestId) || null;
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): PermissionRequest[] {
    return Array.from(this.requests.values()).filter(
      (r) => r.status === PermissionRequestStatus.Pending
    );
  }

  /**
   * Check and expire requests
   */
  checkExpiredRequests(): PermissionRequest[] {
    const now = Date.now();
    const expired: PermissionRequest[] = [];

    for (const [id, request] of this.requests) {
      if (
        request.status === PermissionRequestStatus.Pending &&
        request.expiresAt &&
        request.expiresAt.getTime() < now
      ) {
        request.status = PermissionRequestStatus.Expired;
        this.requests.set(id, request);
        expired.push(request);
      }
    }

    return expired;
  }

  /**
   * Clear expired requests
   */
  clearExpiredRequests(): void {
    const expired = this.checkExpiredRequests();
    for (const request of expired) {
      this.requests.delete(request.id);
    }
  }

  /**
   * Get action count for a scope
   */
  getActionCount(scope: PermissionScope): number {
    const key = `${this.did}:${scope}`;
    const record = this.actionCounts.get(key);
    return record?.count || 0;
  }

  /**
   * Reset action count for a scope
   */
  resetActionCount(scope: PermissionScope): void {
    const key = `${this.did}:${scope}`;
    this.actionCounts.delete(key);
  }

  /**
   * Get all action counts
   */
  getAllActionCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const [key, record] of this.actionCounts) {
      counts.set(key, record.count);
    }
    return counts;
  }

  /**
   * Export permissions as JSON
   */
  exportPermissions(): string {
    const data = {
      did: this.did,
      permissions: Array.from(this.permissions.entries()),
      actionCounts: Array.from(this.actionCounts.entries()),
    };
    return JSON.stringify(data);
  }

  /**
   * Import permissions from JSON
   */
  importPermissions(json: string): void {
    const data = JSON.parse(json);
    this.permissions = new Map(data.permissions);
    this.actionCounts = new Map(data.actionCounts.map(([key, value]: [string, any]) => {
      return [key, { count: value.count, resetTime: value.resetTime }];
    }));
  }

  /**
   * Clear all permissions
   */
  clearAll(): void {
    this.permissions.clear();
    this.requests.clear();
    this.actionCounts.clear();
  }
}