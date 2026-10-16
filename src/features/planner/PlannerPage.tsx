import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Database, Network, type LucideIcon } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { PageHeader, Switch } from '@/components/ui/misc';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SegmentedControl, Stepper } from '@/components/ui/segmented';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mermaid } from '@/components/content/Mermaid';
import { Markdown } from '@/components/content/Markdown';
import { SourceList } from '@/components/content/SourceList';
import { cn } from '@/lib/cn';
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

const SIZE_OPTIONS: { value: CompanySize; label: string; hint: string }[] = [
  { value: 'small', label: 'Small', hint: 'One plant or a few sites.' },
  { value: 'mid', label: 'Mid-size', hint: 'Several plants.' },
  { value: 'large', label: 'Large', hint: 'Large enterprise with many sites.' },
];

const SECURITY_OPTIONS: { value: SecurityModel; label: string; hint: string }[] = [
  { value: 'flat', label: 'One network', hint: 'Lab or isolated systems only.' },
  { value: 'dmz', label: 'DMZ', hint: 'A DMZ between OT and IT, linked with PI to PI.' },
  { value: 'one-way', label: 'Data diode', hint: 'A one-way gateway out of the OT network.' },
];

/** Soft zone tints for the architecture diagram's subgraphs (one per security zone). */
const ZONE_TINTS = cn(
  '[&_g.cluster[id$=-edge]>rect]:fill-accent-soft/70!',
  '[&_g.cluster[id$=-control]>rect]:fill-success-soft/70!',
  '[&_g.cluster[id$=-dmz]>rect]:fill-warning-soft/70!',
  '[&_g.cluster[id$=-business]>rect]:fill-primary-soft/70!',
  '[&_g.cluster[id$=-cloud]>rect]:fill-surface-3/70!',
);

const PANEL = 'rounded-xl bg-surface p-5 shadow-card ring-1 ring-border/70 dark:ring-border';

function FieldCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const id = `pl-card-${title.toLowerCase()}`;
  return (
    <Card>
      <div role="group" className="space-y-4 p-5" aria-labelledby={id}>
        <h2
          id={id}
          className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          {title}
        </h2>
        {children}
      </div>
    </Card>
  );
}

function ChoiceField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div id={`${id}-label`} className="mb-1.5 text-sm font-medium">
        {label}
      </div>
      <SegmentedControl
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        value={value}
        onValueChange={onChange}
        options={options}
        fill
      />
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-muted">
        {options.find((o) => o.value === value)?.hint}
      </p>
    </div>
  );
}

