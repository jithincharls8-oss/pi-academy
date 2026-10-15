import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Services } from './bootstrap';
import type { Library } from '@/db/contentRepo';
import { SearchIndex, buildSearchDocs } from '@/content/search';
import { applyTheme, parseSettings, type Settings } from './settings';

interface AppState extends Services {
  library: Library;
  search: SearchIndex;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** re-read content after admin edits or imports */
  reloadLibrary: () => void;
  /** increments on every database write so views re-read learner data */
  rev: number;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ services, children }: { services: Services; children: ReactNode }) {
  const [library, setLibrary] = useState(() => services.content.library());
  const [rev, setRev] = useState(0);
  const [settings, setSettings] = useState(() =>
    parseSettings(services.content.getMeta('settings')),
  );

  useEffect(() => {
    let scheduled = false;
    return services.db.onChange(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        setRev((r) => r + 1);
      });
    });
  }, [services.db]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (): void => applyTheme(settings, mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings]);

  const settingsRef = useRef(settings);
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      setSettings(next);
      services.content.setMeta('settings', JSON.stringify(next));
      void services.flush();
    },
    [services],
  );

  const reloadLibrary = useCallback(
    () => setLibrary(services.content.library()),
    [services.content],
  );
  const search = useMemo(() => new SearchIndex(buildSearchDocs(library)), [library]);

  const value = useMemo<AppState>(
    () => ({ ...services, library, search, settings, updateSettings, reloadLibrary, rev }),
    [services, library, search, settings, updateSettings, reloadLibrary, rev],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
