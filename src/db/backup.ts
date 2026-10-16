import { z } from 'zod';
import type { AppDatabase } from './database';
import { USER_TABLES, type UserTable } from './migrations';

const Cell = z.union([z.string().max(1_000_000), z.number(), z.null()]);
const RowSchema = z.record(z.string().regex(/^[a-z_]+$/), Cell);

export const BackupSchema = z.object({
  format: z.literal('pi-academy-backup'),
  formatVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  schemaVersion: z.number().int().min(1),
  tables: z.object(
    Object.fromEntries(USER_TABLES.map((t) => [t, z.array(RowSchema).max(500_000)])) as Record<
      UserTable,
      z.ZodArray<typeof RowSchema>
    >,
  ),
  userContent: z
    .array(
      z.object({
        kind: z.string().regex(/^[a-zA-Z]+$/),
        id: z.string().max(200),
        data: z.string().max(1_000_000),
        deleted: z.number().int().min(0).max(1),
      }),
    )
    .max(100_000),
});
export type Backup = z.infer<typeof BackupSchema>;

export function createBackup(db: AppDatabase): Backup {
  const tables = Object.fromEntries(
    USER_TABLES.map((t) => [t, db.all(`SELECT * FROM ${t}`)]),
  ) as Backup['tables'];
  return {
    format: 'pi-academy-backup',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    schemaVersion: db.schemaVersion(),
    tables,
    userContent: db.all<{ kind: string; id: string; data: string; deleted: number }>(
      "SELECT kind, id, data, deleted FROM content_items WHERE origin = 'user'",
    ),
  };
}

function columnsOf(db: AppDatabase, table: UserTable): Set<string> {
  return new Set(db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name));
}

/**
 * Replace all learner data with the backup. Validates the shape with zod and every column
 * name against the live schema (column names are interpolated, so this also blocks injection).
 * Everything happens in one transaction: a bad row leaves existing data untouched.
 */
export function restoreBackup(
  db: AppDatabase,
  input: unknown,
): { ok: true; rows: number } | { ok: false; error: string } {
  const parsed = BackupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Not a valid PI Academy backup: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
    };
  }
  const backup = parsed.data;
  if (backup.schemaVersion > db.schemaVersion()) {
    return {
      ok: false,
      error: 'This backup was made by a newer version of PI Academy. Update the app first.',
    };
  }
  let rows = 0;
  try {
    db.transaction(() => {
      for (const table of USER_TABLES) {
        const cols = columnsOf(db, table);
        db.run(`DELETE FROM ${table}`);
        for (const row of backup.tables[table]) {
          const keys = Object.keys(row);
          for (const k of keys) if (!cols.has(k)) throw new Error(`unknown column ${table}.${k}`);
          db.run(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
            keys.map((k) => row[k] ?? null),
          );
          rows += 1;
        }
      }
      db.run("DELETE FROM content_items WHERE origin = 'user'");
      const now = new Date().toISOString();
      for (const c of backup.userContent) {
        db.run(
          "INSERT INTO content_items (kind, id, origin, data, deleted, updated_at) VALUES (?, ?, 'user', ?, ?, ?)",
          [c.kind, c.id, c.data, c.deleted, now],
        );
        rows += 1;
      }
    });
  } catch (e) {
    return { ok: false, error: `Restore failed, nothing was changed: ${(e as Error).message}` };
  }
  return { ok: true, rows };
}

/** Clear learner data. `includeUserContent` also drops admin-authored content. */
export function resetUserData(db: AppDatabase, includeUserContent: boolean): void {
  db.transaction(() => {
    for (const t of USER_TABLES) db.run(`DELETE FROM ${t}`);
    if (includeUserContent) db.run("DELETE FROM content_items WHERE origin = 'user'");
  });
}
