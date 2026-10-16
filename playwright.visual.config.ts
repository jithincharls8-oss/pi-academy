import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** Screenshot-baseline run (see e2e/visual). Not part of `npm run e2e`. */
export default defineConfig({
  ...base,
  testDir: './e2e/visual',
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
  retries: 0,
});
