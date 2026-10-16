import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, ROOT } from './lib/loadContent';
import { countCoverage } from '../src/core/content/validate';
import {
  parseCoverage,
  rewriteCoverageCounts,
  summariseCoverage,
} from '../src/core/coverage/parse';

const path = join(ROOT, 'COVERAGE.md');
const { content } = loadContent();
const md = readFileSync(path, 'utf8');
const ids = parseCoverage(md).map((c) => c.id);
const next = rewriteCoverageCounts(md, countCoverage(content, ids));
writeFileSync(path, next);
const s = summariseCoverage(parseCoverage(next));
console.log(
  `coverage: ${s.total} items; ${s.withContentPct}% have lessons+questions+terms; ` +
    `status progress ${s.progressPct}% (verified ${s.byStatus.verified}, reviewed ${s.byStatus.reviewed}, ` +
    `drafted ${s.byStatus.drafted}, not started ${s.byStatus['not started']})`,
);
