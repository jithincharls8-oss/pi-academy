import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import { MIGRATIONS, type Migration } from './migrations';

export type Row = Record<string, SqlValue>;
export type Params = readonly SqlValue[] | Record<string, SqlValue>;

/**
 * Thin typed wrapper over a sql.js Database. Every write marks the DB dirty and
 * notifies the persistence layer through `onChange`.
 */
export class AppDatabase {
  private listeners = new Set<() => void>();

  constructor(private readonly db: Database) {}

  static open(
    SQL: SqlJsStatic,
    bytes?: Uint8Array | null,
    migrations: readonly Migration[] = MIGRATIONS,
  ): AppDatabase {
    const db = bytes && bytes.length > 0 ? new SQL.Database(bytes) : new SQL.Database();
    db.run('PRAGMA foreign_keys = ON;');
    const app = new AppDatabase(db);
    app.migrate(migrations);
    return app;
  }

  /** Apply pending migrations inside a transaction each. Returns versions applied. */
  migrate(migrations: readonly Migration[]): number[] {
    this.db.run(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);',
    );
    const done = new Set(
      this.all<{ version: number }>('SELECT version FROM schema_migrations').map((r) => r.version),
    );
    const applied: number[] = [];
    for (const m of [...migrations].sort((a, b) => a.version - b.version)) {
      if (done.has(m.version)) continue;
      this.transaction(() => {
        this.db.run(m.sql);
        this.db.run('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [
          m.version,
          m.name,
          new Date().toISOString(),
        ]);
      });
      applied.push(m.version);
    }
    if (applied.length) this.emit();
    return applied;
  }

  schemaVersion(): number {
    const row = this.get<{ v: number | null }>('SELECT MAX(version) AS v FROM schema_migrations');
    return row?.v ?? 0;
  }

  all<T extends object = Row>(sql: string, params: Params = []): T[] {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params as SqlValue[]);
      const out: T[] = [];
      while (stmt.step()) out.push(stmt.getAsObject() as T);
      return out;
    } finally {
      stmt.free();
    }
  }

  get<T extends object = Row>(sql: string, params: Params = []): T | undefined {
    return this.all<T>(sql, params)[0];
  }

  run(sql: string, params: Params = []): void {
    this.db.run(sql, params as SqlValue[]);
    this.emit();
  }

  /** Run `fn` in a transaction; rolls back on throw. Nested calls join the outer transaction. */
  transaction<T>(fn: () => T): T {
    if (this.inTx) return fn();
    this.inTx = true;
    this.db.run('BEGIN');
    try {
      const result = fn();
      this.db.run('COMMIT');
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    } finally {
      this.inTx = false;
      this.emit();
    }
  }
  private inTx = false;

  export(): Uint8Array {
    return this.db.export();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    if (this.inTx) return;
    for (const l of this.listeners) l();
  }

  close(): void {
    this.db.close();
  }
}
