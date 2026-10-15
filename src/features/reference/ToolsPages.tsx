import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/misc';
import { Input, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import { Stat } from '@/components/ui/misc';
import { SourceList } from '@/components/content/SourceList';
import {
  afPattern,
  buildTag,
  checkTagName,
  TAGNAME_SOURCES,
  type TagPattern,
} from '@/core/tools/tagname';
import {
  ARCHIVE_SIZE_TABLE,
  archiveFileSize,
  diskEstimates,
  SIZING_SOURCES,
  tableSize,
} from '@/core/tools/sizing';
import { Code } from './ListDetail';

function Labelled({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const PARTS: { key: keyof Omit<TagPattern, 'separator' | 'upper'>; label: string; hint: string }[] =
  [
    { key: 'site', label: 'Site', hint: 'RB' },
    { key: 'area', label: 'Area (optional)', hint: 'PROC' },
    { key: 'unit', label: 'Equipment', hint: 'P101' },
    { key: 'measurement', label: 'Measurement', hint: 'FLOW' },
    { key: 'suffix', label: 'Suffix (optional)', hint: 'PV' },
  ];

export function TagNamePage() {
  const [p, setP] = useState<TagPattern>({
    site: 'RB',
    area: '',
    unit: 'P101',
    measurement: 'FLOW',
    suffix: '',
    separator: '.',
    upper: true,
  });
  const [custom, setCustom] = useState('');
  const tag = buildTag(p);
  const check = checkTagName(custom || tag);
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Tag-name generator"
        description="Build consistent PI tag names from parts, check them against the characters PI does not allow, and get the matching AF substitution pattern."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {PARTS.map((f) => (
          <Labelled key={f.key} id={`tag-${f.key}`} label={f.label}>
            <Input
              id={`tag-${f.key}`}
              value={p[f.key]}
              placeholder={f.hint}
              onChange={(e) => setP({ ...p, [f.key]: e.target.value })}
            />
          </Labelled>
        ))}
        <Labelled id="tag-sep" label="Separator">
          <Select
            id="tag-sep"
            value={p.separator}
            onChange={(e) => setP({ ...p, separator: e.target.value === '-' ? '-' : '.' })}
          >
            <option value=".">Dot (.)</option>
            <option value="-">Hyphen (-)</option>
          </Select>
        </Labelled>
        <div className="flex items-center gap-2 self-end pb-2">
          <Switch
            id="tag-upper"
            checked={p.upper}
            onCheckedChange={(v) => setP({ ...p, upper: v })}
          />
          <label htmlFor="tag-upper" className="text-sm">
            Upper case
          </label>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div>
          <div className="text-sm font-medium">Tag name</div>
          <Code>{tag || '(empty)'}</Code>
        </div>
        <div>
          <div className="text-sm font-medium">AF template attribute config string</div>
          <Code>{afPattern(p)}</Code>
          <p className="mt-1 text-xs text-fg-muted">
            Put this on a template attribute with the PI Point data reference; %Element% becomes
            each element&apos;s name, so the element must be named like P101.
          </p>
        </div>
        <Labelled id="tag-custom" label="Or check any tag name">
          <Input
            id="tag-custom"
            value={custom}
            placeholder="Type a tag name to check it"
            onChange={(e) => setCustom(e.target.value)}
          />
        </Labelled>
        <div role="status" aria-live="polite" className="text-sm">
          {check.ok ? (
            <p className="text-success">This name is valid.</p>
          ) : (
            <ul className="text-danger">
              {check.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {check.warnings.length ? (
            <ul className="mt-1 text-warning">
              {check.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="mt-8">
        <SourceList ids={TAGNAME_SOURCES} />
      </div>
    </div>
  );
}

const fmtMb = (mb: number) =>
  mb >= 1024
    ? `${(mb / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} GB`
    : `${mb.toLocaleString()} MB`;

export function SizingPage() {
  const [points, setPoints] = useState(50_000);
  const [ramGb, setRamGb] = useState(32);
  const sizing = useMemo(() => archiveFileSize(ramGb * 1024, points), [ramGb, points]);
  const disk = diskEstimates(points);
  const totalDisk = disk.reduce((a, d) => a + d.mb, 0);
  const why: Record<typeof sizing.limitedBy, string> = {
    memory: 'Limited by memory: RAM ÷ 3 was the smaller value.',
    points: 'Limited by point count: 3 × points ÷ 1024 was the smaller value.',
    minimum: 'Raised to the 256 MB minimum.',
    maximum: 'Capped at the 10,240 MB maximum.',
  };
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Sizing calculator"
        description="PI Data Archive archive-file size and starting disk estimates, using only the formulas published in OSIsoft's administration and architecture courses."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Labelled id="sz-points" label="Licensed PI points">
          <Input
            id="sz-points"
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
          />
        </Labelled>
        <Labelled id="sz-ram" label="Server memory (GB)">
          <Input
            id="sz-ram"
            type="number"
            min={1}
            value={ramGb}
            onChange={(e) => setRamGb(Math.max(1, Number(e.target.value) || 1))}
          />
        </Labelled>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Archive file size"
          value={fmtMb(sizing.recommendedMb)}
          hint={why[sizing.limitedBy]}
        />
        <Stat
          label="Course table size"
          value={fmtMb(tableSize(points))}
          hint="Default table by point count"
        />
        <Stat label="Starting disk" value={fmtMb(totalDisk)} hint="Before archive growth" />
      </div>
      <h2 className="mt-8 font-semibold">How it was worked out</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>RAM ÷ 3 = {fmtMb(Math.round(sizing.byMemoryMb))}</li>
        <li>3 × points ÷ 1024 = {fmtMb(Math.round(sizing.byPointsMb))}</li>
        <li>
          Take the smaller, round down to a power of two, keep it between 256 MB and 10,240 MB.
        </li>
      </ul>
      <h2 className="mt-6 font-semibold">Starting disk estimates</h2>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {disk.map((d) => (
            <tr key={d.label} className="border-b border-border">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right tabular-nums">{fmtMb(d.mb)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-6 font-semibold">Course default table</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-fg-muted">
            <th className="py-1 font-medium">Licensed points up to</th>
            <th className="py-1 text-right font-medium">Archive size</th>
          </tr>
        </thead>
        <tbody>
          {ARCHIVE_SIZE_TABLE.map((r) => (
            <tr key={r.mb} className="border-b border-border">
              <td className="py-1 tabular-nums">
                {r.maxPoints === null ? 'More' : r.maxPoints.toLocaleString()}
              </td>
              <td className="py-1 text-right tabular-nums">{fmtMb(r.mb)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-fg-muted">
        Sizing for PI AF, PI Vision and PI Web API servers is not covered: the published guidance we
        found is not formula-based, so it is flagged for verification rather than guessed.
      </p>
      <div className="mt-6">
        <SourceList ids={SIZING_SOURCES} />
      </div>
    </div>
  );
}
