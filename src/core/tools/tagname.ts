/**
 * Tag-name helper. Rules from research/adm.md (adm.naming): these characters are not allowed in
 * PI tag names: ' " ? ; { } [ ] | \ ` and control characters. `_` and `%` are allowed but cause
 * trouble in SQL-based tools, so they are warned about.
 */

export const TAGNAME_SOURCES = [
  'adm-pisquare-valid-tag-names',
  'adm-easy-wins-af',
  'adm-building-assets-workbook',
];

const FORBIDDEN = /['"?;{}[\]|\\`]/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/;

export interface TagCheck {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function checkTagName(name: string): TagCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!name.trim()) errors.push('The tag name is empty.');
  if (CONTROL.test(name))
    errors.push('Control characters such as tabs and line breaks are not allowed.');
  const bad = [...new Set([...name].filter((c) => FORBIDDEN.test(c)))];
  if (bad.length) errors.push(`These characters are not allowed: ${bad.join(' ')}`);
  if (/[_%]/.test(name))
    warnings.push('"_" and "%" are allowed but cause problems in SQL-based tools.');
  if (name !== name.trim())
    warnings.push('Leading or trailing spaces are easy to miss; avoid them.');
  if (/[^\x20-\x7e]/.test(name)) {
    warnings.push('Non-ASCII characters are stored as raw bytes; readers need the same encoding.');
  }
  return { ok: errors.length === 0, errors, warnings };
}

export interface TagPattern {
  site: string;
  area: string;
  unit: string;
  measurement: string;
  suffix: string;
  separator: '.' | '-';
  upper: boolean;
}

/** Build a tag from parts, skipping empty ones: e.g. RB.PROC.P101.FLOW.PV */
export function buildTag(p: TagPattern): string {
  const parts = [p.site, p.area, p.unit, p.measurement, p.suffix]
    .map((s) => s.trim().replace(/\s+/g, ''))
    .filter(Boolean);
  const tag = parts.join(p.separator);
  return p.upper ? tag.toUpperCase() : tag;
}

/** AF substitution pattern equivalent for a template attribute's PI Point data reference. */
export function afPattern(p: TagPattern): string {
  const parts = [p.site, p.area, '%Element%', p.measurement, p.suffix]
    .map((s) => s.trim().replace(/\s+/g, ''))
    .filter(Boolean)
    .map((s) => (p.upper && s !== '%Element%' ? s.toUpperCase() : s));
  return `\\\\%Server%\\${parts.join(p.separator)}`;
}
