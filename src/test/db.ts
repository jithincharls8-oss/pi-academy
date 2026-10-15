import initSqlJs from 'sql.js';
import { AppDatabase } from '@/db/database';

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

/** Fresh migrated in-memory database for tests. */
export async function testDb(bytes?: Uint8Array): Promise<AppDatabase> {
  sqlPromise ??= initSqlJs();
  return AppDatabase.open(await sqlPromise, bytes);
}
