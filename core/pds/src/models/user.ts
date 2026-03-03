/**
 * User repository
 */

import { DatabaseConnection } from '../database/connection';

export interface User {
  did: string;
  handle: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  did: string;
  handle: string;
  publicKey: string;
}

export class UserRepository {
  constructor(private db: DatabaseConnection) {}

  create(dto: CreateUserDto): User {
    const now = Date.now();
    const stmt = this.db
      .getDb()
      .prepare(`
        INSERT INTO users (did, handle, public_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

    stmt.run(dto.did, dto.handle, dto.publicKey, now, now);

    return {
      ...dto,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  findByDID(did: string): User | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM users WHERE did = ?');
    const row = stmt.get(did) as any;
    return row ? this.rowToUser(row) : null;
  }

  findByHandle(handle: string): User | null {
    const stmt = this.db.getDb().prepare('SELECT * FROM users WHERE handle = ?');
    const row = stmt.get(handle) as any;
    return row ? this.rowToUser(row) : null;
  }

  update(did: string, updates: Partial<Omit<User, 'did' | 'createdAt'>>): User | null {
    const existing = this.findByDID(did);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.handle !== undefined) {
      fields.push('handle = ?');
      values.push(updates.handle);
    }
    if (updates.publicKey !== undefined) {
      fields.push('public_key = ?');
      values.push(updates.publicKey);
    }

    if (fields.length === 0) return existing;

    values.push(Date.now());
    values.push(did);

    const stmt = this.db.getDb().prepare(`
      UPDATE users SET ${fields.join(', ')}, updated_at = ? WHERE did = ?
    `);
    stmt.run(...values);

    return this.findByDID(did);
  }

  delete(did: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM users WHERE did = ?');
    const result = stmt.run(did);
    return result.changes > 0;
  }

  findAll(limit = 100, offset = 0): User[] {
    const stmt = this.db
      .getDb()
      .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset) as any[];
    return rows.map((row) => this.rowToUser(row));
  }

  private rowToUser(row: any): User {
    return {
      did: row.did,
      handle: row.handle,
      publicKey: row.public_key,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}