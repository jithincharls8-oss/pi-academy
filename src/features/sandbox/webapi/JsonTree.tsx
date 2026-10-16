import { useState } from 'react';
import { ChevronDown, ChevronRight, ScanSearch } from 'lucide-react';
import { WEBID_PATTERN, controllerFor, decodeWebId } from './webid';

const LINK_PREFIX = /^https?:\/\/[^/]+(\/piwebapi.*)$/i;

/**
 * Collapsible pretty JSON. Links values and WebIds are buttons: a link loads that URL as the
 * next request (HATEOAS navigation); a WebId opens its object or goes to the decoder.
 */
export function JsonTree({
  value,
  onNavigate,
  onDecode,
}: {
  value: unknown;
  onNavigate: (url: string) => void;
  onDecode: (webId: string) => void;
}) {
  return (
    <div className="font-mono text-xs leading-5" role="tree" aria-label="Response JSON">
      <Node name={null} value={value} depth={0} onNavigate={onNavigate} onDecode={onDecode} last />
    </div>
  );
}

function Scalar({
  name,
  value,
  onNavigate,
  onDecode,
}: {
  name: string | null;
  value: string | number | boolean | null;
  onNavigate: (url: string) => void;
  onDecode: (webId: string) => void;
}) {
  if (typeof value !== 'string') {
    return (
      <span className={typeof value === 'number' ? 'text-chart-2' : 'text-chart-5'}>
        {String(value)}
      </span>
    );
  }
  const link = LINK_PREFIX.exec(value);
  if (link?.[1]) {
    const path = link[1];
    return (
      <button
        type="button"
        onClick={() => onNavigate(path)}
        className="break-all text-left text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        title={`Load ${path}`}
      >
        &quot;{value}&quot;
      </button>
    );
  }
  const isWebId = (name === 'WebId' || WEBID_PATTERN.test(value)) && decodeWebId(value).ok;
  if (isWebId) {
    const d = decodeWebId(value);
    const ctrl = d.marker ? controllerFor(d.marker) : null;
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {ctrl ? (
          <button
            type="button"
            onClick={() => onNavigate(`/piwebapi/${ctrl}/${value}`)}
            className="break-all text-left text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            title={`Load /piwebapi/${ctrl}/${value}`}
          >
            &quot;{value}&quot;
          </button>
        ) : (
          <span className="break-all text-chart-3">&quot;{value}&quot;</span>
        )}
        <button
          type="button"
          onClick={() => onDecode(value)}
          aria-label={`Decode WebID ${value}`}
          className="rounded p-0.5 text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ScanSearch className="size-3.5" aria-hidden />
        </button>
      </span>
    );
  }
  return <span className="break-all text-chart-3">&quot;{value}&quot;</span>;
}

function Node({
  name,
  value,
  depth,
  onNavigate,
  onDecode,
  last,
  inArray = false,
}: {
  inArray?: boolean;
  name: string | null;
  value: unknown;
  depth: number;
  onNavigate: (url: string) => void;
  onDecode: (webId: string) => void;
  last: boolean;
}) {
  const isArr = Array.isArray(value);
  const isObj = !!value && typeof value === 'object';
  const entries: [string, unknown][] = isObj
    ? isArr
      ? (value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>)
    : [];
  const [open, setOpen] = useState(depth < 3 && entries.length <= 60);
  const comma = last ? '' : ',';
  const label =
    name !== null && !inArray ? <span className="text-fg">&quot;{name}&quot;: </span> : null;
  const pad = { paddingLeft: `${depth * 14}px` };

  if (!isObj) {
    return (
      <div role="treeitem" aria-selected={false} style={pad} className="pl-4">
        {label}
        <Scalar
          name={name}
          value={value as string | number | boolean | null}
          onNavigate={onNavigate}
          onDecode={onDecode}
        />
        {comma}
      </div>
    );
  }
  const [o, c] = isArr ? ['[', ']'] : ['{', '}'];
  if (entries.length === 0) {
    return (
      <div role="treeitem" aria-selected={false} style={pad} className="pl-4">
        {label}
        {o}
        {c}
        {comma}
      </div>
    );
  }
  return (
    <div role="treeitem" aria-selected={false} aria-expanded={open}>
      <div style={pad} className="flex items-start">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${name ?? 'root'}`}
          className="mt-0.5 mr-0.5 rounded text-fg-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <span>
          {label}
          {o}
          {open ? null : (
            <span className="text-fg-muted">
              {' '}
              {entries.length} {isArr ? 'items' : 'keys'} {c}
              {comma}
            </span>
          )}
        </span>
      </div>
      {open ? (
        <div role="group">
          {entries.map(([k, v], i) => (
            <Node
              key={k}
              name={k}
              inArray={isArr}
              value={v}
              depth={depth + 1}
              onNavigate={onNavigate}
              onDecode={onDecode}
              last={i === entries.length - 1}
            />
          ))}
          <div style={pad} className="pl-4">
            {c}
            {comma}
          </div>
        </div>
      ) : null}
    </div>
  );
}
