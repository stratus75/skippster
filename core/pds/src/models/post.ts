/**
 * Post repository
 */

import { DatabaseConnection } from '../database/connection';

export interface Post {
  id: string;
  did: string;
  content: string;
  mediaCids: string[] | null;
  videoId: string | null;
  privacy: 'public' | 'friends' | 'group' | 'specific';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostDto {
  id: string;
  did: string;
  content: string;
  mediaCids?: string[];
  videoId?: string;
  privacy?: Post['privacy'];
}

export class PostRepository {
  constructor(private db: DatabaseConnection) {}

  create(dto: CreatePostDto): Post {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO posts (id, did, content, media_cids, video_id, privacy, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run(
      dto.id,
      dto.did,
      dto.content,
      dto.mediaCids ? JSON.stringify(dto.mediaCids) : null,
      dto.videoId || null,
      dto.privacy || 'public',
      now,
      now
    );

    return {
      ...dto,
      mediaCids: dto.mediaCids || null,
      videoId: dto.videoId || null,
      privacy: dto.privacy || 'public',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  findById(id: string): Post | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM posts WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToPost(row) : null;
  }

  findByDID(did: string, limit = 50, offset = 0): Post[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM posts WHERE did = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(did, limit, offset) as any[];
    return rows.map((row) => this.rowToPost(row));
  }

  findFeed(did: string, limit = 50, offset = 0): Post[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT p.* FROM posts p
        WHERE p.did IN (
          SELECT CASE
            WHEN f.did1 = ? THEN f.did2
            ELSE f.did1
          END
          FROM friends f
          WHERE (f.did1 = ? OR f.did2 = ?) AND f.status = 'accepted'
        ) AND p.privacy IN ('public', 'friends')
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `);
    const rows = stmt.all(did, did, did, limit, offset) as any[];
    return rows.map((row) => this.rowToPost(row));
  }

  findPublic(limit = 50, offset = 0): Post[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM posts WHERE privacy = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all('public', limit, offset) as any[];
    return rows.map((row) => this.rowToPost(row));
  }

  update(id: string, updates: Partial<Omit<Post, 'id' | 'did' | 'createdAt'>>): Post | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mediaCids !== undefined) {
      fields.push('media_cids = ?');
      values.push(JSON.stringify(updates.mediaCids));
    }
    if (updates.privacy !== undefined) {
      fields.push('privacy = ?');
      values.push(updates.privacy);
    }

    if (fields.length === 0) return existing;

    values.push(Date.now());
    values.push(id);

    const stmt = this.db.getDb().prepare(`
      UPDATE posts SET ${fields.join(', ')}, updated_at = ? WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private rowToPost(row: any): Post {
    return {
      id: row.id,
      did: row.did,
      content: row.content,
      mediaCids: row.media_cids ? JSON.parse(row.media_cids) : null,
      videoId: row.video_id,
      privacy: row.privacy,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}