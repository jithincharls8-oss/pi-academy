import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Flame, Menu, RotateCcw, Search, Star, WifiOff } from 'lucide-react';
import { NAV, NAV_GROUPS, type NavItem } from './nav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/cn';
import { useOnline } from '@/lib/useOnline';
import { Pip } from '@/components/ui/pip';
import { Progress } from '@/components/ui/misc';
import { useLearner } from './useLearner';

export function Shell({ enabled }: { enabled: ReadonlySet<string> }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnline();
  const learner = useLearner();

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
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-surface focus:p-2"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          'material fixed inset-y-0 left-0 z-30 flex w-[264px] shrink-0 flex-col border-r border-material-border transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <Pip size={34} />
          <div>
            <div className="text-[15px] leading-tight font-bold tracking-[-0.02em]">PI Academy</div>
            <div className="text-xs text-fg-muted">PI System trainer</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {groups.map(([g, label]) => {
            const groupItems = items.filter((i) => i.group === g);
            if (groupItems.length === 0) return null;
            return (
              <div key={g} className="mb-4">
                <div className="px-2.5 pb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">
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
                        'flex items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-[14px] font-medium text-fg transition-colors hover:bg-surface-3/60',
                        isActive && 'bg-primary-soft text-primary hover:bg-primary-soft',
                      )
                    }
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-[26px] place-items-center rounded-[7px] text-on-solid shadow-sm',
                        item.tile,
                      )}
                    >
                      <item.icon className="size-[15px]" strokeWidth={2.25} />
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="m-3 rounded-xl bg-surface p-3.5 shadow-card ring-1 ring-border/70">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-semibold">Level {learner.level.level}</span>
            <span className="tabular text-fg-muted">
              {learner.level.into} / {learner.level.needed} XP
            </span>
          </div>
          <Progress
            className="mt-2 h-2"
            tone="xp"
            value={(learner.level.into / learner.level.needed) * 100}
            label={`Level ${learner.level.level} progress`}
          />
        </div>
      </aside>
      {open ? (
        <div
          className="fixed inset-0 z-20 bg-fg/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="material sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-material-border px-4 md:px-8">
          <button
            className="rounded-full p-2 hover:bg-surface-3/60 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-full bg-surface-3/60 px-4 text-sm text-fg-muted transition-colors hover:bg-surface-3"
          >
            <Search className="size-4" aria-hidden />
            Search lessons, terms, functions…
            <kbd className="ml-auto rounded-md bg-surface px-1.5 py-0.5 font-sans text-[11px] font-semibold text-fg-muted shadow-card">
              Ctrl K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            {online ? null : (
              <span
                className="flex items-center gap-1 px-2 text-xs text-fg-muted"
                title="Everything works offline"
              >
                <WifiOff className="size-4" aria-hidden /> Offline
              </span>
            )}
            <NavLink
              to="/exam/daily"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-flame-text hover:bg-surface-3/60"
              aria-label={`Streak: ${learner.streak} ${learner.streak === 1 ? 'day' : 'days'}`}
              title="Daily exam streak"
            >
              <Flame
                className={cn('size-[18px]', learner.streak === 0 && 'opacity-50')}
                aria-hidden
              />
              <span className="tabular">{learner.streak}</span>
            </NavLink>
            <span
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-xp-text"
              aria-label={`${learner.xp} XP in total`}
              title="Total XP"
            >
              <Star className="size-[18px] fill-xp text-xp" aria-hidden />
              <span className="tabular">{learner.xp}</span>
            </span>
            <NavLink
              to="/practice"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-primary hover:bg-surface-3/60 sm:flex"
              aria-label={`${learner.reviewsDue} reviews due`}
              title="Spaced-repetition reviews due"
            >
              <RotateCcw className="size-[17px]" aria-hidden />
              <span className="tabular">{learner.reviewsDue}</span>
            </NavLink>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 md:px-10 md:py-10"
        >
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
