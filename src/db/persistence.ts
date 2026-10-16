export interface Persistence {
  readonly kind: 'tauri' | 'indexeddb' | 'memory';
  load(): Promise<Uint8Array | null>;
  save(bytes: Uint8Array): Promise<void>;
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const DB_FILE = 'pi-academy.sqlite';

/** Desktop: the SQLite file lives in the OS app-data folder. Writes go to a temp file and are renamed. */
export function tauriPersistence(): Persistence {
  return {
    kind: 'tauri',
    async load() {
      const fs = await import('@tauri-apps/plugin-fs');
      if (!(await fs.exists(DB_FILE, { baseDir: fs.BaseDirectory.AppData }))) return null;
      return fs.readFile(DB_FILE, { baseDir: fs.BaseDirectory.AppData });
    },
    async save(bytes) {
      const fs = await import('@tauri-apps/plugin-fs');
      await fs
        .mkdir('', { baseDir: fs.BaseDirectory.AppData, recursive: true })
        .catch(() => undefined);
      const tmp = `${DB_FILE}.tmp`;
      await fs.writeFile(tmp, bytes, { baseDir: fs.BaseDirectory.AppData });
      await fs.rename(tmp, DB_FILE, {
        oldPathBaseDir: fs.BaseDirectory.AppData,
        newPathBaseDir: fs.BaseDirectory.AppData,
      });
    },
  };
}

const IDB_NAME = 'pi-academy';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'main';

let idbConnection: Promise<IDBDatabase> | null = null;

/** One long-lived connection, so a save started while the page is closing can finish quickly. */
function openIdb(): Promise<IDBDatabase> {
  idbConnection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  }).catch((e: unknown) => {
    idbConnection = null;
    throw e;
  });
  return idbConnection;
}

/** Browser/PWA: the SQLite image is stored as one IndexedDB value. */
export function indexedDbPersistence(): Persistence {
  return {
    kind: 'indexeddb',
    async load() {
      const db = await openIdb();
      return new Promise((resolve, reject) => {
        const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => {
          const v: unknown = req.result;
          resolve(
            v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : null,
          );
        };
        req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
      });
    },
    async save(bytes) {
      const db = await openIdb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
      });
    },
  };
}

export function memoryPersistence(): Persistence {
  let stored: Uint8Array | null = null;
  return {
    kind: 'memory',
    load: async () => stored,
    save: async (b) => {
      stored = b;
    },
  };
}

export function defaultPersistence(): Persistence {
  if (isTauri()) return tauriPersistence();
  if (typeof indexedDB !== 'undefined') return indexedDbPersistence();
  return memoryPersistence();
}

/** Debounced autosave. Returns flush() for shutdown paths. */
export function autosave(
  onChange: (fn: () => void) => () => void,
  exportBytes: () => Uint8Array,
  p: Persistence,
  delayMs = 400,
  onError: (e: unknown) => void = () => undefined,
): { flush: () => Promise<void>; stop: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = true;
  let saving: Promise<void> = Promise.resolve();
  const flush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    // Nothing changed since the last export (e.g. a tab switch): skip the full DB write.
    if (!dirty) return saving;
    dirty = false;
    // Export synchronously so the latest state is captured even if the page is unloading.
    const bytes = exportBytes();
    saving = saving
      .then(() => p.save(bytes))
      .catch((e: unknown) => {
        dirty = true; // retry on the next flush
        onError(e);
      });
    await saving;
  };
  const unsubscribe = onChange(() => {
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delayMs);
  });
  return {
    flush,
    stop: () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    },
  };
}
