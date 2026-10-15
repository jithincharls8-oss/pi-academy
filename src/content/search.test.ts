import { describe, expect, it } from 'vitest';
import { testDb } from '@/test/db';
import { ContentRepo } from '@/db/contentRepo';
import { minimalBundle } from '@/test/fixtures';
import { SearchIndex, buildSearchDocs } from './search';

async function index(): Promise<SearchIndex> {
  const repo = new ContentRepo(await testDb());
  repo.seed(minimalBundle());
  return new SearchIndex(buildSearchDocs(repo.library()));
}

describe('SearchIndex', () => {
  it('finds glossary terms by alias with prefix matching', async () => {
    const idx = await index();
    const hits = idx.search('tag');
    expect(hits[0]).toMatchObject({ kind: 'glossary', id: 'pi-point' });
  });

  it('filters by kind and ignores one-character queries', async () => {
    const idx = await index();
    expect(idx.search('element', { kinds: ['glossary'] })).toHaveLength(0);
    expect(idx.search('element', { kinds: ['question'] })[0]?.id).toBe('q-two');
    expect(idx.search('e')).toEqual([]);
  });

  it('tolerates small typos', async () => {
    const idx = await index();
    expect(idx.search('atributes').length).toBeGreaterThan(0);
  });
});
