# PLAN.md: PI Academy

PI Academy is an offline-first learning, reference, exam and simulator app for the AVEVA PI System.
It ships as a Tauri desktop app (Windows .msi/.exe, macOS .dmg, Linux .AppImage) and as an
installable PWA. Both are built from one React + TypeScript codebase.

## 1. Architecture

```mermaid
flowchart LR
  subgraph Build time
    C[/content/*.md, *.json/] --> V[scripts/validate-content.ts<br/>zod schemas]
    V --> B[scripts/build-content.ts]
    B --> J[(public/content/bundle.json<br/>+ coverage.json)]
    COV[COVERAGE.md] --> B
  end
  subgraph Runtime (same code in Tauri webview and browser)
    J --> L[Content loader]
    L --> DB[(SQLite via sql.js WASM)]
    DB --> R[Repositories]
    R --> UI[React UI]
    L --> S[MiniSearch index]
    S --> UI
    CORE[src/core: pure logic<br/>exam selection, SM-2, streaks,<br/>scoring, compression, PE/AF evaluator,<br/>Web API simulator] --> UI
    DB <--> P{Persistence adapter}
    P -->|Tauri| F[app data dir: pi-academy.sqlite]
    P -->|Browser| I[IndexedDB]
  end
```

### Key decisions

| Decision | Choice | Why |
|---|---|---|
| Desktop shell | Tauri 2 | Small installers, Rust shell, strict CSP and capability model |
| Database | SQLite compiled to WASM (sql.js), one code path for desktop and PWA | The Tauri SQL plugin would only work on desktop and better-sqlite3 needs Node. sql.js gives real SQLite with migrations in both targets, and the same migrations run under Vitest |
| Persistence | Adapter: Tauri `fs` plugin writes the database file to the app data dir; the browser writes it to IndexedDB. Debounced save after every write | Survives restarts offline in both targets |
| Search | MiniSearch index built from content at startup (fuzzy, prefix, field boosts) | Works in the webview and browser with no native FTS build; the script allows FTS5 or MiniSearch |
| Content | Authored as Markdown (lessons, industry hubs) and JSON (questions, glossary, case studies, challenges, references, sources) in `/content`, compiled into one validated JSON bundle at build time | Diffable, reviewable content; the app never parses YAML at runtime |
| Content in DB | Bundle is seeded into a `content_items` table on first launch and whenever the bundle version changes. Admin edits are rows with `origin = 'user'` that override bundle rows | Admin CRUD, import/export and verification flags all work offline |
| UI kit | Tailwind CSS + shadcn/ui pattern (Radix primitives + `cva`) with CSS-variable design tokens | Dark/light themes from tokens only; no hard-coded colours (lint rule enforces it) |
| Charts / diagrams | Recharts for charts, Mermaid for diagrams | As specified |
| Validation | zod everywhere content or user input crosses a boundary (bundle load, imports, backup restore, admin forms, simulator input) | Strict, typed, no `any` |
| Routing | React Router (hash router, so it works from `file://`-like Tauri origins and static PWA hosting) | |
| Online features | Off by default; a settings toggle only enables the "check for content update" fetch. No leaderboard server is shipped (would need hosting); recorded as a known gap | Offline-first |

## 2. Folder structure

```
pi-academy/
  content/
    lessons/<domain>/<slug>.md       Markdown + YAML front matter
    questions/<domain>.json          Question[]
    glossary/<domain>.json           GlossaryTerm[]
    case-studies/<slug>.json         CaseStudy
    industries/<slug>.md             IndustryHub (front matter + sections)
    challenges/<slug>.json           Challenge
    reference/*.json                 PE/AF functions, Web API endpoints, piconfig, error codes, decision trees
    sources.json                     Source[] registry (every URL used)
  scripts/
    validate-content.ts              CI gate: schemas, sources, duplicates, coverage
    build-content.ts                 compiles /content + COVERAGE.md -> public/content/bundle.json
  src/
    core/                            pure, unit-tested logic (no React)
      schemas/                       zod schemas (Lesson, Question, GlossaryTerm, CaseStudy, IndustryHub, Challenge, Source, ...)
      exam/                          daily selection (seeded PRNG), scoring, graders, mock exam blueprint, readiness
      srs/                           SM-2
      progress/                      streaks, badges
      sim/                           compression/exception, AF model, PE evaluator, Web API simulator, display builder model
      coverage/                      COVERAGE.md parser and metrics
    db/                              sql.js init, migrations, repositories, persistence adapters, backup/restore
    content/                         bundle loader, seeding, search index
    components/ui/                   shadcn-style primitives
    components/                      app shell, lesson renderer, mermaid, question widgets, charts
    features/                        dashboard, learn, exam, sandbox, reference, industries, cases, admin, settings
    styles/tokens.css                design tokens (light + dark)
  src-tauri/                         Tauri 2 shell (Rust), capabilities, CSP
  e2e/                               Playwright tests
  .github/workflows/                 ci.yml (lint, typecheck, test, validate, e2e) and release.yml (installers)
```

## 3. Data model (SQLite)

