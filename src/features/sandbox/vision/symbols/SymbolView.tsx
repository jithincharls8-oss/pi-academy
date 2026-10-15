import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { collectionRect, membersFor } from '../collections';
import { matchingElements } from '../criteria';
import type { CollectionSymbol as CollectionConfig, VisionSymbol } from '../model';
import { AssetTableSymbol } from './AssetTableSymbol';
import { BarSymbol } from './BarSymbol';
import type { SymbolEnv } from './env';
import { EventTableSymbol } from './EventTableSymbol';
import { GaugeSymbol } from './GaugeSymbol';
import { ShapeSymbol, TextSymbol } from './StaticSymbols';
import { TableSymbol } from './TableSymbol';
import { TrendSymbol } from './TrendSymbol';
import { ValueSymbol } from './ValueSymbol';
import { XySymbol } from './XySymbol';

/** Whether a symbol draws its own panel background (shapes and text are transparent). */
export function hasPanel(s: VisionSymbol): boolean {
  return s.kind !== 'shape' && s.kind !== 'text' && s.kind !== 'collection';
}

/** The body of a symbol, sized by its container. */
export function SymbolBody({ sym, env }: { sym: VisionSymbol; env: SymbolEnv }) {
  switch (sym.kind) {
    case 'value':
      return <ValueSymbol sym={sym} env={env} />;
    case 'trend':
      return <TrendSymbol sym={sym} env={env} />;
    case 'table':
      return <TableSymbol sym={sym} env={env} />;
    case 'bar':
      return <BarSymbol sym={sym} env={env} />;
    case 'gauge':
      return <GaugeSymbol sym={sym} env={env} />;
    case 'xy':
      return <XySymbol sym={sym} env={env} />;
    case 'assetTable':
      return <AssetTableSymbol sym={sym} env={env} />;
    case 'eventTable':
      return <EventTableSymbol sym={sym} env={env} />;
    case 'text':
      return <TextSymbol sym={sym} />;
    case 'shape':
      return <ShapeSymbol sym={sym} env={env} />;
    case 'collection':
      return <CollectionBody sym={sym} env={env} />;
  }
}

/** Elements a collection currently shows (criteria re-evaluated as values change). */
export function useCollectionElements(sym: VisionSymbol, env: SymbolEnv) {
  const t = Math.min(env.end, env.now);
  const now = env.now;
  return useMemo(
    () =>
      sym.kind === 'collection' ? matchingElements(sym.template, sym.root, sym.filter, t, now) : [],
    [sym, t, now],
  );
}

function CollectionBody({ sym, env }: { sym: CollectionConfig; env: SymbolEnv }) {
  const elements = useCollectionElements(sym, env);
  const rect = collectionRect(sym, elements.length);
  return (
    <div
      className="relative"
      style={{ width: rect.w, height: rect.h }}
      role="group"
      aria-label={`Collection of ${elements.length} ${sym.template} elements`}
    >
      {elements.length === 0 ? (
        <div className="p-2 text-xs text-fg-muted">
          No {sym.template} elements match the collection criteria.
        </div>
      ) : null}
      {elements.map((e, i) =>
        membersFor(sym, e.path, i).map((m) => (
          <div
            key={m.id}
            className={cn(
              'absolute overflow-hidden',
              hasPanel(m) && 'rounded border border-tool-grid bg-surface',
            )}
            style={{ left: m.x, top: m.y, width: m.w, height: m.h }}
          >
            <SymbolBody sym={m} env={env} />
          </div>
        )),
      )}
    </div>
  );
}
