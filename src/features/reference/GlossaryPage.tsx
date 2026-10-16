import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { DOMAIN_LABELS } from '@/core/schemas';
import { PageHeader } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { ListDetail, Field } from './ListDetail';

export function GlossaryPage() {
  const { id } = useParams();
  const { library } = useApp();
  const byId = new Map(library.glossary.map((t) => [t.id, t]));
  const items = [...library.glossary]
    .sort((a, b) => a.term.localeCompare(b.term))
    .map((t) => ({
      ...t,
      title: t.term,
      subtitle: t.definition,
      group: (t.term[0] ?? '#').toUpperCase(),
      keywords: `${t.aliases.join(' ')} ${t.definition}`,
    }));
  return (
    <div>
      <PageHeader
        title="Glossary"
        description={`${library.glossary.length} PI System terms, each with its sources.`}
      />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/reference/glossary"
        filterLabel="Filter terms"
        emptyTitle="No glossary terms yet"
        emptyText="Terms arrive with the content packs."
        renderDetail={(t) => (
          <>
            <h2 className="text-xl font-semibold">{t.term}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{DOMAIN_LABELS[t.domain]}</Badge>
              {t.aliases.map((a) => (
                <Badge key={a} tone="info">
                  {a}
                </Badge>
              ))}
            </div>
            <p className="mt-4 leading-relaxed">{t.definition}</p>
            {t.related.length ? (
              <Field label="Related terms">
                <ul className="flex flex-wrap gap-2">
                  {t.related.map((r) => (
                    <li key={r}>
                      <Link className="text-primary underline" to={`/reference/glossary/${r}`}>
                        {byId.get(r)?.term ?? r}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Field>
            ) : null}
            {(() => {
              const lessons = library.lesson.filter((l) => l.keyTerms.includes(t.id));
              return lessons.length ? (
                <Field label="Lessons that use it">
                  <ul>
                    {lessons.map((l) => (
                      <li key={l.id}>
                        <Link className="text-primary underline" to={`/learn/${l.id}`}>
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Field>
              ) : null;
            })()}
          </>
        )}
      />
    </div>
  );
}