| Table | Columns | Notes |
|---|---|---|
| `schema_migrations` | version, applied_at | Ordered TS migrations |
| `meta` | key, value | `content_version`, `first_launch_at`, settings JSON |
| `content_items` | kind, id, origin (`bundle`/`user`), data (JSON), deleted, updated_at; PK (kind, id, origin) | Effective item = user row if present, else bundle row |
| `verification_flags` | id, kind, item_id, note, status (`open`/`resolved`), created_at | "Flag for verification" workflow |
| `lesson_progress` | lesson_id, status (`started`/`completed`), completed_at, last_viewed_at | |
| `bookmarks` | kind, item_id, created_at | Lessons, glossary terms, reference entries |
| `notes` | id, lesson_id, body, updated_at | |
| `attempts` | id, question_id, mode (`daily`/`quiz`/`mock`/`review`/`lesson`), correct, score, answer JSON, answered_at, session_id | Source of truth for history, heatmap and readiness |
| `exam_sessions` | id, mode, seed, date, question_ids JSON, started_at, finished_at, score, time_limit_s | |
| `srs_cards` | question_id, easiness, interval, repetitions, due_date, last_review | SM-2 state |
| `daily_log` | date, completed, score | Streaks |
| `challenge_progress` | challenge_id, status, completed_at | Sandbox challenges |
| `badges` | id, earned_at | |

Backup = JSON export of all user tables (not content), validated with zod on import, plus the user
content overrides. Reset wipes user tables.

## 4. Content schema (zod, `src/core/schemas`)

Common fields on every content item: `id` (kebab), `domain` (one of 12 coverage domains),
`coverage` (COVERAGE item ids), `sources` (Source ids, at least one), `verify` (boolean) and
`verifyNote` (required when `verify` is true), `level` (`beginner`/`practitioner`/`expert`).

- **Source**: id, title, url, publisher, kind (`docs`/`pisquare`/`release-notes`/`case-study`/`presentation`/`whitepaper`/`standard`/`other`), accessed (date), `readable` (whether the page text was actually read).
- **Lesson**: front matter (id, title, domain, coverage, level, roles, minutes, objectives[], keyTerms[] glossary ids, knowledgeCheck[3] question ids, related[] lesson ids, sources, verify) and required body sections: Plain English, Deep Dive, Worked Example, Diagram (contains a mermaid block), Common Mistakes, Real-World Scenario.
- **Question**: discriminated union on `type`: `mcq`, `multi`, `ordering`, `matching`, `scenario` (stem + mcq), `fill` (accepted answers, case/whitespace tolerant), `code` (language: `webapi`/`af`/`pe`; graded by a tolerant validator: normalised tokens, required patterns, forbidden patterns, or evaluation against the simulator). Every question has difficulty 1 to 3, explanation, lessonId, sources.
- **GlossaryTerm**: id, term, aliases, definition, domain, related, sources, verify.
- **CaseStudy**: id, company, title, industry, products[], outcomes[] (category + text quoted or paraphrased, each figure labelled "reported by <publisher>"), summary, year, sources (must be a real public URL), verify.
- **IndustryHub**: id, industry, hierarchy (Mermaid), tags (examples), templates, calculations, eventFrames, kpis, regulation, pitfalls, caseStudies[], sources.
- **Challenge**: id, title, tool (`af-tree`/`point-editor`/`compression`/`display`/`pe`/`webapi`), brief, starting state, validator spec (declarative, checked by `src/core/sim`), hints, solution explanation, sources.

## 5. Core algorithms (TDD)

- **Daily exam**: seed = hash(`YYYY-MM-DD` + content version); mulberry32 PRNG; pick 10 questions with a fixed difficulty mix (3 easy, 4 medium, 3 hard), no more than 2 per domain, preferring domains weighted by blueprint; deterministic tie-breaking by id. Same date and same content gives the same set.
- **Mock exam**: 60 questions with domain weights (blueprint table in `src/core/exam/blueprint.ts`), timed, seeded per attempt.
- **Readiness** per domain: recency-weighted accuracy over the last 50 attempts in that domain, shrunk toward 0 when few attempts (Bayesian prior), scaled 0 to 100.
- **SM-2**: standard SuperMemo-2 (EF floor 1.3, intervals 1, 6, then I×EF; quality < 3 resets repetitions).
- **Streaks**: consecutive local dates with a completed daily exam; today not yet done does not break the streak.
- **Compression/exception simulator**: exception deadband (ExcDev, ExcMin, ExcMax, with the previous-value rule), swinging-door compression (CompDev, CompMin, CompMax, with the held-value rule), plus a reconstruction-error metric.
- **PE/AF expression evaluator**: tokenizer + Pratt parser for a documented subset of PE / AF analysis syntax (arithmetic, comparisons, `if then else`, tag references in quotes/attributes in `'|'`, functions such as `TagVal`, `TagAvg`, `TagMax`, `TagMin`, `TagTot`, `PrevVal`, `Abs`, `Round`, `Max`, `Min`, `Now`, `*`, time expressions). The subset is listed in the UI so nothing pretends to be complete.
- **Web API simulator**: a synthetic AF/PI model served by a router that mimics PI Web API URL shapes (`/piwebapi/assetservers`, `/elements/{webId}`, `/streams/{webId}/recorded`, `/streams/{webId}/value`, `/search/query`, `/eventframes`, `/batch`), returning JSON with realistic WebID-shaped ids that are clearly labelled synthetic.

