import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { autosave, indexedDbPersistence, memoryPersistence } from './persistence';
import { testDb } from '@/test/db';
import { UserRepo } from './userRepo';

describe('indexedDbPersistence', () => {
  it('stores and loads the database image', async () => {
    const p = indexedDbPersistence();
    expect(await p.load()).toBeNull();
    await p.save(new Uint8Array([1, 2, 3]));
    expect(Array.from((await p.load()) ?? [])).toEqual([1, 2, 3]);
  });
});

describe('autosave', () => {
  it('debounces writes and flushes the latest state', async () => {
    vi.useFakeTimers();
    const db = await testDb();
    const p = memoryPersistence();
    const save = vi.spyOn(p, 'save');
    const a = autosave(
      (fn) => db.onChange(fn),
      () => db.export(),
      p,
      100,
    );
    const user = new UserRepo(db);
    user.toggleBookmark('lesson', 'a');
    user.toggleBookmark('lesson', 'b');
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(150);
    expect(save).toHaveBeenCalledTimes(1);
    const restored = await testDb((await p.load())!);
    expect(new UserRepo(restored).bookmarks()).toHaveLength(2);
    a.stop();
    vi.useRealTimers();
  });
});
