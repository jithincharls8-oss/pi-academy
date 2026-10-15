import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader, Switch } from '@/components/ui/misc';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mermaid } from '@/components/content/Mermaid';
import { Markdown } from '@/components/content/Markdown';
import { SourceList } from '@/components/content/SourceList';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/core/schemas/common';
import {
  makePlan,
  SIZE_DEFAULTS,
  ZONE_LABELS,
  type Claim,
  type CompanySize,
  type PlannerInput,
  type SecurityModel,
} from '@/core/planner/plan';

const SIZE_LABELS: Record<CompanySize, string> = {
  small: 'Small: one plant or a few sites',
  mid: 'Mid-size: several plants',
  large: 'Large enterprise: many sites',
};

const SECURITY_LABELS: Record<SecurityModel, string> = {
  flat: 'One network (lab or isolated only)',
  dmz: 'DMZ with PI to PI',
  'one-way': 'One-way gateway (data diode)',
};

function ClaimLine({ claim }: { claim: Claim }) {
  return (
    <li className="text-sm">
      <span>{claim.text}</span>{' '}
      {claim.basis === 'inferred' ? (
        <Badge
          tone="warning"
          title="Combined from several sourced rules rather than stated outright."
        >
          inferred
        </Badge>
      ) : null}
      <details className="mt-1 text-xs text-fg-muted">
        <summary className="cursor-pointer">Sources</summary>
        <SourceList ids={claim.sources} compact />
      </details>
    </li>
  );
}

function Claims({ items }: { items: Claim[] }) {
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <ClaimLine key={c.text} claim={c} />
      ))}
    </ul>
  );
}

function Num({
  id,
  label,
  value,
  onChange,
  min = 0,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.round(Number(e.target.value) || 0)))}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

const fmtMb = (mb: number) =>
  mb >= 1024
    ? `${(mb / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} GB`
    : `${mb} MB`;

