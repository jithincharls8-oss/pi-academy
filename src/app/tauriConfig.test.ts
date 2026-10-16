import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tauri.conf.json', () => {
  const conf = JSON.parse(
    readFileSync(new URL('../../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
  ) as { app: { security: { freezePrototype?: boolean } } };

  it('does not freeze Object.prototype (a bundled library assigns `constructor`, leaving a blank window)', () => {
    expect(conf.app.security.freezePrototype ?? false).toBe(false);
  });
});
