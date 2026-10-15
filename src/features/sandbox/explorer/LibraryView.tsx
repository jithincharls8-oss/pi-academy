import { useState } from 'react';
import { CheckCircle2, FileBox, ListOrdered, Tag, XCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { allElements, findPoint, plant, type SimElement } from '@/core/sim/plant';
import { cn } from '@/lib/cn';
import { exampleAnalyses } from './analyses';
import { ANALYSIS_CATEGORIES, ELEMENT_CATEGORIES } from './catalog';
import { parsePiPointConfig, substitute } from './configString';
import { applyNamingPattern, EVENT_FRAME_TEMPLATES } from './eventFrames';
import type { ExplorerModel } from './model';
import { Note, Panel, Prop, selectableRow, Td, Th } from './ui';
import { parentMap } from './afContext';

export type LibrarySel =
  | { kind: 'element-template'; name: string }
  | { kind: 'ef-template'; name: string }
  | { kind: 'enum'; name: string }
  | { kind: 'categories' };

function sameSel(a: LibrarySel, b: LibrarySel): boolean {
  return a.kind === b.kind && ('name' in a ? a.name : '') === ('name' in b ? b.name : '');
}

/** Browser pane for the Library section. */
export function LibraryBrowser({
  value,
  onChange,
}: {
  value: LibrarySel;
  onChange: (s: LibrarySel) => void;
}) {
  const m = plant();
  const item = (sel: LibrarySel, label: string, Icon: typeof FileBox, depth = 1) => (
    <li key={`${sel.kind}:${label}`}>
      <button
        type="button"
        aria-current={sameSel(value, sel) ? 'true' : undefined}
        onClick={() => onChange(sel)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring',
          sameSel(value, sel) ? 'bg-tool-select' : 'hover:bg-surface-2',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <Icon className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
  const heading = (t: string) => (
    <li key={t} className="px-1 pt-2 pb-0.5 text-xs font-semibold text-fg-muted">
      {t}
    </li>
  );
  return (
    <nav aria-label="Library">
      <ul className="py-1">
        {heading('Element Templates')}
        {m.templates.map((t) => item({ kind: 'element-template', name: t.name }, t.name, FileBox))}
        {heading('Event Frame Templates')}
        {EVENT_FRAME_TEMPLATES.map((t) => item({ kind: 'ef-template', name: t.name }, t.name, Zap))}
        {heading('Enumeration Sets')}
        {m.digitalSets.map((d) => item({ kind: 'enum', name: d.name }, d.name, ListOrdered))}
        {heading('Categories')}
        {item({ kind: 'categories' }, 'All categories', Tag)}
      </ul>
    </nav>
  );
}

export function LibraryViewer({
  sel,
  model,
  onOpenElement,
}: {
  sel: LibrarySel;
  model: ExplorerModel;
  onOpenElement: (e: SimElement) => void;
}) {
  switch (sel.kind) {
    case 'element-template':
      return (
        <ElementTemplateView
          key={sel.name}
          name={sel.name}
          model={model}
          onOpenElement={onOpenElement}
        />
      );
    case 'ef-template':
      return <EventFrameTemplateView name={sel.name} />;
    case 'enum':
      return <EnumerationSetView name={sel.name} />;
    case 'categories':
      return <CategoriesView />;
  }
}

function ElementTemplateView({
  name,
  model,
  onOpenElement,
}: {
  name: string;
  model: ExplorerModel;
  onOpenElement: (e: SimElement) => void;
}) {
  const m = plant();
  const tpl = m.templates.find((t) => t.name === name);
  const instances = allElements().filter((e) => e.template === name);
  const [exampleId, setExampleId] = useState(instances[0]?.id ?? '');
  const [attrName, setAttrName] = useState(tpl?.attributes[0]?.name ?? '');
  const [pattern, setPattern] = useState<string | null>(null);
  if (!tpl) return <Note>Template not found.</Note>;
  const derived = m.templates.filter((t) => t.baseTemplate === tpl.name);
  const exampleBase = instances.find((e) => e.id === exampleId);
  const example = exampleBase ? model.working(exampleBase) : undefined;
  const parents = parentMap(m.root);
  const at = tpl.attributes.find((a) => a.name === attrName);
  const analyses = instances[0] ? exampleAnalyses(instances[0]) : [];

  const resolve = (cfg: string) =>
    example && at
      ? substitute(cfg, {
          server: m.dataServer,
          database: m.database,
          element: example,
          attribute: at.name,
          parent: parents.get(example.id) ?? null,
          attributeText: (el, n) => {
            if (n.toLowerCase() === 'name') return undefined;
            const a = model
              .working(el)
              .attributes.find((x) => x.name.toLowerCase() === n.toLowerCase());
            return a && a.value !== undefined ? String(a.value) : undefined;
          },
        })
      : null;
  const activePattern = pattern ?? at?.configString ?? '';
  const res = resolve(activePattern);
  const tag =
    res && at?.dataReference === 'PI Point'
      ? parsePiPointConfig(res.text, m.dataServer)?.tag
      : undefined;
  const tagFound = tag ? findPoint(tag) : undefined;
  const elementAttr = example?.attributes.find((a) => a.name === at?.name);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <FileBox className="size-5 text-fg-muted" aria-hidden /> {tpl.name}
        <span className="text-sm font-normal text-fg-muted">element template</span>
      </h2>
      <Panel title="General">
        <dl>
          <Prop label="Description">{tpl.description}</Prop>
          <Prop label="Base template">{tpl.baseTemplate ?? '<None>'}</Prop>
          <Prop label="Derived templates">
            {derived.length ? derived.map((d) => d.name).join(', ') : 'None'}
          </Prop>
          <Prop label="Categories">
            {(ELEMENT_CATEGORIES[tpl.name] ?? []).join(', ') || 'None'}
          </Prop>
          <Prop label="Elements">
            {instances.length ? (
              <span className="flex flex-wrap gap-2">
                {instances.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => onOpenElement(e)}
                  >
                    {e.name}
                  </button>
                ))}
              </span>
            ) : (
              'None built from this template'
            )}
          </Prop>
          {analyses.length ? (
            <Prop label="Analysis examples">{analyses.map((a) => a.name).join(', ')}</Prop>
          ) : null}
        </dl>
        <Note>
          Changing a template&apos;s attribute definitions updates every element built from it,
          except values overridden on an element.
        </Note>
      </Panel>
      {tpl.attributes.length ? (
        <>
          <Panel title={`Attribute Templates (${tpl.attributes.length})`}>
            <div className="overflow-x-auto rounded border border-border">
              <table role="grid" aria-label="Attribute templates" className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Value Type</Th>
                    <Th>Default UOM</Th>
                    <Th>Data Reference</Th>
                    <Th>Config String</Th>
                  </tr>
                </thead>
                <tbody>
                  {tpl.attributes.map((a) => (
                    <tr
                      key={a.name}
                      {...selectableRow(attrName === a.name, () => {
                        setAttrName(a.name);
                        setPattern(null);
                      })}
                    >
                      <Td className="font-medium whitespace-nowrap">{a.name}</Td>
                      <Td>{a.type}</Td>
                      <Td>{a.uom || '<None>'}</Td>
                      <Td className="whitespace-nowrap">
                        {a.dataReference === 'None' ? '<None>' : a.dataReference}
                      </Td>
                      <Td className="font-mono text-xs text-fg-muted">{a.configString}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          {at ? (
            <Panel title={`Substitution: ${at.name}`}>
              {at.dataReference !== 'PI Point' ? (
                <Note>
                  {at.dataReference === 'None'
                    ? 'This attribute template holds a static default value; there is nothing to substitute.'
                    : `The ${at.dataReference} config string refers to other attributes by name: ${at.configString}`}
                </Note>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sub-example" className="text-xs">
                        Example element
                      </Label>
                      <Select
                        id="sub-example"
                        className="h-8 w-40 text-xs"
                        value={exampleId}
                        onChange={(e) => setExampleId(e.target.value)}
                      >
                        {instances.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex min-w-64 flex-1 flex-col gap-1">
                      <Label htmlFor="sub-pattern" className="text-xs">
                        Config string with substitution parameters (try your own)
                      </Label>
                      <Input
                        id="sub-pattern"
                        className="h-8 font-mono text-xs"
                        value={activePattern}
                        spellCheck={false}
                        onChange={(e) => setPattern(e.target.value)}
                      />
                    </div>
                  </div>
                  {res ? (
                    <>
                      <table className="w-full text-sm" aria-label="Substitution steps">
                        <thead>
                          <tr>
                            <Th>Parameter</Th>
                            <Th>Resolves to</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {res.steps.map((s, i) => (
                            <tr key={`${s.token}-${i}`} className="border-b border-tool-grid">
                              <Td className="font-mono text-xs">{s.token}</Td>
                              <Td className="font-mono text-xs">{s.value}</Td>
                            </tr>
                          ))}
                          {res.unresolved.map((u) => (
                            <tr key={u} className="border-b border-tool-grid">
                              <Td className="font-mono text-xs">{u}</Td>
                              <Td className="text-xs text-tool-alarm-hi">Not resolved here</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <dl>
                        <Prop label="Resolved">
                          <code className="font-mono text-xs break-all">{res.text}</code>
                        </Prop>
                        <Prop label="Tag check">
                          {tagFound ? (
                            <span className="flex items-center gap-1 text-tool-ok">
                              <CheckCircle2 className="size-3.5" aria-hidden /> {tagFound.tag}{' '}
                              exists
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-tool-alarm-hi">
                              <XCircle className="size-3.5" aria-hidden /> No PI point named &quot;
                              {tag}&quot;
                            </span>
                          )}
                        </Prop>
                        <Prop label={`On ${example?.name ?? 'element'}`}>
                          <span className="flex flex-col gap-1">
                            <code className="font-mono text-xs break-all">
                              {elementAttr?.configString ?? 'Attribute missing'}
                            </code>
                            {elementAttr && elementAttr.configString !== res.text ? (
                              <Badge tone="warning" className="w-fit">
                                Element overrides the template config string
                              </Badge>
                            ) : (
                              <Badge tone="success" className="w-fit">
                                Matches the template
                              </Badge>
                            )}
                          </span>
                        </Prop>
                      </dl>
                      <Note>
                        Supported here: %Server%, %Database%, %Element%, %..\Element%, %Attribute%,
                        %Template%, %Description% and another attribute&apos;s value with %@Name% or
                        %@..\|Name% (parent element). Riverbend tag names drop the hyphen from the
                        element name (P-101 uses RB.P101.*), so the templates use the Asset ID
                        attribute (%@Asset ID%) rather than %Element% to build each tag name.
                      </Note>
                    </>
                  ) : (
                    <Note>
                      No element is built from this template, so there is nothing to resolve.
                    </Note>
                  )}
                </div>
              )}
            </Panel>
          ) : null}
        </>
      ) : (
        <Note>This template defines no attributes of its own; derived templates add them.</Note>
      )}
    </div>
  );
}

function EventFrameTemplateView({ name }: { name: string }) {
  const t = EVENT_FRAME_TEMPLATES.find((x) => x.name === name);
  if (!t) return <Note>Template not found.</Note>;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Zap className="size-5 text-fg-muted" aria-hidden /> {t.name}
        <span className="text-sm font-normal text-fg-muted">event frame template</span>
      </h2>
      <Panel title="General">
        <dl>
          <Prop label="Description">{t.description}</Prop>
          <Prop label="Naming pattern">
            <code className="font-mono text-xs">{t.namingPattern}</code>
          </Prop>
          <Prop label="Example name">
            {applyNamingPattern(t.namingPattern, {
              template: t.name,
              element: t.elementTemplate === 'Pump' ? 'P-101' : 'K-100',
              start: new Date(2026, 9, 15, 6, 30, 0).getTime(),
            })}
          </Prop>
          <Prop label="Generated by">
            Event Frame Generation on element template {t.elementTemplate}, start trigger{' '}
            <code className="font-mono text-xs">{t.startTrigger}</code>; the frame ends when the
            trigger is no longer true.
          </Prop>
          <Prop label="Severity">{t.severityRule}</Prop>
        </dl>
      </Panel>
      <Panel title="Attribute Templates">
        <table className="w-full text-sm" aria-label="Event frame attribute templates">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>UOM</Th>
              <Th>Config string (PI Point data reference)</Th>
            </tr>
          </thead>
          <tbody>
            {t.attributes.map((a) => (
              <tr key={a.name} className="border-b border-tool-grid">
                <Td>{a.name}</Td>
                <Td>{a.uom}</Td>
                <Td className="font-mono text-xs">{a.configString}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>
          .\Elements[.] means the event frame&apos;s primary element; TimeRangeMethod picks the
          value at the start time or a summary over the frame.
        </Note>
      </Panel>
    </div>
  );
}

function EnumerationSetView({ name }: { name: string }) {
  const m = plant();
  const set = m.digitalSets.find((d) => d.name === name);
  if (!set) return <Note>Enumeration set not found.</Note>;
  const users = m.points.filter((p) => p.digitalset === name);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ListOrdered className="size-5 text-fg-muted" aria-hidden /> {set.name}
        <span className="text-sm font-normal text-fg-muted">enumeration set</span>
      </h2>
      <Panel title="Values">
        <table className="w-full max-w-md text-sm" aria-label={`${set.name} values`}>
          <thead>
            <tr>
              <Th>Value</Th>
              <Th>Name</Th>
            </tr>
          </thead>
          <tbody>
            {set.states.map((s, i) => (
              <tr key={s} className="border-b border-tool-grid">
                <Td className="font-mono">{i}</Td>
                <Td>{s}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>
          An enumeration set is an ordinal list of integer values mapped to names. This one mirrors
          the {set.name} digital state set on the Data Archive, which AF can import when a digital
          tag is mapped to an attribute.
        </Note>
      </Panel>
      <Panel title="Used by">
        <ul className="flex flex-col gap-1 text-sm">
          {users.map((p) => (
            <li key={p.tag}>
              <code className="font-mono text-xs">{p.tag}</code>{' '}
              <span className="text-fg-muted">{p.descriptor}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function CategoriesView() {
  const m = plant();
  const attrCats = [...new Set(m.templates.flatMap((t) => t.attributes.map((a) => a.category)))];
  const elCats = [...new Set(Object.values(ELEMENT_CATEGORIES).flat())];
  const group = (title: string, items: string[]) => (
    <Panel title={title}>
      <span className="flex flex-wrap gap-1">
        {items.map((c) => (
          <Badge key={c}>{c}</Badge>
        ))}
      </span>
    </Panel>
  );
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Categories</h2>
      {group('Element categories', elCats)}
      {group('Attribute categories', attrCats)}
      {group('Analysis categories', ANALYSIS_CATEGORIES)}
      <Note>
        Categories group objects for searching and filtering, for example a rollup that only reads
        attributes in one category.
      </Note>
    </div>
  );
}
