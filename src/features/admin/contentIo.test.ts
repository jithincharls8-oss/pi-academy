import { describe, expect, it } from 'vitest';
import {
  checkPack,
  glossaryFromCsv,
  makePack,
  parseCsv,
  toCsv,
  verificationQueue,
} from './contentIo';

const term = {
  id: 'snapshot',
  term: 'Snapshot',
  aliases: ['current value'],
  definition: 'The most recent value of a PI point, held in memory by the Data Archive.',
  domain: 'data-archive',
  coverage: [],
  related: [],
  sources: ['da-arch-workbook'],
  verify: false,
};

describe('content packs', () => {
  it('round-trips a pack and validates items', () => {
    const pack = makePack({ glossary: [term, { id: 'bad' }] }, new Date(0));
    const r = checkPack(JSON.stringify(pack));
    expect(r.valid.map((v) => v.id)).toEqual(['snapshot']);
    expect(r.errors[0]).toMatch(/^glossary bad:/);
  });

  it('rejects files that are not packs', () => {
    expect(checkPack('{"a":1}').errors[0]).toMatch(/Not a PI Academy content pack/);
    expect(checkPack('nope').errors[0]).toMatch(/Not valid JSON/);
    const unknown = JSON.stringify({ ...makePack({}), items: { widgets: [] } });
    expect(checkPack(unknown).errors).toEqual(['Unknown content type "widgets".']);
  });
});

describe('CSV', () => {
  it('quotes and parses fields with commas, quotes and newlines', () => {
    const csv = toCsv([{ a: 'x, "y"', b: 'line1\nline2', c: ['p', 'q'] }]);
    expect(parseCsv(csv)).toEqual([
      ['a', 'b', 'c'],
      ['x, "y"', 'line1\nline2', 'p|q'],
    ]);
  });

  it('imports glossary terms from exported CSV', () => {
    const r = glossaryFromCsv(toCsv([term]));
    expect(r.errors).toEqual([]);
    expect(r.valid[0]?.value).toEqual(term);
  });

  it('reports missing columns and bad rows', () => {
    expect(glossaryFromCsv('id,term\nx,y').errors[0]).toMatch(/Missing column "definition"/);
    const r = glossaryFromCsv('id,term,definition,domain,sources\nBad Id,T,short,data-archive,x');
    expect(r.errors[0]).toMatch(/^Row 2:/);
  });
});

it('builds the verification queue', () => {
  const q = verificationQueue({
    glossary: [term, { ...term, id: 'x', verify: true, verifyNote: 'check it' }],
  });
  expect(q).toEqual([{ kind: 'glossary', id: 'x', title: 'Snapshot', note: 'check it' }]);
});
