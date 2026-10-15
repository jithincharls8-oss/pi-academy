import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Markdown } from '@/components/content/Markdown';
import { INDUSTRY_LABELS } from '@/core/schemas/common';
import { OUTCOME_CATEGORIES, type CaseStudy } from '@/core/schemas/content';
import { ListDetail, Field, Code } from '@/features/reference/ListDetail';

export function IndustriesPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.industry.map((h) => ({ ...h, subtitle: h.summary }));
  const cases = new Map(library.caseStudy.map((c) => [c.id, c]));
  return (
    <div>
      <PageHeader
        title="Industry hubs"
        description="How each industry uses the PI System: typical AF hierarchy, tags, templates, calculations, event frames, KPIs, regulation and real case studies."
      />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/industries"
        filterLabel="Filter industries"
        emptyTitle="No industry hubs yet"
        emptyText="Industry hubs arrive with the content packs."
        renderDetail={(h) => (
          <>
            <h2 className="text-lg font-semibold">{h.title}</h2>
            <p className="mt-2">{h.summary}</p>
            <p className="mt-2 text-sm">
              <Link className="text-primary underline" to="/planner">
                Plan a {INDUSTRY_LABELS[h.id]} deployment
              </Link>
            </p>
            <Field label="Typical AF hierarchy">
              <Markdown source={h.hierarchy} />
            </Field>
            <Field label="Typical tags">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {h.tags.map((t) => (
                  <li key={t.name}>
                    <span className="font-medium">{t.name}</span>
                    {t.uom ? ` (${t.uom})` : ''}: {t.description}
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="Element templates">
              <ul className="space-y-2 text-sm">
                {h.templates.map((t) => (
                  <li key={t.name}>
                    <span className="font-medium">{t.name}</span>: {t.description}
                    <div className="text-xs text-fg-muted">
                      Attributes: {t.attributes.join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="Calculations">
              <ul className="space-y-3 text-sm">
                {h.calculations.map((c) => (
                  <li key={c.name}>
                    <span className="font-medium">{c.name}</span>: {c.description}
                    <Code>{c.expression}</Code>
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="Event frames">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {h.eventFrames.map((e) => (
                  <li key={e.name}>
                    <span className="font-medium">{e.name}</span>: starts when {e.trigger}
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="KPIs">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {h.kpis.map((k) => (
                  <li key={k.name}>
                    <span className="font-medium">{k.name}</span>: {k.definition}
                  </li>
                ))}
              </ul>
            </Field>
            {h.regulation.length ? (
              <Field label="Regulation">
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {h.regulation.map((r) => (
                    <li key={r.name}>
                      <span className="font-medium">{r.name}</span>: {r.summary}
                    </li>
                  ))}
                </ul>
              </Field>
            ) : null}
            <Field label="Common pitfalls">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {h.pitfalls.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Field>
            {h.caseStudies.length ? (
              <Field label="Case studies">
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {h.caseStudies.map((cid) => {
                    const c = cases.get(cid);
                    return c ? (
                      <li key={cid}>
                        <Link className="text-primary underline" to={`/cases/${cid}`}>
                          {c.company}
                        </Link>
                        : {c.title}
                      </li>
                    ) : null;
                  })}
                </ul>
              </Field>
            ) : null}
          </>
        )}
      />
    </div>
  );
}

const CATEGORY_TONE: Record<(typeof OUTCOME_CATEGORIES)[number], BadgeProps['tone']> = {
  efficiency: 'primary',
  cost: 'success',
  reliability: 'info',
  quality: 'info',
  safety: 'warning',
  sustainability: 'success',
  compliance: 'accent',
  visibility: 'primary',
  other: 'neutral',
};

function CaseDetail({ c }: { c: CaseStudy }) {
  return (
    <>
      <div className="text-sm text-fg-muted">
        {INDUSTRY_LABELS[c.industry]}
        {c.region ? ` · ${c.region}` : ''}
        {c.year ? ` · ${c.year}` : ''}
      </div>
      <h2 className="mt-1 text-lg font-semibold">{c.company}</h2>
      <p className="font-medium">{c.title}</p>
      <p className="mt-3">{c.summary}</p>
      <Field label="Challenge">
        <p className="text-sm">{c.challenge}</p>
      </Field>
      <Field label="Solution">
        <p className="text-sm">{c.solution}</p>
      </Field>
      <Field label="Outcomes">
        <ul className="space-y-2 text-sm">
          {c.outcomes.map((o) => (
            <li key={o.text}>
              <Badge tone={CATEGORY_TONE[o.category]}>{o.category}</Badge> {o.text}{' '}
              <span className="text-fg-muted">(reported by {o.reportedBy})</span>
            </li>
          ))}
        </ul>
      </Field>
      <Field label="Products">
        <div className="flex flex-wrap gap-1">
          {c.products.map((p) => (
            <Badge key={p}>{p.replace(/-/g, ' ')}</Badge>
          ))}
        </div>
      </Field>
    </>
  );
}

export function CaseStudiesPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.caseStudy.map((c) => ({
    ...c,
    title: c.company,
    subtitle: c.title,
    group: INDUSTRY_LABELS[c.industry],
    keywords: [c.summary, ...c.outcomes.map((o) => o.text)].join(' '),
  }));
  return (
    <div>
      <PageHeader
        title="Case studies"
        description={`${library.caseStudy.length} real PI System deployments. Every figure says who reported it; most come from vendor-published success stories.`}
      />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/cases"
        filterLabel="Filter case studies"
        emptyTitle="No case studies yet"
        emptyText="Case studies arrive with the content packs."
        renderDetail={(c) => <CaseDetail c={c} />}
      />
    </div>
  );
}
