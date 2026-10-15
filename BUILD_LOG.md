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
