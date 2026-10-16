# BUILD_LOG.md

Running log of what was done at each step and which capability was used. Newest entries last.

## Phase 1: Plan and spec (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 1.1 | Inventoried skills (ListSkills + local skills dir), plugins (ListPlugins + synced plugin dir), agents, MCP servers (ToolSearch, connection-failure notices), toolchain probes | ListSkills, ListPlugins, ToolSearch, Bash |
| 1.2 | Wrote CAPABILITIES.md, shared the table in the project thread | Write, hearthbot reply |
| 1.3 | Probed research access: docs.aveva.com is JS-only (WebFetch returns a shell); cdn.osisoft.com PDFs are readable | WebSearch, WebFetch |
| 1.4 | Attached GitHub repo `jithincharls8-oss/pi-academy`, verified push access, branch `claude/build` | claude-code-remote add_repo, git |
| 1.5 | Wrote PLAN.md (architecture, data model, folder structure, content schema, milestones, packaging) | Write (Plan Mode is not available in a thread session; plan written before code instead) |
| 1.6 | Wrote COVERAGE.md (94 items in 12 domains) | Write |
| 1.7 | Defined zod schemas: Source, Lesson, Question (7 types), GlossaryTerm, CaseStudy, IndustryHub, Challenge, reference types, ContentBundle | Write; tests first with Vitest |
| 1.8 | Content pipeline: lesson parser, COVERAGE.md parser/rewriter, cross-reference validator, `content:validate`, `content:build`, `coverage` scripts | Write, Vitest |
| 1.9 | Added Jithin's requests to PLAN.md §9: detailed PI tool mockups (PI Vision, PSE, SMT, Web API) and a Deployment Planner by industry and company size; new coverage item `adm.deployment-patterns` | Write |
| 1.10 | Started 6 parallel research subagents (da, af, dcv, int, adm, ind) writing sourced fact files to `research/` per `research/BRIEF.md` | Agent (general-purpose) x6, WebSearch, WebFetch |
| 1.11 | Gates: `tsc` (app, node, test projects) clean, ESLint clean (no-explicit-any + no hard-coded colours rule), 29 Vitest tests green | tsc, ESLint, Vitest |

## Phase 2: Platform scaffold (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 2.1 | Design tokens (light/dark, chart, heat, PI-tool chrome) in `src/styles/tokens.css`; ESLint rule bans hard-coded colours in `src` | design:design-system skill, ESLint |
| 2.2 | SQLite via sql.js: migrations, content repo (seed/override/revert), user repo, backup/restore (zod + column allow-list), reset | Vitest (TDD) |
| 2.3 | Persistence adapters (Tauri app-data file, IndexedDB, memory) with debounced autosave and retry | Vitest + fake-indexeddb |
| 2.4 | MiniSearch global search; app shell, routing, error boundaries, settings, dashboard | React, Tailwind, Radix |
| 2.5 | PWA (manifest, Workbox service worker, CSP); Tauri 2 shell with least-privilege capabilities and CSP; icons rendered with Chromium | vite-plugin-pwa, Tauri CLI, Playwright |
| 2.6 | CI (lint, format, typecheck, unit, content, build, e2e, Rust check) and release workflow (Windows/macOS/Linux installers) | GitHub Actions |
| 2.7 | Playwright e2e smoke tests (3) and screenshots in light/dark; found and fixed a save-on-reload bug | Playwright, run |
| 2.8 | Code review: 10 findings, 8 fixed (desktop build import, data loss on load failure, malformed restore rows, double bootstrap in dev, export errors, autosave retry, CI lockfile, search filter) | code-review skill |
| 2.9 | Security review: no high/medium findings; renderer sanitisation noted for Phase 3 | security-review skill |

## Phase 3: Learning engine (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 3.1 | Research complete for all 6 groups (453 sources in `content/sources`); 3 gap agents started for functions, developer tools and PI Vision admin/ops | Agent x3, WebSearch, WebFetch |
| 3.2 | Sanitised Markdown renderer (marked + DOMPurify allow-list, callouts, safe links, no images) and Mermaid diagrams (strict security, SVG labels, sanitised output) | Vitest |
| 3.3 | Question card for all 7 question types with feedback, explanation, lesson link and sources; answers recorded and fed into SM-2 | React, Vitest |
| 3.4 | Learn page (course paths by level, role paths, per-domain progress) and lesson page (objectives, six sections, key terms, knowledge check, complete, bookmark, notes, related, sources) | React |
| 3.5 | CONTENT_GUIDE.md written; pilot content for `da.exception-compression`: 1 lesson, 10 questions (6 types), 10 glossary terms, all cited, 1 verify flag | Write, content validator |
| 3.6 | Found and fixed: DOMPurify drops attribute values containing `-->`, which silently removed every Mermaid diagram; source is now URI-encoded and the unit test checks the round trip. Root-level `htmlLabels: false` restores node labels in Mermaid 12 | Playwright e2e, screenshots |
| 3.7 | e2e: lesson renders all sections, the diagram draws and the knowledge check grades an answer (4 e2e tests total) | Playwright |
| 3.8 | Review of Phase 3 (subagent): 9 findings, all fixed. Raw HTML in content is escaped; links limited to https and in-app routes with rel/target forced; class allow-list; diagrams readable by screen readers and mounted in place; lesson state keyed by id; ordering items deranged, keyboard focus kept and moves announced; matching pairs must be unique; answer + SRS saved in one transaction | Agent (review), Vitest |

