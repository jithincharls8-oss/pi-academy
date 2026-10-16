# CONTENT_GUIDE.md: adding lessons, questions and more

All learning content lives in `/content` as plain Markdown and JSON. A build step validates it
(`npm run content:validate`) and compiles it into the app (`npm run content:build`). CI fails if
anything is invalid, so you can't ship broken content by accident.

You can also add and edit content inside the app (Admin page). Those edits are stored on your
device and can be exported as JSON to paste into `/content`.

## The golden rules

1. **Never invent facts.** Every item cites at least one source id from `content/sources/*.json`.
2. **Mark uncertainty.** If you could not read the fact in a source (only found the page, or you are
   relying on memory), set `"verify": true` and write a `verifyNote` saying what to check. The app
   shows a "Needs verification" badge.
3. **Case-study figures** are copied exactly from the source and every outcome says who reported it
   (`"reportedBy": "AVEVA customer story"`). Never round, convert or combine figures.
4. **One fact, one place.** Link to the glossary and lessons instead of repeating long explanations.

## Folder layout

| Folder | Format | One file holds |
|---|---|---|
| `content/sources/*.json` | JSON array of Source | Sources from one research group |
| `content/lessons/<domain>/<id>.md` | Markdown + YAML front matter | One lesson |
| `content/questions/<domain>/*.json` | JSON array of Question | Questions, usually one file per coverage item |
| `content/glossary/<domain>.json` | JSON array of GlossaryTerm | Terms for one domain |
| `content/case-studies/*.json` | JSON array of CaseStudy | Case studies |
| `content/industries/<id>.json` | IndustryHub | One industry hub |
| `content/challenges/*.json` | JSON array of Challenge | Sandbox challenges |
| `content/reference/<kind>/*.json` | JSON arrays | PE/AF functions, Web API endpoints, commands, error codes, decision trees |

Ids are lowercase kebab-case and unique per type. Domains are: `foundations`, `data-archive`,
`asset-framework`, `data-collection`, `visualisation`, `analytics`, `integration`,
`administration`, `industries`, `case-studies`, `security`, `glossary`.
Coverage ids come from `COVERAGE.md` (for example `da.exception-compression`).

## Sources

```json
{
  "id": "da-uc23-exc-comp",
  "title": "Exception, Compression and their Impacts on PI System Performance (AVEVA World 2023)",
  "url": "https://cdn.osisoft.com/osi/presentations/...pdf",
  "publisher": "AVEVA",
  "kind": "presentation",
  "accessed": "2026-10-15",
  "readable": true
}
```

`readable: false` means the page was located but its text could not be read (docs.aveva.com pages
are JavaScript-only). Facts that rely only on an unreadable source must be `verify: true`.

## Lessons

A lesson is a Markdown file with YAML front matter and exactly these six `##` sections, in any
order: `Plain English`, `Deep Dive`, `Worked Example`, `Diagram` (must contain a ```` ```mermaid ````
block), `Common Mistakes`, `Real-World Scenario`.

```markdown
---
id: exception-and-compression
title: Exception and compression
summary: How the PI System decides which values to send and which to store.
domain: data-archive
coverage: [da.exception-compression]
level: beginner            # beginner | practitioner | expert
roles: [pi-admin, ot-engineer]
minutes: 15
order: 40                  # position within the domain
objectives:
  - Explain the difference between exception and compression
  - Choose sensible ExcDev and CompDev values
keyTerms: [exception-reporting, compression, compdev]   # glossary ids
knowledgeCheck: [q-exc-comp-01, q-exc-comp-02, q-exc-comp-03]  # exactly 3 question ids
related: [snapshot-and-archive]
sources: [da-uc23-exc-comp, da-admin-workbook-2017r2]
verify: false
---

## Plain English
...
```

Markdown supports tables, code blocks, and callouts:

```markdown
> [!WARNING]
> CompDev = 0 still drops repeated identical values.
```

Callout kinds: `NOTE`, `TIP`, `WARNING`, `CAUTION`, `IMPORTANT`, `VERIFY`.
Links: external `https://` links (opened only when the learner allows online features) and in-app
links like `[the glossary](#/reference/glossary/compdev)`. Images are not supported (offline app).

## Questions

Every question has: `id`, `domain`, `coverage`, `difficulty` (1 easy, 2 medium, 3 hard), `prompt`,
`explanation` (why the answer is right, and why tempting wrong answers are wrong), `lessonId`
(optional but recommended), `sources`, `verify`. Then one of seven `type`s:

| type | extra fields | graded as |
|---|---|---|
| `mcq` | `options` [{id,text}], `answer` | exact |
| `multi` | `options`, `answers` (2+) | exact; partial credit minus wrong picks |
| `ordering` | `items` in the correct order | exact; partial credit by position |
| `matching` | `pairs` [{left,right}] | exact; partial credit per pair |
| `scenario` | `scenario` (Markdown), `options`, `answer` | exact |
| `fill` | `accepted` [strings], `caseSensitive` | whitespace/case tolerant |
| `code` | `language` (`pe`, `af`, `webapi`), `accepted`, optional `requiredPatterns`/`forbiddenPatterns` (regex, matched against the normalised answer) | tolerant: case, spacing, smart quotes; Web API host and query order ignored |

Write distractors that a real learner would pick, not jokes. Avoid "all of the above".
Duplicate questions (same prompt and options after normalisation) fail validation.

## Glossary terms

```json
{
  "id": "compdev",
  "term": "CompDev",
  "aliases": ["compression deviation"],
  "definition": "Point attribute: the deviation, in engineering units, from the swinging-door line that makes an event significant enough to archive.",
  "domain": "data-archive",
  "coverage": ["da.exception-compression"],
  "related": ["compression", "compmax"],
  "sources": ["da-admin-workbook-2017r2"]
}
```

## Workflow

1. Add or edit files under `/content`.
2. `npm run content:validate -- --verbose` and fix any errors.
3. `npm run coverage` to refresh the counts in `COVERAGE.md`, then update the Status column
   (`drafted` → `reviewed` → `verified`) honestly.
4. Commit. CI runs the validator again.
