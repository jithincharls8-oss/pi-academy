/**
 * WebID 2.0 decoder. Layout from research/int.md (int.webapi-basics): character 1 is the type
 * letter, character 2 the version, characters 3-4 the object-type marker, then an optional
 * owner marker, then Base64url-encoded IDs and/or path. GUIDs take 22 characters, a PI point
 * ID 6 characters; a PathOnly WebID encodes the UPPERCASE path.
 */

export const WEBID_TYPES: Record<string, string> = {
  F: 'Full: encodes IDs and path; longest; most resilient',
  I: 'IDOnly: object IDs only; survives moves and renames, invalid after delete',
  P: 'PathOnly: path only; breaks on rename; always points to whatever is at that path',
  L: 'LocalIDOnly: not persistent or unique, not compatible with load balancers',
  D: 'DefaultIDOnly: not persistent or unique, not compatible with load balancers',
};

export const WEBID_MARKERS: Record<string, string> = {
  DP: 'PI Point',
  DS: 'PI Data Server',
  RS: 'AF (asset) server',
  RD: 'Asset database',
  Em: 'Element',
  EC: 'Element category',
  ET: 'Element template',
  Ab: 'Attribute',
  AC: 'Attribute category',
  AT: 'Attribute template',
  Fm: 'Event frame',
  MS: 'Enumeration set',
  MV: 'Enumeration value',
  Bl: 'Table',
  BC: 'Table category',
  Ut: 'Unit',
  UC: 'Unit class',
  Xs: 'Analysis',
  XC: 'Analysis category',
  XT: 'Analysis template',
  XR: 'Analysis rule',
  XP: 'Analysis rule plug-in',
  TR: 'Time rule',
  TP: 'Time rule plug-in',
  SI: 'Security identity',
  SM: 'Security mapping',
};

export const OWNER_MARKERS: Record<string, string> = {
  R: 'asset server',
  D: 'data server',
  X: 'analysis',
  T: 'analysis template',
  E: 'element (or element template)',
  F: 'event frame',
};

/** Object types whose WebIDs carry an owner marker. */
const OWNED = new Set(['Ab', 'AT', 'MS', 'MV', 'XR', 'TR']);

export interface WebIdPart {
  role: 'type' | 'version' | 'marker' | 'owner' | 'guid' | 'pointid' | 'path' | 'rest';
  label: string;
  chars: string;
  meaning: string;
}

export interface DecodedWebId {
  ok: boolean;
  parts: WebIdPart[];
  /** decoded path for PathOnly and Full WebIDs */
  path: string | null;
  marker: string | null;
  error: string | null;
}

function b64urlBytes(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function b64urlText(s: string): string | null {
  const b = b64urlBytes(s);
  if (!b) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
  } catch {
    return null;
  }
}

/** 22 Base64url characters -> GUID text, in .NET byte order. */
export function guidFromChars(s: string): string | null {
  const b = b64urlBytes(s);
  if (!b || b.length !== 16) return null;
  const h = (i: number): string => (b[i] ?? 0).toString(16).padStart(2, '0');
  const le = (idx: number[]): string => idx.map(h).join('');
  return `${le([3, 2, 1, 0])}-${le([5, 4])}-${le([7, 6])}-${le([8, 9])}-${le([10, 11, 12, 13, 14, 15])}`;
}

function pointId(s: string): number | null {
  const b = b64urlBytes(s);
  if (!b || b.length < 4) return null;
  return ((b[0] ?? 0) | ((b[1] ?? 0) << 8) | ((b[2] ?? 0) << 16) | ((b[3] ?? 0) << 24)) >>> 0;
}

