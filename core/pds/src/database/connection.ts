/**
 * Database connection for PDS
 * Using SQLite with better-sqlite3
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';
import { SCHEMA, SCHEMA_VERSION } from './schema';

export interface DatabaseConfig {
  path?: string;
  inMemory?: boolean;
  readonly?: boolean;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private db: Database.Database;

  private constructor(config: DatabaseConfig = {}) {
    const dbPath = config.inMemory
      ? ':memory:'
      : config.path || join(process.cwd(), 'skippster.db');

    this.db = new Database(dbPath, {
      readonly: config.readonly || false,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

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
    const row = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_info'").get();

    if (!row) {
      // New database, create schema
      this.db.exec(SCHEMA);
      this.db.prepare('CREATE TABLE schema_info (version INTEGER)').run();
      this.db.prepare('INSERT INTO schema_info (version) VALUES (?)').run(SCHEMA_VERSION);
    } else {
      // Check version
      const versionRow = this.db.prepare('SELECT version FROM schema_info').get() as { version: number } | undefined;
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

    this.db.prepare('UPDATE schema_info SET version = ?').run(toVersion);
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
  getDb(): Database.Database {
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
  backup(backupPath: string): Promise<any> {
    return this.db.backup(backupPath);
  }

  /**
   * Get database statistics
   */
  getStats(): {
    size: number;
    tables: string[];
    version: number;
  } {
    const tables = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const version = (this.db.prepare('SELECT version FROM schema_info').get() as { version: number })?.version || 0;

    const stats = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get() as {
      size: number;
    };

    return {
      size: stats?.size || 0,
      tables: tables.map((t) => t.name),
      version,
    };
  }
}