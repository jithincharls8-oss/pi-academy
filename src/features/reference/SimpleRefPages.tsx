import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { ListDetail, Field, Code } from './ListDetail';

export function WebApiRefPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.webApi.map((e) => ({
    ...e,
    title: `${e.method} ${e.path}`,
    subtitle: e.summary,
    group: e.controller,
  }));
  return (
    <div>
      <PageHeader title="PI Web API reference" description="Controllers, routes and parameters." />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/reference/web-api"
        filterLabel="Filter endpoints"
        emptyTitle="No endpoints yet"
        emptyText="The Web API reference arrives with the content packs."
        renderDetail={(e) => (
          <>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{e.method}</Badge>
              <h2 className="font-mono text-lg font-semibold break-all">{e.path}</h2>
            </div>
            <p className="mt-3">{e.summary}</p>
            {e.params.length ? (
              <Field label="Parameters">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-fg-muted">
                      <th className="py-1 font-medium">Name</th>
                      <th className="py-1 font-medium">In</th>
                      <th className="py-1 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.params.map((p) => (
                      <tr key={p.name} className="border-b border-border/60 align-top">
                        <td className="py-1 font-mono">
                          {p.name}
                          {p.required ? <span className="text-danger"> *</span> : null}
                        </td>
                        <td className="py-1">{p.in}</td>
                        <td className="py-1">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Field>
            ) : null}
            {e.example ? (
              <Field label="Example">
                <Code>{e.example}</Code>
              </Field>
            ) : null}
            <p className="mt-4 text-sm">
              <Link className="text-primary underline" to="/sandbox/webapi">
                Try requests in the Web API browser
              </Link>
            </p>
          </>
        )}
      />
    </div>
  );
}

export function CommandsPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.command.map((c) => ({
    ...c,
    title: c.command,
    subtitle: c.description,
    group: c.tool,
  }));
  return (
    <div>
      <PageHeader
        title="Command-line tools"
        description="piconfig, piartool, pidiag and other administration commands."
      />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/reference/commands"
        filterLabel="Filter commands"
        emptyTitle="No commands yet"
        emptyText="The command reference arrives with the content packs."
        renderDetail={(c) => (
          <>
            <Badge>{c.tool}</Badge>
            <h2 className="mt-2 font-mono text-lg font-semibold">{c.command}</h2>
            <p className="mt-3">{c.description}</p>
            <Field label="Example">
              <Code>{c.example}</Code>
            </Field>
            {c.notes ? <Field label="Notes">{c.notes}</Field> : null}
            <p className="mt-4 text-sm">
              <Link className="text-primary underline" to="/sandbox/smt">
                Practise in the SMT sandbox console
              </Link>
            </p>
          </>
        )}
      />
    </div>
  );
}

export function ErrorsPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.errorCode.map((e) => ({
    ...e,
    title: `${e.code} ${e.message}`,
    subtitle: e.meaning,
    group: e.product,
    keywords: e.resolution,
  }));
  return (
    <div>
      <PageHeader title="Error codes" description="What an error means and how to fix it." />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/reference/errors"
        filterLabel="Filter by code or text"
        emptyTitle="No error codes yet"
        emptyText="The error-code reference arrives with the content packs."
        renderDetail={(e) => (
          <>
            <Badge>{e.product}</Badge>
            <h2 className="mt-2 font-mono text-lg font-semibold">{e.code}</h2>
            <p className="font-medium">{e.message}</p>
            <Field label="What it means">{e.meaning}</Field>
            <Field label="How to resolve it">{e.resolution}</Field>
          </>
        )}
      />
    </div>
  );
}
