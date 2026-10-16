import { useState } from 'react';
import { Box, Undo2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label, Textarea } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SimElement } from '@/core/sim/plant';
import { AttributesTab } from './AttributesTab';
import { AnalysesTab } from './AnalysesTab';
import { ELEMENT_CATEGORIES, NOTIFICATION_RULES } from './catalog';
import { checkedInValue, field, isCheckedOut } from './checkout';
import type { ExplorerModel } from './model';
import { CheckedOutMark, Note, Panel, Prop, selectableRow, Td, Th } from './ui';

export type ElementTab = 'general' | 'children' | 'attributes' | 'analyses' | 'notifications';

export function ElementViewer({
  base,
  model,
  tab,
  onTab,
  onOpenElement,
  onOpenTemplate,
  onCheckIn,
}: {
  base: SimElement;
  model: ExplorerModel;
  tab: ElementTab;
  onTab: (t: ElementTab) => void;
  onOpenElement: (e: SimElement) => void;
  onOpenTemplate: (name: string) => void;
  onCheckIn: () => void;
}) {
  const el = model.working(base);
  const out = isCheckedOut(model.state, base.id);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Box className="size-5 text-fg-muted" aria-hidden />
        <h2 className="text-lg font-semibold">{el.name}</h2>
        {out ? (
          <span className="flex items-center gap-1 text-xs text-warning">
            <CheckedOutMark /> Checked out by you
          </span>
        ) : null}
        {out ? (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="success" onClick={onCheckIn}>
              <Upload /> Check In
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => model.dispatch({ type: 'undoCheckOut', objects: [base.id] })}
            >
              <Undo2 /> Undo Check Out
            </Button>
          </div>
        ) : null}
      </div>
      <p className="font-mono text-xs break-all text-fg-muted">{el.path}</p>
      <Tabs value={tab} onValueChange={(v) => onTab(v as ElementTab)}>
        <TabsList aria-label="Element views">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="children">Child Elements</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="notifications">Notification Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab base={base} model={model} onOpenTemplate={onOpenTemplate} />
        </TabsContent>
        <TabsContent value="children">
          <ChildrenTab el={el} onOpen={onOpenElement} />
        </TabsContent>
        <TabsContent value="attributes">
          <AttributesTab base={base} model={model} />
        </TabsContent>
        <TabsContent value="analyses">
          <AnalysesTab base={base} model={model} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab el={el} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralTab({
  base,
  model,
  onOpenTemplate,
}: {
  base: SimElement;
  model: ExplorerModel;
  onOpenTemplate: (name: string) => void;
}) {
  const el = model.working(base);
  const [draft, setDraft] = useState(el.description);
  const [synced, setSynced] = useState(el.description);
  if (synced !== el.description) {
    setSynced(el.description);
    setDraft(el.description);
  }
  const othersSee = checkedInValue(model.state, base.id, field.description);
  const commit = (): void => {
    if (draft !== el.description) {
      model.dispatch({ type: 'edit', object: base.id, field: field.description, value: draft });
    }
  };
  const categories = (el.template && ELEMENT_CATEGORIES[el.template]) || [];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="General">
        <dl>
          <Prop label="Name">{el.name}</Prop>
          <Prop label="Template">
            {el.template ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => onOpenTemplate(el.template ?? '')}
              >
                {el.template}
              </Button>
            ) : (
              '<None>'
            )}
          </Prop>
          <Prop label="Categories">
            {categories.length ? (
              <span className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </span>
            ) : (
              <span className="text-fg-muted">None</span>
            )}
          </Prop>
          <Prop label="Child elements">{el.children.length}</Prop>
          <Prop label="Attributes">{el.attributes.length}</Prop>
          <Prop label="Reference type">Parent-Child</Prop>
        </dl>
        <div className="mt-3 flex flex-col gap-1">
          <Label htmlFor={`desc-${base.id}`} className="text-xs">
            Description
          </Label>
          <Textarea
            id={`desc-${base.id}`}
            className="min-h-16"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
            }}
          />
          <Note>Press Enter or leave the box to apply. Editing checks the element out.</Note>
        </div>
      </Panel>
      <Panel title="Check-out status">
        {isCheckedOut(model.state, base.id) ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              You have this element checked out. Your edits live in your sandbox: other users and
              services still see the checked-in version until you Check In.
            </p>
            <dl>
              <Prop label="You see">{el.description}</Prop>
              <Prop label="Others see">
                {typeof othersSee === 'string' ? othersSee : base.description}
              </Prop>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">
            Checked in. Edit the description, an attribute value, a PI Point data reference or an
            analysis to check the element out (a pencil appears).
          </p>
        )}
      </Panel>
    </div>
  );
}

function ChildrenTab({ el, onOpen }: { el: SimElement; onOpen: (e: SimElement) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  if (!el.children.length) return <Note>{el.name} has no child elements.</Note>;
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table role="grid" aria-label={`Child elements of ${el.name}`} className="w-full text-sm">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Template</Th>
              <Th>Children</Th>
            </tr>
          </thead>
          <tbody>
            {el.children.map((c) => (
              <tr
                key={c.id}
                {...selectableRow(
                  sel === c.id,
                  () => setSel(c.id),
                  () => onOpen(c),
                )}
              >
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.description}</Td>
                <Td>{c.template ?? '<None>'}</Td>
                <Td>{c.children.length}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note>Double-click a row or press Enter to open the element.</Note>
    </div>
  );
}

function NotificationsTab({ el }: { el: SimElement }) {
  const rules = NOTIFICATION_RULES.filter(
    (r) =>
      r.target.includes(el.name) || (el.template && r.target.includes(`template ${el.template}`)),
  );
  if (!rules.length) {
    return (
      <Note>
        No notification rules target {el.name}. Notification rules are triggered by event frames, so
        they sit on elements (or element templates) that have event frames.
      </Note>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {rules.map((r) => (
        <Panel
          key={r.name}
          title={r.name}
          actions={<Badge tone={r.status === 'Enabled' ? 'success' : 'neutral'}>{r.status}</Badge>}
        >
          <dl>
            <Prop label="Applies to">{r.target}</Prop>
            <Prop label="Trigger">{r.criteria}</Prop>
            <Prop label="Notify on">{r.notifyOn}</Prop>
            <Prop label="Subscriptions">
              <ul className="list-disc pl-4">
                {r.subscriptions.map((s) => (
                  <li key={s.contact}>
                    {s.contact} ({s.channel}, format &quot;{s.format}&quot;)
                  </li>
                ))}
              </ul>
            </Prop>
          </dl>
        </Panel>
      ))}
      <Note>Read-only in this sandbox. See the Notification Rules section for more.</Note>
    </div>
  );
}
