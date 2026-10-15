import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { ContentBundleSchema, type ContentBundle } from '@/core/schemas';
import { AppDatabase } from '@/db/database';
import { ContentRepo } from '@/db/contentRepo';
import { UserRepo } from '@/db/userRepo';
import { autosave, defaultPersistence, type Persistence } from '@/db/persistence';

export interface Services {
  db: AppDatabase;
  content: ContentRepo;
  user: UserRepo;
  persistence: Persistence;
  flush: () => Promise<void>;
  seeded: boolean;
}

export async function loadBundle(fetchImpl: typeof fetch = fetch): Promise<ContentBundle> {
  const res = await fetchImpl('./content/bundle.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load the content bundle (HTTP ${res.status}).`);
  const parsed = ContentBundleSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(
      `The content bundle is invalid: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`,
    );
  }
  return parsed.data;
}

export async function bootstrap(): Promise<Services> {
  const persistence = defaultPersistence();
  const [SQL, bytes, bundle] = await Promise.all([
    initSqlJs({ locateFile: () => wasmUrl }),
    // A failed load must not fall through to an empty database: the first flush would
    // overwrite the learner's saved data. Let startup fail so "Try again" can recover.
    persistence.load(),
    loadBundle(),
  ]);
  const db = AppDatabase.open(SQL, bytes);
  const content = new ContentRepo(db);
  const seeded = content.seed(bundle);
  const saver = autosave(
    (fn) => db.onChange(fn),
    () => db.export(),
    persistence,
    400,
    (e) => {
      console.error('Saving progress failed', e);
    },
  );
  if (seeded || !bytes) await saver.flush();
  const flush = saver.flush;
  window.addEventListener('pagehide', () => void flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  return { db, content, user: new UserRepo(db), persistence, flush, seeded };
}
