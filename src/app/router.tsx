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
  {
    path: 'exam/daily',
    element: page(() => lz(import('@/features/exam/DailyExamPage'), 'DailyExamPage')),
  },
  {
    path: 'practice',
    element: page(() => lz(import('@/features/exam/PracticePage'), 'PracticePage')),
  },
  {
    path: 'practice/session/:id',
    element: page(() => lz(import('@/features/exam/SessionPage'), 'SessionPage')),
  },
  {
    path: 'practice/question/:id',
    element: page(() => lz(import('@/features/exam/QuestionPage'), 'QuestionPage')),
  },
  {
    path: 'sandbox',
    element: page(() =>
      import('@/features/sandbox/SandboxPage').then((m) => ({
        default: () => <m.SandboxPage enabled={(to) => enabledPaths(FEATURE_ROUTES).has(to)} />,
      })),
    ),
  },
  {
    path: 'sandbox/explorer',
    element: page(() => lz(import('@/features/sandbox/explorer/ExplorerPage'), 'ExplorerPage')),
  },
  {
    path: 'sandbox/smt',
    element: page(() => lz(import('@/features/sandbox/smt/SmtPage'), 'SmtPage')),
  },
  {
    path: 'sandbox/vision',
    element: page(() => lz(import('@/features/sandbox/vision/VisionPage'), 'VisionPage')),
  },
  {
    path: 'sandbox/webapi',
    element: page(() => lz(import('@/features/sandbox/webapi/WebApiPage'), 'WebApiPage')),
  },
  {
    path: 'sandbox/compression',
    element: page(() =>
      lz(import('@/features/sandbox/compression/CompressionLabPage'), 'CompressionLabPage'),
    ),
  },
  {
    path: 'sandbox/datalink',
    element: page(() => lz(import('@/features/sandbox/datalink/DataLinkPage'), 'DataLinkPage')),
  },
  {
    path: 'reference',
    element: page(() => lz(import('@/features/reference/ReferencePage'), 'ReferencePage')),
  },
  ...['reference/glossary', 'reference/glossary/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/GlossaryPage'), 'GlossaryPage')),
  })),
  ...['reference/functions/:kind', 'reference/functions/:kind/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/FunctionsPage'), 'FunctionsPage')),
  })),
  ...['reference/web-api', 'reference/web-api/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/SimpleRefPages'), 'WebApiRefPage')),
  })),
  ...['reference/commands', 'reference/commands/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/SimpleRefPages'), 'CommandsPage')),
  })),
  ...['reference/errors', 'reference/errors/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/SimpleRefPages'), 'ErrorsPage')),
  })),
  ...['reference/decisions', 'reference/decisions/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/reference/DecisionTreesPage'), 'DecisionTreesPage')),
  })),
  {
    path: 'reference/tag-names',
    element: page(() => lz(import('@/features/reference/ToolsPages'), 'TagNamePage')),
  },
  {
    path: 'reference/sizing',
    element: page(() => lz(import('@/features/reference/ToolsPages'), 'SizingPage')),
  },
  {
    path: 'planner',
    element: page(() => lz(import('@/features/planner/PlannerPage'), 'PlannerPage')),
  },
  ...['industries', 'industries/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/industries/IndustriesPage'), 'IndustriesPage')),
  })),
  ...['cases', 'cases/:id'].map((path) => ({
    path,
    element: page(() => lz(import('@/features/industries/IndustriesPage'), 'CaseStudiesPage')),
  })),
  { path: 'admin', element: page(() => lz(import('@/features/admin/AdminPage'), 'AdminPage')) },
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
