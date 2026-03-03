/**
 * Subscription repository
 */

import { DatabaseConnection } from '../database/connection';

export interface Subscription {
  subscriberDID: string;
  creatorDID: string;
  createdAt: Date;
}

export class SubscriptionRepository {
  constructor(private db: DatabaseConnection) {}

  create(subscriberDID: string, creatorDID: string): Subscription {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO subscriptions (subscriber_did, creator_did, created_at)
        VALUES (?, ?, ?)
      `);

    stmt.run(subscriberDID, creatorDID, now);

    return {
      subscriberDID,
      creatorDID,
      createdAt: new Date(now),
    };
  }

  delete(subscriberDID: string, creatorDID: string): boolean {
    const stmt = this.db
      .getDb()
      .prepare('DELETE FROM subscriptions WHERE subscriber_did = ? AND creator_did = ?');
    const result = stmt.run(subscriberDID, creatorDID);
    return result.changes > 0;
  }

  findSubscribers(creatorDID: string, limit = 100, offset = 0): Subscription[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM subscriptions
        WHERE creator_did = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
    const rows = stmt.all(creatorDID, limit, offset) as any[];
    return rows.map((row) => this.rowToSubscription(row));
  }

  findSubscriptions(subscriberDID: string, limit = 100, offset = 0): Subscription[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM subscriptions
        WHERE subscriber_did = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
    const rows = stmt.all(subscriberDID, limit, offset) as any[];
    return rows.map((row) => this.rowToSubscription(row));
  }

  isSubscribed(subscriberDID: string, creatorDID: string): boolean {
    const stmt = this.db
      .getDb()
      .prepare('SELECT 1 FROM subscriptions WHERE subscriber_did = ? AND creator_did = ?');
    const row = stmt.get(subscriberDID, creatorDID);
    return !!row;
  }

  getSubscriberCount(creatorDID: string): number {
    const stmt = this.db.getDb().prepare('SELECT COUNT(*) as count FROM subscriptions WHERE creator_did = ?');
    const row = stmt.get(creatorDID) as { count: number };
    return row?.count || 0;
  }

  getSubscriptionCount(subscriberDID: string): number {
    const stmt = this.db.getDb().prepare('SELECT COUNT(*) as count FROM subscriptions WHERE subscriber_did = ?');
    const row = stmt.get(subscriberDID) as { count: number };
    return row?.count || 0;
  }

  private rowToSubscription(row: any): Subscription {
    return {
      subscriberDID: row.subscriber_did,
      creatorDID: row.creator_did,
      createdAt: new Date(row.created_at),
    };
  }
}