/**
 * Notification repository
 * Handles user notifications for social interactions
 */

import { DatabaseConnection } from '../database/connection';
import { randomUUID } from 'crypto';

export interface Notification {
  id: string;
  toDid: string;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'comment' | 'mention' | 'video_comment' | 'video_like' | 'subscription' | 'system';
  title: string;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationDto {
  id?: string;
  toDid: string;
  type: Notification['type'];
  title: string;
  message: string;
  actionUrl?: string;
}

export class NotificationRepository {
  constructor(private db: DatabaseConnection) {}

  /**
   * Create a new notification
   */
  create(dto: CreateNotificationDto): Notification {
    const id = dto.id || randomUUID();
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO notifications (id, to_did, type, title, message, action_url, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `);

    stmt.run(id, dto.toDid, dto.type, dto.title, dto.message, dto.actionUrl || null, now);

    return {
      id,
      toDid: dto.toDid,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl || null,
      read: false,
      createdAt: new Date(now),
    };
  }

  /**
   * Find a notification by ID
   */
  findById(id: string): Notification | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM notifications WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToNotification(row) : null;
  }

  /**
   * Get all notifications for a user
   */
  findByDid(did: string, limit = 50, offset = 0): Notification[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM notifications
        WHERE to_did = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
    const rows = stmt.all(did, limit, offset) as any[];
    return rows.map((row) => this.rowToNotification(row));
  }

  /**
   * Get unread notifications for a user
   */
  findUnread(did: string): Notification[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM notifications
        WHERE to_did = ? AND read = 0
        ORDER BY created_at DESC
      `);
    const rows = stmt.all(did) as any[];
    return rows.map((row) => this.rowToNotification(row));
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): boolean {
    const stmt = this.db.getDb().prepare('UPDATE notifications SET read = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mark all notifications as read for a user
   * Returns the number of notifications marked as read
   */
  markAllAsRead(did: string): number {
    const stmt = this.db
      .getDb()
      .prepare('UPDATE notifications SET read = 1 WHERE to_did = ? AND read = 0');
    const result = stmt.run(did);
    return result.changes;
  }

  /**
   * Get the count of unread notifications for a user
   */
  getUnreadCount(did: string): number {
    const stmt = this.db
      .getDb()
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE to_did = ? AND read = 0');
    const row = stmt.get(did) as { count: number };
    return row?.count || 0;
  }

  /**
   * Delete a notification
   */
  delete(id: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM notifications WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Delete all notifications for a user
   */
  deleteAllForUser(did: string): number {
    const stmt = this.db.getDb().prepare('DELETE FROM notifications WHERE to_did = ?');
    const result = stmt.run(did);
    return result.changes;
  }

  /**
   * Create a friend request notification
   */
  createFriendRequestNotification(fromDid: string, toDid: string, fromHandle: string): Notification {
    return this.create({
      toDid,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${fromHandle} sent you a friend request`,
      actionUrl: `/friends?tab=requests`,
    });
  }

  /**
   * Create a friend accepted notification
   */
  createFriendAcceptedNotification(fromDid: string, toDid: string, fromHandle: string): Notification {
    return this.create({
      toDid,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${fromHandle} accepted your friend request`,
      actionUrl: `/profile/${fromDid}`,
    });
  }

  /**
   * Create a post like notification
   */
  createPostLikeNotification(fromDid: string, toDid: string, fromHandle: string, postId: string): Notification {
    return this.create({
      toDid,
      type: 'post_like',
      title: 'New Like',
      message: `${fromHandle} liked your post`,
      actionUrl: `/post/${postId}`,
    });
  }

  /**
   * Create a comment notification
   */
  createCommentNotification(fromDid: string, toDid: string, fromHandle: string, targetType: 'post' | 'video', targetId: string): Notification {
    return this.create({
      toDid,
      type: targetType === 'video' ? 'video_comment' : 'comment',
      title: 'New Comment',
      message: `${fromHandle} commented on your ${targetType}`,
      actionUrl: `/${targetType}/${targetId}`,
    });
  }

  /**
   * Create a mention notification
   */
  createMentionNotification(fromDid: string, toDid: string, fromHandle: string, postId: string): Notification {
    return this.create({
      toDid,
      type: 'mention',
      title: 'You were mentioned',
      message: `${fromHandle} mentioned you in a post`,
      actionUrl: `/post/${postId}`,
    });
  }

  private rowToNotification(row: any): Notification {
    return {
      id: row.id,
      toDid: row.to_did,
      type: row.type,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      read: row.read === 1,
      createdAt: new Date(row.created_at),
    };
  }
}