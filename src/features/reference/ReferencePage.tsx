import { Link } from 'react-router-dom';
import {
  BookA,
  ChevronRight,
  GitBranch,
  Globe,
  HardDrive,
  OctagonAlert,
  Sigma,
  Tag,
  Terminal,
} from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';

export function ReferencePage() {
  const { library } = useApp();
  const cards = [
    {
      icon: BookA,
      to: '/reference/glossary',
      title: 'Glossary',
      n: library.glossary.length,
      text: 'PI System terms, A to Z.',
    },
    {
      icon: Sigma,
      to: '/reference/functions/pe',
      title: 'PE and AF functions',
      n: library.peFunction.length + library.afFunction.length,
      text: 'Performance Equation and Asset Analytics functions with syntax and examples.',
    },
    {
      icon: Globe,
      to: '/reference/web-api',
      title: 'PI Web API',
      n: library.webApi.length,
      text: 'Controllers, routes and parameters.',
    },
    {
      icon: Terminal,
      to: '/reference/commands',
      title: 'Commands',
      n: library.command.length,
      text: 'piconfig, piartool, pidiag and PowerShell tools.',
    },
    {
      icon: OctagonAlert,
      to: '/reference/errors',
      title: 'Error codes',
      n: library.errorCode.length,
      text: 'What each error means and how to fix it.',
    },
    {
      icon: GitBranch,
      to: '/reference/decisions',
      title: 'Decision trees',
      n: library.decisionTree.length,
      text: 'Step-by-step choices for common design questions.',
    },
    {
      icon: Tag,
      to: '/reference/tag-names',
      title: 'Tag-name generator',
      n: null,
      text: 'Build and check tag names and AF patterns.',
    },
    {
      icon: HardDrive,
      to: '/reference/sizing',
      title: 'Sizing calculator',
      n: null,
      text: 'Archive file size and starting disk space.',
    },
  ];
  return (
    <div>
      <PageHeader
        title="Reference"
        description="Look things up, or use the tools to work something out."
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, ...c }) => (
          <li key={c.to}>
            <Link
              to={c.to}
              className="group flex h-full cursor-pointer flex-col gap-1 rounded-xl bg-surface p-5 shadow-card ring-1 ring-border/70 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-ring dark:ring-border"
            >
              <span className="mb-2 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-[10px] bg-primary-soft text-primary">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <ChevronRight
                  className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="text-[17px] font-semibold tracking-[-0.02em]">
                {c.title}
                {c.n !== null ? (
                  <span className="tabular ml-2 text-sm font-normal text-fg-muted">{c.n}</span>
                ) : null}
              </span>
              <span className="text-sm leading-relaxed text-fg-muted">{c.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
