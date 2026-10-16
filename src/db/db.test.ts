import { describe, expect, it } from 'vitest';
import { testDb } from '@/test/db';
import { MIGRATIONS } from './migrations';
import { ContentRepo } from './contentRepo';
import { UserRepo } from './userRepo';
import { createBackup, resetUserData, restoreBackup } from './backup';
import { minimalBundle } from '@/test/fixtures';

describe('migrations', () => {
  it('applies all migrations once and is idempotent', async () => {
    const db = await testDb();
    expect(db.schemaVersion()).toBe(MIGRATIONS.length);
    expect(db.migrate(MIGRATIONS)).toEqual([]);
  });

  it('survives an export/import round trip', async () => {
    const db = await testDb();
    new UserRepo(db).toggleBookmark('lesson', 'x');
    const reopened = await testDb(db.export());
    expect(new UserRepo(reopened).isBookmarked('lesson', 'x')).toBe(true);
  });
});

describe('ContentRepo', () => {
  it('seeds on first launch and skips when the version is unchanged', async () => {
    const repo = new ContentRepo(await testDb());
    expect(repo.seed(minimalBundle())).toBe(true);
    expect(repo.seed(minimalBundle())).toBe(false);
    expect(repo.list('question')).toHaveLength(2);
    expect(repo.coverage()).toHaveLength(1);
  });

  it('lets user edits override bundle items and survive re-seeding', async () => {
    const repo = new ContentRepo(await testDb());
    repo.seed(minimalBundle());
    const original = repo.list('glossary')[0]!;
    const res = repo.upsert('glossary', {
      ...original,
      definition: 'An edited definition that is long enough.',
    });
    expect(res.ok).toBe(true);
    repo.seed({ ...minimalBundle(), version: 'v2-000000' });
    expect(repo.list('glossary')[0]!.definition).toBe('An edited definition that is long enough.');
    expect(repo.origin('glossary', original.id)).toBe('both');
    repo.revert('glossary', original.id);
    expect(repo.list('glossary')[0]!.definition).toBe(original.definition);
  });

  it('rejects invalid items with readable errors', async () => {
    const repo = new ContentRepo(await testDb());
    const res = repo.upsert('glossary', { id: 'x', term: '' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.length).toBeGreaterThan(0);
  });

  it('hides deleted bundle items and removes user-only items', async () => {
    const repo = new ContentRepo(await testDb());
    repo.seed(minimalBundle());
    const q = repo.list('question')[0]!;
    repo.remove('question', q.id);
    expect(repo.list('question').map((x) => x.id)).not.toContain(q.id);
    repo.revert('question', q.id);
    expect(repo.list('question').map((x) => x.id)).toContain(q.id);
  });
});

describe('backup and restore', () => {
  it('round-trips learner data and user content', async () => {
    const db = await testDb();
    const content = new ContentRepo(db);
    content.seed(minimalBundle());
    const user = new UserRepo(db);
    user.toggleBookmark('lesson', 'l1');
    user.saveNote('l1', 'remember compdev');
    user.logDaily('2026-10-15', 0.8);
    content.upsert('glossary', { ...content.list('glossary')[0]!, id: 'my-term', term: 'My term' });
    const backup = JSON.parse(JSON.stringify(createBackup(db))) as unknown;

    const fresh = await testDb();
    new ContentRepo(fresh).seed(minimalBundle());
    const r = restoreBackup(fresh, backup);
    expect(r.ok).toBe(true);
    const u2 = new UserRepo(fresh);
    expect(u2.isBookmarked('lesson', 'l1')).toBe(true);
    expect(u2.notes('l1')[0]?.body).toBe('remember compdev');
    expect(new ContentRepo(fresh).list('glossary').map((g) => g.id)).toContain('my-term');
  });

  it('rejects garbage and unknown columns without changing data', async () => {
    const db = await testDb();
    const user = new UserRepo(db);
    user.toggleBookmark('lesson', 'keep');
    expect(restoreBackup(db, { hello: 'world' }).ok).toBe(false);
    const bad = createBackup(db);
    bad.tables.bookmarks = [{ kind: 'lesson', item_id: 'x', created_at: 'now', evil_col: 1 }];
    expect(restoreBackup(db, bad).ok).toBe(false);
    expect(user.isBookmarked('lesson', 'keep')).toBe(true);
  });

  it('reset clears learner data', async () => {
    const db = await testDb();
    const user = new UserRepo(db);
    user.toggleBookmark('lesson', 'x');
    resetUserData(db, false);
    expect(user.bookmarks()).toHaveLength(0);
  });
});
