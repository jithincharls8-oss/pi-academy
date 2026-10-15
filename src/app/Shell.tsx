import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, Search, WifiOff } from 'lucide-react';
import { NAV, NAV_GROUPS, type NavItem } from './nav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/cn';
import { useOnline } from '@/lib/useOnline';

export function Shell({ enabled }: { enabled: ReadonlySet<string> }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnline();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const items = NAV.filter((n) => enabled.has(n.to));
  const groups = Object.entries(NAV_GROUPS) as [NavItem['group'], string][];

  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-surface focus:p-2"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-border bg-surface transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-md bg-primary font-bold text-primary-fg"
          >
            π
          </span>
          <div>
            <div className="font-semibold leading-tight">PI Academy</div>
            <div className="text-xs text-fg-muted">AVEVA PI System trainer</div>
          </div>
        </div>
        <nav className="overflow-y-auto p-3">
          {groups.map(([g, label]) => {
            const groupItems = items.filter((i) => i.group === g);
            if (groupItems.length === 0) return null;
            return (
              <div key={g} className="mb-4">
                <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {label}
                </div>
                {groupItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-2 py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg',
                        isActive &&
                          'bg-primary-soft font-medium text-primary hover:bg-primary-soft hover:text-primary',
                      )
                    }
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
      {open ? (
        <div
          className="fixed inset-0 z-20 bg-fg/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
          <button
            className="rounded p-2 hover:bg-surface-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg-subtle hover:text-fg"
          >
            <Search className="size-4" aria-hidden />
            Search lessons, terms, functions…
            <kbd className="ml-auto rounded border border-border px-1.5 text-xs">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-fg-muted">
            {online ? null : (
              <span className="flex items-center gap-1" title="Everything works offline">
                <WifiOff className="size-4" aria-hidden /> Offline
              </span>
            )}
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