function ClaimLine({ claim }: { claim: Claim }) {
  return (
    <li className="text-sm">
      <span>{claim.text}</span>{' '}
      {claim.basis === 'inferred' ? (
        <Badge
          tone="outline"
          className="font-medium"
          title="Combined from several sourced rules rather than stated outright."
        >
          Inferred
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

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mt-6', className)} aria-label={title}>
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
    // On very wide screens the planner grows past the reading-width column (centred on it) so
    // inputs and results sit side by side with room for the diagram.
    <div className="2xl:mx-[calc((100%-min(1560px,100vw-344px))/2)]">
      <PageHeader
        title="Deployment Planner"
        description="Describe a company and see how it could set up the PI System: architecture, servers, data collection, AF hierarchy, tag estimate, security zones and rollout. Every rule shows its source."
      />
      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)] 2xl:grid-cols-[24rem_minmax(0,1fr)]">
        <form
          className="space-y-4 self-start lg:sticky lg:top-20 lg:-m-1 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:p-1"
          aria-label="Company profile"
          onSubmit={(e) => e.preventDefault()}
        >
          <FieldCard title="Company" icon={Building2}>
            <div>
              <label htmlFor="pl-ind" className="mb-1.5 block text-sm font-medium">
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
            <ChoiceField
              id="pl-size"
              label="Company size"
              value={input.size}
              options={SIZE_OPTIONS}
              onChange={(size) =>
                setInput((i) => ({ industry: i.industry, size, ...SIZE_DEFAULTS[size] }))
              }
            />
            <p className="-mt-2 text-xs text-fg-muted">
              Changing size loads typical starting values; adjust them below.
            </p>
            <Stepper
              id="pl-sites"
              label="Sites with their own PI Server"
              value={input.sites}
              min={1}
              onChange={(sites) => set({ sites })}
            />
            <Stepper
              id="pl-edge"
              label="Small remote sites"
              hint="Edge only, no PI Server."
              value={input.edgeSites}
              onChange={(edgeSites) => set({ edgeSites })}
            />
          </FieldCard>

          <FieldCard title="Data" icon={Database}>
            <Stepper
              id="pl-tags"
              label="Tags per site"
              value={input.tagsPerSite}
              min={1}
              step={1000}
              onChange={(tagsPerSite) => set({ tagsPerSite })}
            />
            <Stepper
              id="pl-assets"
              label="AF assets per site"
              value={input.assetsPerSite}
              step={100}
              onChange={(assetsPerSite) => set({ assetsPerSite })}
            />
          </FieldCard>

          <FieldCard title="Network" icon={Network}>
            <ChoiceField
              id="pl-sec"
              label="Network security"
              value={input.security}
              options={SECURITY_OPTIONS}
              onChange={(security) => set({ security })}
            />
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pl-ha" className="text-sm font-medium">
                High availability
              </label>
              <Switch
                id="pl-ha"
                checked={input.highAvailability}
                onCheckedChange={(v) => set({ highAvailability: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pl-cloud" className="text-sm font-medium">
                Share data to AVEVA CONNECT
              </label>
              <Switch
                id="pl-cloud"
                checked={input.cloud}
                onCheckedChange={(v) => set({ cloud: v })}
              />
            </div>
          </FieldCard>
        </form>

        <div className="min-w-0">
          <Card className="p-5" aria-live="polite">
            <div className="text-[13px] font-semibold text-primary">Recommended architecture</div>
            <h2 className="mt-0.5 text-[22px] font-bold tracking-[-0.02em]">{plan.tierTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {INDUSTRY_LABELS[input.industry]} · {plan.tags.total.toLocaleString()} tags in total ·{' '}
              {plan.servers.reduce(
                (n, s) => n + (s.zone === 'cloud' || s.zone === 'edge' ? 0 : s.hosts.length),
                0,
              )}{' '}
              {input.sites > 1 ? 'machines at the first site and the centre' : 'machines'}
            </p>
          </Card>
          <Tabs defaultValue="architecture" className="mt-5">
            <TabsList aria-label="Plan sections" className="flex-wrap">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="servers">Servers</TabsTrigger>
              <TabsTrigger value="collection">Data collection</TabsTrigger>
              <TabsTrigger value="af">AF hierarchy</TabsTrigger>
              <TabsTrigger value="tags">Tags and sizing</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="rollout">Rollout</TabsTrigger>
            </TabsList>

            <TabsContent
              value="architecture"
              className={cn(PANEL, 'xl:grid xl:grid-cols-[auto_minmax(0,1fr)] xl:gap-8')}
            >
              <Mermaid
                source={plan.diagram}
                label="Architecture diagram"
                className={cn('my-0 bg-transparent p-0 ring-0', ZONE_TINTS)}
              />
              <Section title="Why this shape" className="xl:mt-0">
                <Claims items={plan.tierWhy} />
              </Section>
            </TabsContent>

            <TabsContent value="servers" className={PANEL}>
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

            <TabsContent value="collection" className={PANEL}>
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

            <TabsContent value="af" className={PANEL}>
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

            <TabsContent value="tags" className={PANEL}>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-surface-2 p-4">
                  <dt className="text-xs text-fg-muted">Tags per site</dt>
                  <dd className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] tabular-nums">
                    {plan.tags.perSite.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-4">
                  <dt className="text-xs text-fg-muted">Site archive file size</dt>
                  <dd className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] tabular-nums">
                    {fmtMb(plan.tags.siteArchiveMb)}
                  </dd>
                </div>
                {plan.tags.centralArchiveMb !== null ? (
                  <div className="rounded-xl bg-surface-2 p-4">
                    <dt className="text-xs text-fg-muted">
                      Central Data Archive ({plan.tags.centralPoints.toLocaleString()} points)
                    </dt>
                    <dd className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] tabular-nums">
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

            <TabsContent value="security" className={PANEL}>
              <Claims items={plan.security} />
              {plan.compliance.length ? (
                <Section title="Regulation">
                  <Claims items={plan.compliance} />
                </Section>
              ) : null}
            </TabsContent>

            <TabsContent value="rollout" className={PANEL}>
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
