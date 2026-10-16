import { useState, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronRight, Box, Factory, Layers } from 'lucide-react';
import type { SimElement } from '@/core/sim/plant';
import { cn } from '@/lib/cn';

/** Accessible element tree (WAI-ARIA tree pattern) used by PI Vision and PSE mockups. */
export function AssetTree({
  root,
  selected,
  onSelect,
  onDragStartElement,
  label = 'Asset tree',
}: {
  root: SimElement;
  selected: string | null;
  onSelect: (e: SimElement) => void;
  onDragStartElement?: (e: SimElement, ev: React.DragEvent) => void;
  label?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set([root.id, ...root.children.map((c) => c.id)]),
  );
  const toggle = (id: string): void =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const visible: { e: SimElement; depth: number }[] = [];
  const walk = (e: SimElement, depth: number): void => {
    visible.push({ e, depth });
    if (open.has(e.id)) e.children.forEach((c) => walk(c, depth + 1));
  };
  walk(root, 0);

  const onKey = (ev: KeyboardEvent<HTMLUListElement>): void => {
    const i = visible.findIndex((v) => v.e.id === selected);
    const cur = visible[i];
    let next: SimElement | undefined;
    if (ev.key === 'ArrowDown') next = visible[Math.min(visible.length - 1, i + 1)]?.e;
    else if (ev.key === 'ArrowUp') next = visible[Math.max(0, i - 1)]?.e;
    else if (ev.key === 'ArrowRight' && cur && cur.e.children.length && !open.has(cur.e.id))
      toggle(cur.e.id);
    else if (ev.key === 'ArrowLeft' && cur && open.has(cur.e.id)) toggle(cur.e.id);
    else return;
    ev.preventDefault();
    if (next) onSelect(next);
  };

  return (
    <ul
      role="tree"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
      className="py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {visible.map(({ e, depth }) => {
        const Icon = depth === 0 ? Factory : e.children.length ? Layers : Box;
        const isOpen = open.has(e.id);
        return (
          <li
            key={e.id}
            role="treeitem"
            aria-selected={selected === e.id}
            aria-expanded={e.children.length ? isOpen : undefined}
            aria-level={depth + 1}
            draggable={Boolean(onDragStartElement)}
            onDragStart={(ev) => onDragStartElement?.(e, ev)}
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 select-none',
              selected === e.id ? 'bg-tool-select' : 'hover:bg-surface-2',
            )}
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
            onClick={() => onSelect(e)}
          >
            {e.children.length ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={isOpen ? `Collapse ${e.name}` : `Expand ${e.name}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  toggle(e.id);
                }}
                className="text-fg-muted"
              >
                {isOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            <Icon className="size-3.5 text-fg-muted" aria-hidden />
            <span className="truncate">{e.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
