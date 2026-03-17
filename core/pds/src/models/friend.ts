/**
 * Friend repository
 * Handles bidirectional friend relationships
 */

import { DatabaseConnection } from '../database/connection';
import { UserRepository, User } from './user';

export interface Friend {
  did1: string;       // Requester
  did2: string;       // Target
  status: 'pending' | 'accepted';
  requestedAt: Date;
  acceptedAt: Date | null;
}

export interface CreateFriendDto {
  fromDid: string;
  toDid: string;
}

export class FriendRepository {
  private userRepo: UserRepository;

  constructor(private db: DatabaseConnection) {
    this.userRepo = new UserRepository(db);
  }

  /**
   * Create a friend request (pending status)
   * did1 is always the requester, did2 is the target
   */
  create(fromDid: string, toDid: string): Friend {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO friends (did1, did2, status, requested_at, accepted_at)
        VALUES (?, ?, 'pending', ?, NULL)
      `);

    stmt.run(fromDid, toDid, now);

    return {
      did1: fromDid,
      did2: toDid,
      status: 'pending',
      requestedAt: new Date(now),
      acceptedAt: null,
    };
  }

  /**
   * Accept a friend request
   * Changes status from 'pending' to 'accepted'
   */
  accept(fromDid: string, toDid: string): Friend | null {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        UPDATE friends
        SET status = 'accepted', accepted_at = ?
        WHERE did1 = ? AND did2 = ? AND status = 'pending'
      `);

    const result = stmt.run(now, fromDid, toDid);

    if (result.changes === 0) {
      return null;
    }

    return {
      did1: fromDid,
      did2: toDid,
      status: 'accepted',
      requestedAt: new Date(0), // We don't have the exact time, but it was already set
      acceptedAt: new Date(now),
    };
  }

  /**
   * Delete a friend relationship or decline a request
   * Works for both pending and accepted relationships
   */
  delete(did1: string, did2: string): boolean {
    // Try both directions since we want to remove the relationship regardless of who initiated
    const stmt = this.db
      .getDb()
      .prepare(`
        DELETE FROM friends
        WHERE (did1 = ? AND did2 = ?) OR (did1 = ? AND did2 = ?)
      `);
    const result = stmt.run(did1, did2, did2, did1);
    return result.changes > 0;
  }

  /**
   * Get all accepted friends for a user
   * Returns User objects for all friends
   */
  findFriends(did: string): User[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT
          CASE
            WHEN f.did1 = ? THEN f.did2
            ELSE f.did1
          END as friend_did
        FROM friends f
        WHERE (f.did1 = ? OR f.did2 = ?) AND f.status = 'accepted'
        ORDER BY f.accepted_at DESC
      `);
    const rows = stmt.all(did, did, did) as { friend_did: string }[];

    const friends: User[] = [];
    for (const row of rows) {
      const user = this.userRepo.findByDID(row.friend_did);
      if (user) {
        friends.push(user);
      }
    }
    return friends;
  }

  /**
   * Get pending friend requests received by a user
   * did2 is the target (current user), did1 is the requester
   */
  findPendingRequests(did: string): (Friend & { requester?: User })[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM friends
        WHERE did2 = ? AND status = 'pending'
        ORDER BY requested_at DESC
      `);
    const rows = stmt.all(did) as any[];

    return rows.map((row) => {
      const requester = this.userRepo.findByDID(row.did1);
      return {
        ...this.rowToFriend(row),
        requester: requester || undefined,
      };
    });
  }

  /**
   * Get friend requests sent by a user that are still pending
   * did1 is the requester (current user), did2 is the target
   */
  findSentRequests(did: string): (Friend & { target?: User })[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM friends
        WHERE did1 = ? AND status = 'pending'
        ORDER BY requested_at DESC
      `);
    const rows = stmt.all(did) as any[];

    return rows.map((row) => {
      const target = this.userRepo.findByDID(row.did2);
      return {
        ...this.rowToFriend(row),
        target: target || undefined,
      };
    });
  }

  /**
   * Check if two users are friends (accepted status)
   */
  isFriend(did1: string, did2: string): boolean {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT 1 FROM friends
        WHERE ((did1 = ? AND did2 = ?) OR (did1 = ? AND did2 = ?))
        AND status = 'accepted'
      `);
    const row = stmt.get(did1, did2, did2, did1);
    return !!row;
  }

  /**
   * Check if there's a pending friend request between two users
   */
  hasPendingRequest(did1: string, did2: string): boolean {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT 1 FROM friends
        WHERE ((did1 = ? AND did2 = ?) OR (did1 = ? AND did2 = ?))
        AND status = 'pending'
      `);
    const row = stmt.get(did1, did2, did2, did1);
    return !!row;
  }

  /**
   * Get the count of pending friend requests for a user
   */
  getPendingRequestCount(did: string): number {
    const stmt = this.db
      .getDb()
      .prepare('SELECT COUNT(*) as count FROM friends WHERE did2 = ? AND status = \'pending\'');
    const row = stmt.get(did) as { count: number };
    return row?.count || 0;
  }

  /**
   * Get the count of friends for a user
   */
  getFriendCount(did: string): number {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT COUNT(*) as count FROM friends
        WHERE (did1 = ? OR did2 = ?) AND status = 'accepted'
      `);
    const row = stmt.get(did, did) as { count: number };
    return row?.count || 0;
  }

  /**
   * Find a specific friend relationship between two users
   */
  findRelationship(did1: string, did2: string): Friend | null {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM friends
        WHERE (did1 = ? AND did2 = ?) OR (did1 = ? AND did2 = ?)
      `);
    const row = stmt.get(did1, did2, did2, did1) as any;
    return row ? this.rowToFriend(row) : null;
  }

  private rowToFriend(row: any): Friend {
    return {
      did1: row.did1,
      did2: row.did2,
      status: row.status,
      requestedAt: new Date(row.requested_at),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    };
  }
}