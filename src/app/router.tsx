import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Link, type RouteObject } from 'react-router-dom';
import { Shell } from './Shell';
import { EmptyState } from '@/components/ui/misc';

const page = (load: () => Promise<{ default: () => ReactNode }>): ReactNode => {
  const C = lazy(load);
  return (
    <Suspense
      fallback={
        <div className="p-8 text-fg-muted" role="status">
          Loading…
        </div>
      }
    >
      <C />
    </Suspense>
  );
};

const lz = <K extends string>(
  p: Promise<Record<K, () => ReactNode>>,
  name: K,
): Promise<{ default: () => ReactNode }> => p.then((m) => ({ default: m[name] }));

/** Feature routes. A path also enables its nav entry. */
export const FEATURE_ROUTES: RouteObject[] = [
  {
    index: true,
    element: page(() => lz(import('@/features/dashboard/DashboardPage'), 'DashboardPage')),
  },
  { path: 'learn', element: page(() => lz(import('@/features/learn/LearnPage'), 'LearnPage')) },
  {
    path: 'learn/:id',
    element: page(() => lz(import('@/features/learn/LessonPage'), 'LessonPage')),
  },
  { path: 'search', element: page(() => lz(import('@/features/search/SearchPage'), 'SearchPage')) },
  {
    path: 'settings',
    element: page(() => lz(import('@/features/settings/SettingsPage'), 'SettingsPage')),
  },
];

function NotFound() {
  return (
    <EmptyState
      title="That page does not exist."
      action={
        <Link className="text-primary underline" to="/">
          Go to the dashboard
        </Link>
      }
    />
  );
}

export function enabledPaths(routes: RouteObject[]): Set<string> {
  const s = new Set<string>();
  for (const r of routes) s.add(r.index ? '/' : `/${r.path ?? ''}`);
  return s;
}

export function createRouter() {
  return createHashRouter([
    {
      path: '/',
      element: <Shell enabled={enabledPaths(FEATURE_ROUTES)} />,
      children: [...FEATURE_ROUTES, { path: '*', element: <NotFound /> }],
    },
  ]);
}