## Phase 4: Exam engine UI (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 4.1 | Session core: answer schema for stored answers, summaries by domain, countdown, topic scores, calendar heatmap (Vitest) | Vitest (TDD) |
| 4.2 | Session service: start, resume with re-grading, one answer per question, finish, daily log only for same-day finishes (Vitest on SQLite) | Vitest |
| 4.3 | Exam runner: navigator, progress, timer with auto-finish, flagging, finish confirmation; immediate feedback or hidden until the end (mock) | React |
| 4.4 | Pages: Daily Exam (streak, best, 16-week heatmap, recent scores), Practice (topic quiz, 60-question domain-weighted mock with blueprint table and time limits, SM-2 review queue, readiness, weakest topics, history), session review, single-question deep link | React, Playwright |
| 4.5 | e2e: daily exam survives reload, mock hides answers then reviews, quiz starts (7 e2e tests total) | Playwright |

## Phase 5: Sandbox simulators (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 5.1 | Simulation core: PI time syntax, exception and swinging-door compression, Riverbend Plant (9 units, 35 PI points, AF hierarchy and templates), recorded/interpolated/plot/summary data, PE/AF expression evaluator, PI Web API router with PathOnly WebIDs (23 tests) | Vitest (TDD) |
| 5.2 | Shared sandbox UI: tool frame, ARIA asset tree with drag, time range bar, trend chart | React, Recharts |
| 5.3 | Six mockups built in parallel, each in its own folder: PI Vision (displays, symbols, multi-state, asset switching, collections, event tables, design/view modes), PI System Explorer (elements, attributes, analyses, event frames, library, check-in), PI SMT (Point Builder, archive editor, archives, message logs, statistics, tuning, security, licensing, piconfig/piartool console), PI Web API browser (request builder, Links, WebID decoder, snippets, batch, challenges), compression lab, DataLink-style sheet | Agent x4 |
| 5.4 | Integration fixes from the workers' reports: templates build tag names with `%@Asset ID%` (element names keep the hyphen, tags do not); pump trips spread evenly (murmur3 finaliser on the hash); recorded-value cache keyed by point settings; PathOnly WebIDs leave out the leading `\\` as PI Web API does | Vitest |
| 5.5 | e2e: hub, every tool opens without errors, Vision opens a display and switches asset | Playwright |

## Phase 6: Reference, planner, industries (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 6.1 | Reference hub; glossary, PE/AF functions, Web API, commands, error codes (list + detail with sources); interactive decision-tree walker | React |
| 6.2 | Tag-name generator and checker (forbidden characters, AF `%Element%` pattern) and archive sizing calculator from the course formulas only (7 tests) | Vitest |
| 6.3 | Deployment Planner: industry, size, sites, edge sites, tags, assets, HA, security model, cloud. Outputs architecture diagram, servers by zone, data collection, AF hierarchy from the industry hub, archive sizes, real deployments of similar size, security, regulation (Part 11, NERC CIP, IEC 62443) and rollout. Every rule cites a source; combined rules are labelled "inferred". A test checks every cited source id exists | Vitest, Playwright |
| 6.4 | 12 industry hubs and 83 real case studies from research/ind.md; every outcome says who reported it; 19 case studies and all hubs flagged verify where the source was inconsistent or the hierarchy is a synthesis | Agent, content validator |
| 6.5 | e2e: reference tools, planner, industry hub and case study | Playwright |

## Phase 7: Admin (2026-10-15)

| Step | What | Capability used |
|---|---|---|
| 7.1 | Content import/export core: JSON content packs validated per item, CSV export for any type, RFC 4180 CSV parser and glossary CSV import, verification queue (6 tests) | Vitest (TDD) |
| 7.2 | Admin page: JSON editor per content type validated against the schema before saving, origin badges, revert to bundled, delete; import preview with per-item errors before anything is written; live coverage table per syllabus item; verification queue with deep links to the editor | React, Playwright |

## Phase 8: Content fill (2026-10-16)

| Step | What | Capability used |
|---|---|---|
| 8.1 | Six content groups written in parallel from the research files: foundations + Data Archive, data collection + visualisation, AF + analytics, administration + security, integration + reference data, industries | Agent x6 |
| 8.2 | Totals: 95 lessons, 1,057 questions, 623 glossary terms, 83 case studies, 12 industry hubs; reference data of 70 PE functions, 22 AF functions, 65 PI Web API and 31 CONNECT endpoints, 74 commands, 77 error codes, 10 decision trees | content validator |
| 8.3 | Cross-group clean-up: duplicate glossary ids resolved to one owner, colliding question ids renamed, every lesson's key terms, knowledge checks and related lessons resolve | content validator (0 errors) |
| 8.4 | 98 items flagged verify where sources were thin or conflicting; facts marked inferred in the research carry a VERIFY callout. Every one of the 94 coverage items has lessons, questions and terms; all are "drafted" (not yet independently reviewed) | coverage script |

## Phase 9: Hardening and release (2026-10-16)

| Step | What | Capability used |
|---|---|---|
| 9.1 | Fixed the content build for the glossary coverage target (counts terms only) | Vitest |
| 9.2 | Mermaid no longer forced into one 4.8 MB chunk; lessons load only the diagram renderer they use | Vite |
| 9.3 | axe WCAG 2 A/AA scan of 20 pages in light and dark; five light-theme tokens darkened to reach 4.5:1 | @axe-core/playwright |
| 9.4 | Release workflow can be started by the `build-installers` PR label; installers built for Windows, macOS and Linux | GitHub Actions, tauri-action |
| 9.5 | FINAL_REPORT.md written; CAPABILITIES.md updated | Write |