export function PlannerPage() {
  const { library } = useApp();
  const [input, setInput] = useState<PlannerInput>({
    industry: 'water',
    size: 'small',
    ...SIZE_DEFAULTS.small,
  });
  const set = (patch: Partial<PlannerInput>) => setInput((i) => ({ ...i, ...patch }));
  const plan = useMemo(() => makePlan(input), [input]);
  const hub = library.industry.find((h) => h.id === input.industry);
  const cases = library.caseStudy.filter((c) => c.industry === input.industry);

  return (
    <div>
      <PageHeader
        title="Deployment Planner"
        description="Describe a company and see how it could set up the PI System: architecture, servers, data collection, AF hierarchy, tag estimate, security zones and rollout. Every rule shows its source."
      />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <form
          className="space-y-4 self-start rounded-lg border border-border bg-surface p-4"
          aria-label="Company profile"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label htmlFor="pl-ind" className="mb-1 block text-sm font-medium">
              Industry
            </label>
            <Select
              id="pl-ind"
              value={input.industry}
              onChange={(e) => set({ industry: e.target.value as Industry })}
            >
              {INDUSTRIES.map((k) => (
                <option key={k} value={k}>
                  {INDUSTRY_LABELS[k]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="pl-size" className="mb-1 block text-sm font-medium">
              Company size
            </label>
            <Select
              id="pl-size"
              value={input.size}
              onChange={(e) => {
                const size = e.target.value as CompanySize;
                setInput((i) => ({ industry: i.industry, size, ...SIZE_DEFAULTS[size] }));
              }}
            >
              {(Object.keys(SIZE_LABELS) as CompanySize[]).map((k) => (
                <option key={k} value={k}>
                  {SIZE_LABELS[k]}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-fg-muted">
              Changing size loads typical starting values; adjust them below.
            </p>
          </div>
          <Num
            id="pl-sites"
            label="Sites with their own PI Server"
            value={input.sites}
            min={1}
            onChange={(sites) => set({ sites })}
          />
          <Num
            id="pl-edge"
            label="Small remote sites (edge only)"
            value={input.edgeSites}
            onChange={(edgeSites) => set({ edgeSites })}
          />
          <Num
            id="pl-tags"
            label="Tags per site"
            value={input.tagsPerSite}
            min={1}
            onChange={(tagsPerSite) => set({ tagsPerSite })}
          />
          <Num
            id="pl-assets"
            label="AF assets per site"
            value={input.assetsPerSite}
            onChange={(assetsPerSite) => set({ assetsPerSite })}
          />
          <div>
            <label htmlFor="pl-sec" className="mb-1 block text-sm font-medium">
              Network security
            </label>
            <Select
              id="pl-sec"
              value={input.security}
              onChange={(e) => set({ security: e.target.value as SecurityModel })}
            >
              {(Object.keys(SECURITY_LABELS) as SecurityModel[]).map((k) => (
                <option key={k} value={k}>
                  {SECURITY_LABELS[k]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="pl-ha"
              checked={input.highAvailability}
              onCheckedChange={(v) => set({ highAvailability: v })}
            />
            <label htmlFor="pl-ha" className="text-sm">
              High availability
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="pl-cloud"
              checked={input.cloud}
              onCheckedChange={(v) => set({ cloud: v })}
            />
            <label htmlFor="pl-cloud" className="text-sm">
              Share data to AVEVA CONNECT
            </label>
          </div>
        </form>

        <div className="min-w-0">
          <div className="rounded-lg border border-border bg-surface p-4" aria-live="polite">
            <div className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Recommended architecture
            </div>
            <h2 className="mt-1 text-xl font-semibold">{plan.tierTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {INDUSTRY_LABELS[input.industry]} · {plan.tags.total.toLocaleString()} tags in total ·{' '}
              {plan.servers.reduce(
                (n, s) => n + (s.zone === 'cloud' || s.zone === 'edge' ? 0 : s.hosts.length),
                0,
              )}{' '}
              {input.sites > 1 ? 'machines at the first site and the centre' : 'machines'}
            </p>
          </div>
          <Tabs defaultValue="architecture" className="mt-4">
            <TabsList aria-label="Plan sections" className="flex-wrap">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="servers">Servers</TabsTrigger>
              <TabsTrigger value="collection">Data collection</TabsTrigger>
              <TabsTrigger value="af">AF hierarchy</TabsTrigger>
              <TabsTrigger value="tags">Tags and sizing</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="rollout">Rollout</TabsTrigger>
            </TabsList>

            <TabsContent value="architecture">
              <Mermaid source={plan.diagram} label="Architecture diagram" />
              <Section title="Why this shape">
                <Claims items={plan.tierWhy} />
              </Section>
            </TabsContent>

            <TabsContent value="servers">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-fg-muted">
                      <th className="py-2 pr-3 font-medium">Role</th>
                      <th className="py-2 pr-3 font-medium">Machines</th>
                      <th className="py-2 pr-3 font-medium">Zone</th>
                      <th className="py-2 font-medium">What runs there</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.servers.map((s) => (
                      <tr key={s.name} className="border-b border-border align-top">
                        <td className="py-2 pr-3 font-medium">{s.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{s.hosts.join(', ')}</td>
                        <td className="py-2 pr-3">{ZONE_LABELS[s.zone]}</td>
                        <td className="py-2">
                          {s.runs}
                          <ul className="mt-2">
                            <ClaimLine claim={s.why} />
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {input.sites > 1 ? (
                <p className="mt-3 text-sm text-fg-muted">
                  Site machines are shown for the first site (S1-). Repeat them at each of the{' '}
                  {input.sites} sites. Machine names are examples.
                </p>
              ) : (
                <p className="mt-3 text-sm text-fg-muted">Machine names are examples.</p>
              )}
            </TabsContent>

            <TabsContent value="collection">
              <Claims items={plan.collection} />
              {hub ? (
                <Section title={`Typical ${INDUSTRY_LABELS[input.industry]} tags`}>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {hub.tags.map((t) => (
                      <li key={t.name}>
                        <span className="font-medium">{t.name}</span>
                        {t.uom ? ` (${t.uom})` : ''}: {t.description}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}
            </TabsContent>

            <TabsContent value="af">
              {hub ? (
                <>
                  <Markdown source={hub.hierarchy} />
                  <Section title="Element templates">
                    <ul className="space-y-2 text-sm">
                      {hub.templates.map((t) => (
                        <li key={t.name}>
                          <span className="font-medium">{t.name}</span>: {t.description}
                          <div className="text-xs text-fg-muted">
                            Attributes: {t.attributes.join(', ')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Section>
                  <p className="mt-4 text-sm">
                    <Link className="text-primary underline" to={`/industries/${hub.id}`}>
                      Open the {hub.title} hub
                    </Link>{' '}
                    for calculations, event frames and KPIs.
                  </p>
                </>
              ) : (
                <p className="text-sm text-fg-muted">
                  The {INDUSTRY_LABELS[input.industry]} hub has not been loaded yet, so there is no
                  example hierarchy.
                </p>
              )}
            </TabsContent>

            <TabsContent value="tags">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-fg-muted">Tags per site</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {plan.tags.perSite.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-fg-muted">Site archive file size</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {fmtMb(plan.tags.siteArchiveMb)}
                  </dd>
                </div>
                {plan.tags.centralArchiveMb !== null ? (
                  <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs text-fg-muted">
                      Central Data Archive ({plan.tags.centralPoints.toLocaleString()} points)
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {fmtMb(plan.tags.centralArchiveMb)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {plan.tags.warnings.length ? (
                <div className="mt-4">
                  <Claims items={plan.tags.warnings} />
                </div>
              ) : null}
              <Section title="Starting disk estimate (per Data Archive)">
                <ul className="text-sm">
                  {plan.tags.disk.map((d) => (
                    <li key={d.label}>
                      {d.label}: {fmtMb(d.mb)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-fg-muted">
                  From the course formulas in the{' '}
                  <Link className="text-primary underline" to="/reference/sizing">
                    sizing calculator
                  </Link>
                  .
                </p>
              </Section>
              <Section title="Real deployments of a similar size">
                <ul className="space-y-3">
                  {plan.tags.comparables.map((c) => (
                    <li key={c.company} className="text-sm">
                      <span className="font-medium">{c.company}</span>{' '}
                      <span className="text-fg-muted">({INDUSTRY_LABELS[c.industry]})</span>:{' '}
                      {c.stated}
                      <SourceList ids={c.sources} compact />
                    </li>
                  ))}
                </ul>
              </Section>
            </TabsContent>

            <TabsContent value="security">
              <Claims items={plan.security} />
              {plan.compliance.length ? (
                <Section title="Regulation">
                  <Claims items={plan.compliance} />
                </Section>
              ) : null}
            </TabsContent>

            <TabsContent value="rollout">
              <ol className="space-y-4">
                {plan.rollout.map((r, n) => (
                  <li key={r.title}>
                    <h3 className="font-semibold">
                      {n + 1}. {r.title}
                    </h3>
                    <div className="mt-2">
                      <Claims items={r.steps} />
                    </div>
                  </li>
                ))}
              </ol>
              {cases.length ? (
                <Section title="How real companies did it">
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {cases.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <Link className="text-primary underline" to={`/cases/${c.id}`}>
                          {c.company}
                        </Link>
                        : {c.title}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
