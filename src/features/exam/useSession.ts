import { useCallback, useMemo, useState } from 'react';
import type { Question } from '@/core/schemas';
import type { SessionSummary } from '@/core/exam/session';
import { summarise } from '@/core/exam/session';
import { useApp } from '@/app/AppContext';
import { finishSession, loadSession, type LoadedSession } from './sessions';

export function useQuestionIndex(): Map<string, Question> {
  const { library } = useApp();
  return useMemo(() => new Map(library.question.map((q) => [q.id, q])), [library.question]);
}

/** Loads a session once and keeps it in component state while the learner works through it. */
export function useSession(sessionId: string | null): {
  loaded: LoadedSession | null;
  setLoaded: (l: LoadedSession) => void;
  finish: () => void;
  summary: SessionSummary | null;
} {
  const app = useApp();
  const byId = useQuestionIndex();
  const [state, setState] = useState<{ id: string | null; loaded: LoadedSession | null }>(() => ({
    id: sessionId,
    loaded: sessionId ? loadSession(app, byId, sessionId) : null,
  }));
  // Reload when the session id changes (render-time reset, no effect needed).
  let current = state;
  if (state.id !== sessionId) {
    current = { id: sessionId, loaded: sessionId ? loadSession(app, byId, sessionId) : null };
    setState(current);
  }
  const loaded = current.loaded;

  const setLoaded = useCallback(
    (l: LoadedSession) => setState({ id: l.session.id, loaded: l }),
    [],
  );

  const finish = useCallback(() => {
    if (!loaded) return;
    finishSession(app, loaded);
    void app.flush();
    const reloaded = loadSession(app, byId, loaded.session.id);
    if (reloaded) setState({ id: reloaded.session.id, loaded: reloaded });
  }, [app, byId, loaded]);

  const summary = useMemo(
    () => (loaded?.session.finished_at ? summarise(loaded.questions, loaded.records) : null),
    [loaded],
  );
  return { loaded, setLoaded, finish, summary };
}