## 6. Milestones (each ends with tests, code review, security review, visual check, commit)

| # | Milestone | Exit criteria |
|---|---|---|
| 1 | Plan and spec | CAPABILITIES, PLAN, COVERAGE, zod schemas + schema tests |
| 2 | Platform scaffold | App shell, themes, routing, DB + migrations + seeding, loader, search, backup/restore, PWA, Tauri config, CI workflows |
| 3 | Learning engine | Paths, lesson renderer with Mermaid/callouts, progress, bookmarks, notes, global search |
| 4 | Exam engine | Daily exam, all question types and graders, feedback, streaks, history, heatmap, SM-2 review, quizzes, mock exams, readiness |
| 5 | Sandbox | Detailed mockups (PI Vision, PI System Explorer, PI SMT, Web API browser, compression lab, DataLink-style sheet), PE evaluator, challenges |
| 6 | Reference, industries, case studies | Glossary, Web API explorer and cheat sheet, AF/PE references, piconfig/piartool, error codes, tag-name generator, sizing calculator, decision trees, hubs, case library, Deployment Planner (small / mid / large by industry) |
| 7 | Admin, dashboard, settings | CRUD, JSON/CSV import/export, coverage dashboard, verification workflow, settings |
| 8 | Content fill | Parallel per-domain subagents; targets 1,000+ questions, 500+ terms, 30+ case studies; honest statuses |
| 9 | Hardening and release | e2e, WCAG AA, performance, security, installers via CI, INSTALL.md, FINAL_REPORT.md |

## 7. Packaging

- `npm run build` produces the PWA in `dist/` (manifest, Workbox service worker precaching the app shell, WASM and content bundle).
- `npm run tauri build` wraps the same `dist/` in Tauri. `.github/workflows/release.yml` runs `tauri-apps/tauri-action` on `windows-latest`, `macos-latest` and `ubuntu-22.04` and uploads the .msi/.exe, .dmg and .AppImage as release assets. Builds are unsigned unless signing secrets are added (documented in INSTALL.md).

## 8. Quality gates

Typecheck (`tsc --noEmit`, strict, `noImplicitAny`, ESLint `no-explicit-any` as error), ESLint, Prettier check, Vitest (40+ tests), content validator, Playwright e2e on the PWA build, code review and security review per milestone.

## 9. Additions requested by Jithin (2026-10-15)

### 9.1 Detailed PI tool mockups (Phase 5, "Sandbox")
High-fidelity, interactive look-alikes of the real clients, all running on the shared synthetic
plant model (`src/core/sim/plant.ts`, a deterministic generator of AF elements, PI points and
time-series data). They are labelled as simulations and do not reuse AVEVA logos or assets.

| Mockup | What you can do |
|---|---|
| PI Vision | Display list and folders; edit mode with symbol palette (Value, Trend, Table, Bar, Gauge, XY Plot, Asset Comparison Table, Event Table, Text, Shapes, Image placeholders); drag from the asset tree onto the canvas; multi-state colouring; time bar (start/end, `*-8h` syntax, shift back/forward, now); asset swapping with an asset-relative display; collections; event (event frame) view; ad-hoc trend; save/open displays locally |
| PI System Explorer | Navigator (Elements, Event Frames, Library, Unit of Measure, Contacts, Notification Rules), element tree, Attributes tab with data reference config, Templates, Analyses tab with expression editor and Evaluate, Event frame search, check-in/undo-check-out model |
| PI System Management Tools | Point Builder (all point attributes, with validation), Current Values, Archive Editor, Archives list, Message Logs, Tuning Parameters, Mappings & Trusts, Identities |
| PI Web API browser | Request builder with history, the simulated controllers, WebIDs, JSON viewer |
| Compression lab | Raw vs exception vs archived data with live charts and the swinging-door band |
| DataLink-style sheet | Current value / compressed / sampled / calculated data functions into a grid |

### 9.2 Deployment Planner (Phase 6)
Pick an industry (the 12 hubs) and a company profile (Small single site, Mid-size multi-site,
Large enterprise / multi-region). The planner produces:
- an architecture diagram (Mermaid) with zones (Level 2 control, Level 3 operations, DMZ, enterprise, cloud);
- server roles (Data Archive, AF Server + SQL, PI Vision, PI Web API, Analysis/Notifications, Integrator, collectives/HA where justified);
- data collection choices (interfaces, connectors, adapters, PI to PI, AVEVA CONNECT);
- an AF hierarchy and templates from the industry hub;
- a tag-count and storage estimate (from the sizing calculator);
- security controls (IEC 62443 zones/conduits, NERC CIP for power, GxP for pharma);
- a phased rollout plan and pitfalls.
Rules: each recommendation carries either source ids or an explicit "assumption" label; sizing
numbers come from documented formulas only, otherwise they are marked as illustrative.
