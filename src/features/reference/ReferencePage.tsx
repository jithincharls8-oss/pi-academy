import { Link } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';

export function ReferencePage() {
  const { library } = useApp();
  const cards = [
    {
      to: '/reference/glossary',
      title: 'Glossary',
      n: library.glossary.length,
      text: 'PI System terms, A to Z.',
    },
    {
      to: '/reference/functions/pe',
      title: 'PE and AF functions',
      n: library.peFunction.length + library.afFunction.length,
      text: 'Performance Equation and Asset Analytics functions with syntax and examples.',
    },
    {
      to: '/reference/web-api',
      title: 'PI Web API',
      n: library.webApi.length,
      text: 'Controllers, routes and parameters.',
    },
    {
      to: '/reference/commands',
      title: 'Commands',
      n: library.command.length,
      text: 'piconfig, piartool, pidiag and PowerShell tools.',
    },
    {
      to: '/reference/errors',
      title: 'Error codes',
      n: library.errorCode.length,
      text: 'What each error means and how to fix it.',
    },
    {
      to: '/reference/decisions',
      title: 'Decision trees',
      n: library.decisionTree.length,
      text: 'Step-by-step choices for common design questions.',
    },
    {
      to: '/reference/tag-names',
      title: 'Tag-name generator',
      n: null,
      text: 'Build and check tag names and AF patterns.',
    },
    {
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
        {cards.map((c) => (
          <li key={c.to}>
            <Link
              to={c.to}
              className="flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="font-semibold">
                {c.title}
                {c.n !== null ? (
                  <span className="ml-2 text-sm font-normal text-fg-muted">{c.n}</span>
                ) : null}
              </span>
              <span className="text-sm text-fg-muted">{c.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
