import { useMemo, useState, type DragEvent } from 'react';
import { Box, Plus, Tag } from 'lucide-react';
import { allElements, plant, type SimAttribute, type SimElement } from '@/core/sim/plant';
import { AssetTree } from '@/features/sandbox/shared/AssetTree';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DRAG_MIME, encodePayload, type DragPayload } from '../dnd';
import { makeItem } from '../model';
import { searchAssets } from '../search';

function setDrag(ev: DragEvent, p: DragPayload): void {
  ev.dataTransfer.setData(DRAG_MIME, encodePayload(p));
  ev.dataTransfer.setData('text/plain', p.type === 'attribute' ? p.item : p.path);
  ev.dataTransfer.effectAllowed = 'copy';
}

const DR_LABEL: Record<SimAttribute['dataReference'], string> = {
  'PI Point': 'PI Point',
  Formula: 'Formula',
  'Table Lookup': 'Table Lookup',
  None: 'Static',
};

function AttributeRow({
  element,
  attribute,
  onAdd,
  showElement,
}: {
  element: SimElement;
  attribute: SimAttribute;
  onAdd: (p: DragPayload) => void;
  showElement?: boolean;
}) {
  const item = makeItem(element.path, attribute.name);
  const name = showElement ? `${element.name} | ${attribute.name}` : attribute.name;
  return (
    <li
      draggable
      onDragStart={(ev) => setDrag(ev, { type: 'attribute', item })}
      className="group flex cursor-grab items-center gap-1.5 rounded px-1.5 py-1 text-xs hover:bg-surface-2"
      title={`${attribute.description}${attribute.tag ? ` (${attribute.tag})` : ''}`}
    >
      <Tag className="size-3 shrink-0 text-fg-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="shrink-0 text-[10px] text-fg-subtle">
        {DR_LABEL[attribute.dataReference]}
      </span>
      <button
        type="button"
        className="rounded p-0.5 text-fg-muted hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`Add ${element.name} ${attribute.name} to the display`}
        onClick={() => onAdd({ type: 'attribute', item })}
      >
        <Plus className="size-3.5" />
      </button>
    </li>
  );
}

/**
 * Left pane in design mode: the Assets tree with the selected element's attributes, and a
 * Search pane (wildcards `*` and `?`). Everything can be dragged onto the display or added
 * with its Add button (which places it at a free spot, or adds it to the selected symbol).
 */
export function AssetPane({ onAdd }: { onAdd: (p: DragPayload) => void }) {
  const root = plant().root;
  const [selected, setSelected] = useState<SimElement>(
    () => allElements().find((e) => e.id === 'P101') ?? root,
  );
  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchAssets(allElements(), query), [query]);
  return (
    <Tabs defaultValue="assets" className="flex h-full min-h-0 flex-col">
      <TabsList className="m-2 mb-0">
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="search">Search</TabsTrigger>
      </TabsList>
      <TabsContent value="assets" className="mt-2 flex min-h-0 flex-1 flex-col">
        <div className="max-h-[45%] min-h-24 overflow-auto border-b border-tool-grid px-1">
          <AssetTree
            root={root}
            selected={selected.id}
            onSelect={setSelected}
            onDragStartElement={(e, ev) => setDrag(ev, { type: 'element', path: e.path })}
            label="Assets"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-1 px-2 pt-2 text-xs font-medium">
            <Box className="size-3.5 text-fg-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{selected.name}</span>
            <button
              type="button"
              className="flex items-center gap-0.5 rounded px-1 py-0.5 text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Add element ${selected.name} to the display`}
              onClick={() => onAdd({ type: 'element', path: selected.path })}
            >
              <Plus className="size-3.5" /> Element
            </button>
          </div>
          <p className="px-2 text-[11px] text-fg-muted">
            {selected.template ? `Template: ${selected.template}` : 'No template'}
          </p>
          <ul
            className="min-h-0 flex-1 overflow-auto p-1"
            aria-label={`Attributes of ${selected.name}`}
          >
            {selected.attributes.map((a) => (
              <AttributeRow key={a.name} element={selected} attribute={a} onAdd={onAdd} />
            ))}
            {!selected.attributes.length ? (
              <li className="px-1.5 py-1 text-xs text-fg-muted">This element has no attributes.</li>
            ) : null}
          </ul>
        </div>
      </TabsContent>
      <TabsContent value="search" className="mt-2 flex min-h-0 flex-1 flex-col px-2">
        <label htmlFor="vision-search" className="text-xs font-medium">
          Search assets and attributes
        </label>
        <Input
          id="vision-search"
          className="mt-1 h-8"
          value={query}
          placeholder="e.g. P-1?3, *Temp, Flow"
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="mt-1 text-[11px] text-fg-muted">
          * matches anything and is assumed at the end; ? matches one character.
        </p>
        <ul className="mt-1 min-h-0 flex-1 overflow-auto" aria-label="Search results">
          {hits.map((h) =>
            h.attribute ? (
              <AttributeRow
                key={`${h.element.id}|${h.attribute.name}`}
                element={h.element}
                attribute={h.attribute}
                onAdd={onAdd}
                showElement
              />
            ) : (
              <li
                key={h.element.id}
                draggable
                onDragStart={(ev) => setDrag(ev, { type: 'element', path: h.element.path })}
                className="flex cursor-grab items-center gap-1.5 rounded px-1.5 py-1 text-xs hover:bg-surface-2"
              >
                <Box className="size-3 shrink-0 text-fg-muted" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{h.element.name}</span>
                <span className="shrink-0 text-[10px] text-fg-subtle">
                  {h.element.template ?? 'Element'}
                </span>
                <button
                  type="button"
                  className="rounded p-0.5 text-fg-muted hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label={`Add element ${h.element.name} to the display`}
                  onClick={() => onAdd({ type: 'element', path: h.element.path })}
                >
                  <Plus className="size-3.5" />
                </button>
              </li>
            ),
          )}
          {query.trim() && !hits.length ? (
            <li className="py-1 text-xs text-fg-muted">No matches.</li>
          ) : null}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
