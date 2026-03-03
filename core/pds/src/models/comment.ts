/**
 * Comment repository
 */

import { DatabaseConnection } from '../database/connection';

export interface Comment {
  id: string;
  did: string;
  targetType: 'video' | 'post';
  targetId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
}

export interface CreateCommentDto {
  id: string;
  did: string;
  targetType: Comment['targetType'];
  targetId: string;
  parentId?: string;
  content: string;
}

export class CommentRepository {
  constructor(private db: DatabaseConnection) {}

  create(dto: CreateCommentDto): Comment {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO comments (id, did, target_type, target_id, parent_id, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run(dto.id, dto.did, dto.targetType, dto.targetId, dto.parentId || null, dto.content, now);

    return {
      ...dto,
      parentId: dto.parentId || null,
      createdAt: new Date(now),
    };
  }

  findById(id: string): Comment | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM comments WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToComment(row) : null;
  }

  findByTarget(targetType: Comment['targetType'], targetId: string, limit = 50): Comment[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM comments
        WHERE target_type = ? AND target_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
    const rows = stmt.all(targetType, targetId, limit) as any[];
    return rows.map((row) => this.rowToComment(row));
  }

  findByParent(parentId: string, limit = 50): Comment[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(parentId, limit) as any[];
    return rows.map((row) => this.rowToComment(row));
  }

  findByDID(did: string, limit = 50, offset = 0): Comment[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM comments WHERE did = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(did, limit, offset) as any[];
    return rows.map((row) => this.rowToComment(row));
  }

  delete(id: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private rowToComment(row: any): Comment {
    return {
      id: row.id,
      did: row.did,
      targetType: row.target_type,
      targetId: row.target_id,
      parentId: row.parent_id,
      content: row.content,
      createdAt: new Date(row.created_at),
    };
  }
}