export function decodeWebId(input: string): DecodedWebId {
  const id = input.trim();
  const fail = (error: string, parts: WebIdPart[] = []): DecodedWebId => ({
    ok: false,
    parts,
    path: null,
    marker: null,
    error,
  });
  if (id.length < 5) return fail('A WebID 2.0 has at least a type, version, marker and payload.');
  const parts: WebIdPart[] = [];
  const type = id[0] ?? '';
  if (!WEBID_TYPES[type]) {
    return fail(
      `"${type}" is not a WebID 2.0 type letter (F, I, P, L or D). WebID 1.0 values were opaque and cannot be decoded.`,
    );
  }
  parts.push({ role: 'type', label: 'Type', chars: type, meaning: WEBID_TYPES[type] ?? '' });
  const version = id[1] ?? '';
  parts.push({
    role: 'version',
    label: 'Version',
    chars: version,
    meaning: version === '1' ? 'WebID 2.0 format version 1' : 'Unexpected version',
  });
  if (version !== '1') return fail('The second character (version) should be 1.', parts);
  const marker = id.slice(2, 4);
  const markerMeaning = WEBID_MARKERS[marker];
  if (!markerMeaning) return fail(`"${marker}" is not a known object-type marker.`, parts);
  parts.push({ role: 'marker', label: 'Object marker', chars: marker, meaning: markerMeaning });
  let pos = 4;
  let owner = '';
  const ownerChar = id[4] ?? '';
  if (OWNED.has(marker) && OWNER_MARKERS[ownerChar]) {
    owner = ownerChar;
    parts.push({
      role: 'owner',
      label: 'Owner marker',
      chars: owner,
      meaning: `owned by an ${OWNER_MARKERS[ownerChar]}`,
    });
    pos = 5;
  }
  let rest = id.slice(pos);
  let path: string | null = null;

  if (type === 'F' || type === 'I') {
    const guids: { label: string; role: 'guid' | 'pointid'; n: number }[] =
      marker === 'DP'
        ? [
            { label: 'Data server GUID', role: 'guid', n: 22 },
            { label: 'Point ID', role: 'pointid', n: 6 },
          ]
        : owner
          ? [
              { label: 'Owner GUID', role: 'guid', n: 22 },
              { label: `${markerMeaning} GUID`, role: 'guid', n: 22 },
            ]
          : [{ label: `${markerMeaning} GUID`, role: 'guid', n: 22 }];
    for (const g of guids) {
      const chars = rest.slice(0, g.n);
      if (chars.length < g.n) return fail(`The ${g.label} needs ${g.n} characters.`, parts);
      const meaning =
        g.role === 'guid'
          ? (guidFromChars(chars) ?? 'not a valid GUID encoding')
          : `point ID ${pointId(chars) ?? '?'} (4-byte little-endian integer)`;
      parts.push({ role: g.role, label: g.label, chars, meaning });
      rest = rest.slice(g.n);
    }
  }
  if (type === 'F' || type === 'P') {
    path = rest ? b64urlText(rest) : null;
    if (rest && path === null) return fail('The path part is not valid Base64url UTF-8.', parts);
    // The encoding leaves out the leading \\; add it back so the path reads as a full path.
    if (path !== null && !path.startsWith('\\\\')) path = `\\\\${path}`;
    parts.push({
      role: 'path',
      label: 'Path (Base64url)',
      chars: rest,
      meaning: path ?? '(empty)',
    });
  } else if (rest) {
    parts.push({ role: 'rest', label: 'Remaining', chars: rest, meaning: 'not decoded' });
  }
  return { ok: true, parts, path, marker, error: null };
}

/** Controller that serves an object of this marker, for "open this WebID" navigation. */
export function controllerFor(marker: string): string | null {
  const map: Record<string, string> = {
    DP: 'points',
    DS: 'dataservers',
    RS: 'assetservers',
    RD: 'assetdatabases',
    Em: 'elements',
    Ab: 'attributes',
  };
  return map[marker] ?? null;
}

export const WEBID_PATTERN = /^[FIPLD]1[A-Z][A-Za-z][A-Za-z0-9_-]{2,}$/;
