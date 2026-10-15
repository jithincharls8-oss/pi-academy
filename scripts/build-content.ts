import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, ROOT } from './lib/loadContent';
import { countCoverage, validateBundle } from '../src/core/content/validate';
import { ContentBundleSchema, type ContentBundle } from '../src/core/schemas';

const { content, errors } = loadContent();
const counts = countCoverage(
  content,
  content.coverage.map((c) => c.id),
);
content.coverage = content.coverage.map((c) => ({ ...c, ...(counts.get(c.id) ?? c) }));
const report = validateBundle(content, { strictCoverage: false });
const all = [...errors, ...report.errors];
if (all.length > 0) {
  for (const e of all) console.error(`error: ${e}`);
  console.error('content build failed; run `npm run content:validate` for details');
  process.exit(1);
}

const body = JSON.stringify(content);
const version = createHash('sha256').update(body).digest('hex').slice(0, 12);
const bundle: ContentBundle = ContentBundleSchema.parse({
  ...content,
  version,
  generatedAt: new Date().toISOString(),
});
const outDir = join(ROOT, 'public', 'content');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'bundle.json'), JSON.stringify(bundle));
console.log(
  `wrote public/content/bundle.json (version ${version}, ${(body.length / 1024).toFixed(0)} KiB)`,
);
