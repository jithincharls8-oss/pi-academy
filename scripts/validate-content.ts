import { loadContent } from './lib/loadContent';
import { countCoverage, validateBundle } from '../src/core/content/validate';

const strictCoverage = process.argv.includes('--strict-coverage');
const { content, errors: loadErrors } = loadContent();
const counts = countCoverage(
  content,
  content.coverage.map((c) => c.id),
);
content.coverage = content.coverage.map((c) => ({ ...c, ...(counts.get(c.id) ?? c) }));
const report = validateBundle(content, { strictCoverage });
const errors = [...loadErrors, ...report.errors];

const verifyCount = [
  ...content.lessons,
  ...content.questions,
  ...content.glossary,
  ...content.caseStudies,
].filter((i) => i.verify).length;

console.log(
  `content: ${content.lessons.length} lessons, ${content.questions.length} questions, ` +
    `${content.glossary.length} glossary terms, ${content.caseStudies.length} case studies, ` +
    `${content.industries.length} industry hubs, ${content.challenges.length} challenges, ` +
    `${content.sources.length} sources; ${verifyCount} items flagged verify`,
);
if (process.argv.includes('--verbose'))
  for (const w of report.warnings) console.warn(`warning: ${w}`);
else if (report.warnings.length)
  console.warn(`${report.warnings.length} warnings (run with --verbose to list)`);
for (const e of errors) console.error(`error: ${e}`);
if (errors.length > 0) {
  console.error(`\n${errors.length} content error(s)`);
  process.exit(1);
}
console.log('content OK');
