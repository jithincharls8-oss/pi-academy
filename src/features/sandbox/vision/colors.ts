/**
 * The colour choices offered in the configure pane. Every option maps to a design token, so a
 * display follows the app's light and dark themes and never stores a raw colour.
 */
export const TOKEN_COLORS = [
  'default',
  'muted',
  'primary',
  'ok',
  'warn',
  'alarm',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'surface',
  'surface-2',
] as const;

export type TokenColor = (typeof TOKEN_COLORS)[number];

export const COLOR_LABELS: Record<TokenColor, string> = {
  default: 'Default text',
  muted: 'Muted',
  primary: 'Primary',
  ok: 'Normal (green)',
  warn: 'Warning (amber)',
  alarm: 'Alarm (red)',
  'chart-1': 'Series 1 (blue)',
  'chart-2': 'Series 2 (orange)',
  'chart-3': 'Series 3 (teal)',
  'chart-4': 'Series 4 (magenta)',
  'chart-5': 'Series 5 (yellow)',
  'chart-6': 'Series 6 (cyan)',
  surface: 'Panel',
  'surface-2': 'Panel (shaded)',
};

const VARS: Record<TokenColor, string> = {
  default: 'var(--fg)',
  muted: 'var(--fg-muted)',
  primary: 'var(--primary)',
  ok: 'var(--tool-ok)',
  warn: 'var(--tool-alarm-warn)',
  alarm: 'var(--tool-alarm-hi)',
  'chart-1': 'var(--chart-1)',
  'chart-2': 'var(--chart-2)',
  'chart-3': 'var(--chart-3)',
  'chart-4': 'var(--chart-4)',
  'chart-5': 'var(--chart-5)',
  'chart-6': 'var(--chart-6)',
  surface: 'var(--surface)',
  'surface-2': 'var(--surface-2)',
};

/** CSS value (a `var(--token)`) for a palette colour. */
export function colorVar(c: TokenColor): string {
  return VARS[c];
}

/** Trace colours cycle through the chart series tokens. */
export const SERIES: TokenColor[] = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
];

export function seriesColor(i: number): TokenColor {
  return SERIES[i % SERIES.length] ?? 'chart-1';
}
