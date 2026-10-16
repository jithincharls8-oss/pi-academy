/**
 * Point Builder validation (zod). Hard rules block "Apply"; advice is shown but never blocks.
 *
 * Sourced rules (research/da.md): digital points need a digital set; deviations and times are
 * non-negative; CompMax must not be below CompMin; TypicalValue lies between Zero and
 * Zero + Span; tag names are unique. The tag-name character rules are a sandbox rule set:
 * research only records that a PI-based historian requires names to start with a letter,
 * digit or %, so check AVEVA's documentation for the exact rules.
 */
import { z } from 'zod';
import { DIGITAL_SETS } from '@/core/sim/plant';
import { POINT_TYPES, type SandboxPoint } from './points';

export const TAG_MAX_LENGTH = 255;
/** Characters the sandbox refuses in tag names (wildcards, separators and quotes). */
export const TAG_FORBIDDEN = ['*', '?', ';', '{', '}', '[', ']', '|', '\\', "'", '"', '`'];

/** ACL string such as `piadmins: A(r,w) | PIWorld: A(r)`; `A()` means no access. */
const ACL_ENTRY = String.raw`[^:|()]+:\s*A\(\s*(r\s*,\s*w|r|w)?\s*\)`;
export const ACL_PATTERN = new RegExp(`^\\s*${ACL_ENTRY}(\\s*\\|\\s*${ACL_ENTRY})*\\s*$`, 'i');

const nonNegative = (label: string) =>
  z.number({ error: `${label} must be a number` }).min(0, `${label} cannot be negative`);
const nonNegInt = (label: string) => nonNegative(label).int(`${label} must be a whole number`);
const whole = (label: string) =>
  z.number({ error: `${label} must be a number` }).int(`${label} must be a whole number`);

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tag name is required')
  .max(TAG_MAX_LENGTH, `Tag name is limited to ${TAG_MAX_LENGTH} characters in this sandbox`)
  .refine((t) => /^[A-Za-z0-9%]/.test(t), 'Tag name must start with a letter, a digit or %')
  .refine(
    (t) => !TAG_FORBIDDEN.some((c) => t.includes(c)),
    `Tag name cannot contain ${TAG_FORBIDDEN.join(' ')}`,
  )
  .refine(
    (t) => [...t].every((c) => c.charCodeAt(0) >= 32),
    'Tag name cannot contain control characters',
  );

export const pointSchema = z
  .object({
    tag: tagSchema,
    descriptor: z.string().max(255, 'Descriptor is limited to 255 characters in this sandbox'),
    pointtype: z.enum(POINT_TYPES as [string, ...string[]]),
    digitalset: z.string(),
    pointsource: z.string().trim().min(1, 'Point source is required'),
    zero: z.number({ error: 'Zero must be a number' }),
    span: z.number({ error: 'Span must be a number' }),
    typicalvalue: z.number({ error: 'Typical value must be a number' }),
    displaydigits: whole('Display digits'),
    excdev: nonNegative('ExcDev'),
    excmin: nonNegInt('ExcMin'),
    excmax: nonNegInt('ExcMax'),
    compdev: nonNegative('CompDev'),
    compmin: nonNegInt('CompMin'),
    compmax: nonNegInt('CompMax'),
    location1: whole('Location1'),
    location2: whole('Location2'),
    location3: whole('Location3'),
    location4: whole('Location4'),
    location5: whole('Location5'),
    userint1: whole('UserInt1'),
    userint2: whole('UserInt2'),
    userreal1: z.number(),
    userreal2: z.number(),
    ptsecurity: z
      .string()
      .regex(ACL_PATTERN, 'PtSecurity must look like "piadmins: A(r,w) | PIWorld: A(r)"'),
    datasecurity: z
      .string()
      .regex(ACL_PATTERN, 'DataSecurity must look like "piadmins: A(r,w) | PIWorld: A(r)"'),
  })
  .superRefine((p, ctx) => {
    const digital = p.pointtype === 'Digital';
    const numeric = !digital && p.pointtype !== 'String';
    if (digital) {
      if (!p.digitalset) {
        ctx.addIssue({
          code: 'custom',
          path: ['digitalset'],
          message: 'A digital point needs a digital set',
        });
      } else if (!DIGITAL_SETS.some((d) => d.name.toLowerCase() === p.digitalset.toLowerCase())) {
        ctx.addIssue({
          code: 'custom',
          path: ['digitalset'],
          message: `Unknown digital set "${p.digitalset}"`,
        });
      }
    }
    if (numeric && p.span <= 0) {
      ctx.addIssue({ code: 'custom', path: ['span'], message: 'Span must be greater than 0' });
    }
    if (numeric && p.span > 0 && (p.typicalvalue < p.zero || p.typicalvalue > p.zero + p.span)) {
      ctx.addIssue({
        code: 'custom',
        path: ['typicalvalue'],
        message: 'Typical value must lie between Zero and Zero + Span',
      });
    }
    if (p.compmax < p.compmin) {
      ctx.addIssue({
        code: 'custom',
        path: ['compmax'],
        message: 'CompMax must be at least CompMin',
      });
    }
    if (p.excmax > 0 && p.excmax < p.excmin) {
      ctx.addIssue({ code: 'custom', path: ['excmax'], message: 'ExcMax must be at least ExcMin' });
    }
  });

export interface FieldIssue {
  field: string;
  message: string;
}

export type ValidationResult = { ok: true } | { ok: false; issues: FieldIssue[] };

/** Validate a point; `others` are the remaining points (for the unique-name rule). */
export function validatePoint(p: SandboxPoint, others: readonly SandboxPoint[]): ValidationResult {
  const issues: FieldIssue[] = [];
  const parsed = pointSchema.safeParse(p);
  if (!parsed.success) {
    for (const i of parsed.error.issues)
      issues.push({ field: String(i.path[0] ?? 'tag'), message: i.message });
  }
  const t = p.tag.trim().toUpperCase();
  if (others.some((o) => o.tag.toUpperCase() === t)) {
    issues.push({ field: 'tag', message: `A point named ${p.tag.trim()} already exists` });
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

/** Non-blocking advice drawn from the exception/compression guidance in research. */
export function adviseSettings(p: SandboxPoint): string[] {
  const out: string[] = [];
  const digital = p.pointtype === 'Digital';
  if (
    !digital &&
    p.compressing &&
    p.compdev > 0 &&
    Math.abs(p.excdev - p.compdev / 2) > p.compdev * 0.25
  ) {
    out.push(`Rule of thumb: ExcDev about half of CompDev (here ${round(p.compdev / 2)}).`);
  }
  if (!p.compressing) out.push('Compressing is off: every snapshot event is archived.');
  if (p.compressing && p.compdev === 0 && !digital)
    out.push(
      'CompDev 0 still drops repeated identical values; turn Compressing off to keep every event.',
    );
  if (p.step && p.compdev > 0 && !digital)
    out.push('Step is on with CompDev above 0: interpolated results can be wrong.');
  if (digital && (p.excdev > 0 || p.compdev > 0))
    out.push('ExcDev and CompDev have no effect on digital points.');
  if (p.excmax > 0 && p.excmax < p.scan)
    out.push('ExcMax is shorter than the scan period, so every scan is sent.');
  if (p.excmin > 0) out.push('ExcMin only blocks values; it never forces one to be sent.');
  if (!p.scanflag) out.push('Scan is off: the interface will not collect this point.');
  if (!p.archiving) out.push('Archiving is off: values reach the snapshot but are never stored.');
  return out;
}

function round(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}
