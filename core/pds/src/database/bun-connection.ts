/**
 * Database connection for PDS - Bun SQLite version
 * Using bun:sqlite (built-in, no native module compilation needed)
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';
import { SCHEMA, SCHEMA_VERSION } from './schema.js';

export interface DatabaseConfig {
  path?: string;
  inMemory?: boolean;
  readonly?: boolean;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private db: Database;

  private constructor(config: DatabaseConfig = {}) {
    const dbPath = config.inMemory
      ? ':memory:'
      : config.path || join(process.cwd(), 'skippster.db');

    // bun:sqlite uses different options
    if (config.readonly) {
      this.db = new Database(dbPath, { readonly: true });
    } else {
      this.db = new Database(dbPath);
    }

    // Enable WAL mode for better concurrency
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA synchronous = NORMAL');

    // Initialize schema
    this.initializeSchema();
  }

  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  static createInstance(config: DatabaseConfig): DatabaseConnection {
    return new DatabaseConnection(config);
  }

  private initializeSchema(): void {
    // Check if schema exists
    const row = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_info'").get();

    if (!row) {
      // New database, create schema
      this.db.exec(SCHEMA);
      this.db.run('CREATE TABLE schema_info (version INTEGER)');
      this.db.run('INSERT INTO schema_info (version) VALUES (?)', [SCHEMA_VERSION]);
    } else {
      // Check version
      const versionRow = this.db.query('SELECT version FROM schema_info').get() as { version: number } | null;
      const version = versionRow?.version || 0;

      if (version < SCHEMA_VERSION) {
        // Migration needed
        this.migrateSchema(version, SCHEMA_VERSION);
      }
    }
  }

  private migrateSchema(fromVersion: number, toVersion: number): void {
    // Handle migrations between versions
    for (let v = fromVersion + 1; v <= toVersion; v++) {
      this.runMigration(v);
    }

    this.db.run('UPDATE schema_info SET version = ?', [toVersion]);
  }

  private runMigration(version: number): void {
    console.log(`Running migration to version ${version}`);

    switch (version) {
      case 2:
        // Example migration for version 2
        // this.db.exec('ALTER TABLE videos ADD COLUMN featured INTEGER DEFAULT 0');
        break;
      // Add more migrations as needed
    }
  }

  /**
   * Get raw database instance
   */
  getDb(): Database {
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    DatabaseConnection.instance = null;
  }

  /**
   * Execute a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Backup database
   */
  async backup(backupPath: string): Promise<void> {
    // Bun:sqlite uses different backup method
    this.db.run(`VACUUM INTO ?`, [backupPath]);
  }

  /**
   * Get database statistics
   */
  getStats(): {
    size: number;
    tables: string[];
    version: number;
  } {
    const tables = this.db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];

    const versionRow = this.db.query('SELECT version FROM schema_info').get() as { version: number } | null;
    const version = versionRow?.version || 0;

    return {
      size: 0, // Bun doesn't easily provide this
      tables: tables.map((t) => t.name),
      version,
    };
  }
}