import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { colorVar } from '../colors';
import type { ShapeSymbol as ShapeConfig, TextSymbol as TextConfig } from '../model';
import { readAt, resolveItem } from '../values';
import { multiStateOf, type SymbolEnv } from './env';

export function TextSymbol({ sym }: { sym: TextConfig }) {
  return (
    <div
      className="flex h-full items-center overflow-hidden rounded-sm px-1 leading-tight"
      style={{
        fontSize: sym.fontSize,
        fontWeight: sym.bold ? 700 : 400,
        color: colorVar(sym.color),
        background: sym.fill ? colorVar(sym.fill) : undefined,
      }}
    >
      <span className="line-clamp-3">{sym.text || 'Text'}</span>
    </div>
  );
}

/** Rectangle, ellipse or line; the fill can follow a data item through multi-state. */
export function ShapeSymbol({ sym, env }: { sym: ShapeConfig; env: SymbolEnv }) {
  const item = sym.items[0];
  const r = useMemo(() => (item ? resolveItem(item) : null), [item]);
  const t = Math.min(env.end, env.now);
  const raw = r && sym.multiState ? readAt(r, t, env.now) : null;
  const ms = multiStateOf(sym.multiState, r, raw, t, env.now);
  const fill = ms ? colorVar(ms.color) : sym.fill ? colorVar(sym.fill) : 'none';
  const stroke = colorVar(sym.stroke);
  const sw = sym.strokeWidth;
  const { w, h } = sym;
  const half = sw / 2;
  let body;
  if (sym.shape === 'rectangle') {
    body = (
      <rect
        x={half}
        y={half}
        width={Math.max(0, w - sw)}
        height={Math.max(0, h - sw)}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  } else if (sym.shape === 'ellipse') {
    body = (
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={Math.max(0, w / 2 - half)}
        ry={Math.max(0, h / 2 - half)}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  } else {
    const [x1, y1, x2, y2] =
      sym.line === 'horizontal'
        ? [0, h / 2, w, h / 2]
        : sym.line === 'vertical'
          ? [w / 2, 0, w / 2, h]
          : sym.line === 'diagonal-down'
            ? [0, 0, w, h]
            : [0, h, w, 0];
    body = (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={ms ? colorVar(ms.color) : stroke}
        strokeWidth={Math.max(1, sw)}
      />
    );
  }
  const label = ms && r ? `${sym.shape} showing ${r.label}: ${ms.state}` : sym.shape;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn('block overflow-visible', ms?.blink && 'animate-pulse')}
    >
      {body}
    </svg>
  );
}
