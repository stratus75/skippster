/**
 * Video repository
 */

import { DatabaseConnection } from '../database/connection';

export interface Video {
  id: string;
  did: string;
  title: string;
  description: string | null;
  thumbnailCid: string | null;
  magnetLink: string;
  duration: number;
  views: number;
  tags: string[] | null;
  monetizationType: 'free' | 'donations' | 'payperview' | 'subscription';
  price: number | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoDto {
  id: string;
  did: string;
  title: string;
  description?: string;
  thumbnailCid?: string;
  magnetLink: string;
  duration: number;
  tags?: string[];
  monetizationType?: Video['monetizationType'];
  price?: number;
  currency?: string;
}

export class VideoRepository {
  constructor(private db: DatabaseConnection) {}

  create(dto: CreateVideoDto): Video {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO videos (id, did, title, description, thumbnail_cid, magnet_link,
                           duration, views, tags, monetization_type, price, currency,
                           created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run(
      dto.id,
      dto.did,
      dto.title,
      dto.description || null,
      dto.thumbnailCid || null,
      dto.magnetLink,
      dto.duration,
      0,
      dto.tags ? JSON.stringify(dto.tags) : null,
      dto.monetizationType || 'free',
      dto.price || null,
      dto.currency || null,
      now,
      now
    );

    return {
      ...dto,
      tags: dto.tags || null,
      description: dto.description || null,
      thumbnailCid: dto.thumbnailCid || null,
      views: 0,
      monetizationType: dto.monetizationType || 'free',
      price: dto.price || null,
      currency: dto.currency || null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  findById(id: string): Video | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM videos WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToVideo(row) : null;
  }

  
  findAll(limit = 50, offset = 0): Video[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM videos ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset) as any[];
    return rows.map((row) => this.rowToVideo(row));
  }

  findByDID(did: string, limit = 50, offset = 0): Video[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM videos WHERE did = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(did, limit, offset) as any[];
    return rows.map((row) => this.rowToVideo(row));
  }

  findTrending(limit = 20, offset = 0): Video[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT v.*, COUNT(s.creator_did) as subscriber_count
        FROM videos v
        LEFT JOIN subscriptions s ON v.did = s.creator_did
        WHERE v.created_at > ?
        GROUP BY v.id
        ORDER BY (v.views * 10 + subscriber_count) DESC
        LIMIT ? OFFSET ?
      `);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const rows = stmt.all(thirtyDaysAgo, limit, offset) as any[];
    return rows.map((row) => this.rowToVideo(row));
  }

  findRecommended(did: string, limit = 20): Video[] {
    // Find videos from subscriptions first, then other popular videos
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT v.*, 1 as priority FROM videos v
        WHERE v.did IN (SELECT creator_did FROM subscriptions WHERE subscriber_did = ?)
        UNION
        SELECT v.*, 0 as priority FROM videos v
        WHERE v.did NOT IN (SELECT creator_did FROM subscriptions WHERE subscriber_did = ?)
        ORDER BY priority DESC, v.created_at DESC
        LIMIT ?
      `);
    const rows = stmt.all(did, did, limit) as any[];
    return rows.map((row) => this.rowToVideo(row));
  }

  search(query: string, limit = 20): Video[] {
    const stmt = this.db
      .getDb()
      .prepare(`
        SELECT * FROM videos
        WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit) as any[];
    return rows.map((row) => this.rowToVideo(row));
  }

  incrementViews(id: string): number {
    const stmt = this.db.getDb().prepare('UPDATE videos SET views = views + 1 WHERE id = ?');
    stmt.run(id);
    const video = this.findById(id);
    return video?.views || 0;
  }

  update(id: string, updates: Partial<Omit<Video, 'id' | 'did' | 'createdAt'>>): Video | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.thumbnailCid !== undefined) {
      fields.push('thumbnail_cid = ?');
      values.push(updates.thumbnailCid);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.monetizationType !== undefined) {
      fields.push('monetization_type = ?');
      values.push(updates.monetizationType);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }
    if (updates.currency !== undefined) {
      fields.push('currency = ?');
      values.push(updates.currency);
    }

    if (fields.length === 0) return existing;

    values.push(Date.now());
    values.push(id);

    const stmt = this.db.getDb().prepare(`
      UPDATE videos SET ${fields.join(', ')}, updated_at = ? WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM videos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private rowToVideo(row: any): Video {
    return {
      id: row.id,
      did: row.did,
      title: row.title,
      description: row.description,
      thumbnailCid: row.thumbnail_cid,
      magnetLink: row.magnet_link,
      duration: row.duration,
      views: row.views,
      tags: row.tags ? JSON.parse(row.tags) : null,
      monetizationType: row.monetization_type,
      price: row.price,
      currency: row.currency,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}