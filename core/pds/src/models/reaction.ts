/**
 * Reaction repository
 */

import { DatabaseConnection } from '../database/connection';

export interface Reaction {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  emoji: string;
  createdAt: Date;
}

export interface CreateReactionDto {
  id: string;
  did: string;
  targetType: Reaction['targetType'];
  targetId: string;
  emoji?: string;
}

export class ReactionRepository {
  constructor(private db: DatabaseConnection) {}

  create(dto: CreateReactionDto): Reaction {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT OR REPLACE INTO reactions (id, did, target_type, target_id, emoji, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

    stmt.run(dto.id, dto.did, dto.targetType, dto.targetId, dto.emoji || '👍', now);

    return {
      ...dto,
      emoji: dto.emoji || '👍',
      createdAt: new Date(now),
    };
  }

  findByTarget(targetType: Reaction['targetType'], targetId: string): Reaction[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM reactions WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(targetType, targetId) as any[];
    return rows.map((row) => this.rowToReaction(row));
  }

  findByTargetGrouped(targetType: Reaction['targetType'], targetId: string): Map<string, number> {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT emoji, COUNT(*) as count
        FROM reactions
        WHERE target_type = ? AND target_id = ?
        GROUP BY emoji
      `);
    const rows = stmt.all(targetType, targetId) as any[];
    return new Map(rows.map((r) => [r.emoji, r.count]));
  }

  findByDID(did: string, limit = 50): Reaction[] {
    const stmt = this.db.getDb().prepare('SELECT * FROM reactions WHERE did = ? ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(did, limit) as any[];
    return rows.map((row) => this.rowToReaction(row));
  }

  hasUserReacted(did: string, targetType: Reaction['targetType'], targetId: string): boolean {
    const stmt = this.db
      .getDb()
      .prepare('SELECT 1 FROM reactions WHERE did = ? AND target_type = ? AND target_id = ?');
    const row = stmt.get(did, targetType, targetId);
    return !!row;
  }

  getUserReaction(did: string, targetType: Reaction['targetType'], targetId: string): Reaction | null {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM reactions WHERE did = ? AND target_type = ? AND target_id = ?');
    const row = stmt.get(did, targetType, targetId) as any;
    return row ? this.rowToReaction(row) : null;
  }

  delete(did: string, targetType: Reaction['targetType'], targetId: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM reactions WHERE did = ? AND target_type = ? AND target_id = ?');
    const result = stmt.run(did, targetType, targetId);
    return result.changes > 0;
  }

  private rowToReaction(row: any): Reaction {
    return {
      id: row.id,
      did: row.did,
      targetType: row.target_type,
      targetId: row.target_id,
      emoji: row.emoji,
      createdAt: new Date(row.created_at),
    };
  }
}