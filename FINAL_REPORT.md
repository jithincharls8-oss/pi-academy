# FINAL_REPORT.md: PI Academy

Build period: 2026-10-15 to 2026-10-16, on branch `claude/build` (draft PR #1).
Step-by-step detail is in BUILD_LOG.md and per-item status in COVERAGE.md.

## What was built

| Area | State |
|---|---|
| App shell | React 19 + TypeScript (strict, no `any`) + Tailwind tokens. Light and dark themes, font scaling, global search (Ctrl+K), settings, backup and restore, reset. Works offline as a PWA and inside a Tauri 2 desktop shell |
| Storage | SQLite (sql.js) with migrations; saved to the app data folder on desktop and IndexedDB in the browser. Content is seeded from a validated bundle; Admin edits override it and can be reverted |
| Learn | 95 lessons in six sections each (plain English, deep dive, worked example, diagram, common mistakes, real-world scenario), with knowledge checks, key terms, sources, progress, bookmarks and notes. Paths by level and by role |
| Exams | Daily 10-question exam with streaks and a heatmap, topic quizzes, a 60-question domain-weighted timed mock exam, SM-2 spaced repetition, readiness score. Seven question types with graders |
| Sandbox | Six mockups on one simulated plant (Riverbend): PI Vision (edit and view modes, 11 symbol types, multi-state, asset swap, collections, event tables, save/open), PI System Explorer (elements, attributes, templates, analyses with an expression evaluator, event frames, check-in), PI SMT (Point Builder, archive editor, archives, message logs, tuning, security, piconfig and piartool console), PI Web API browser (request builder, Links navigation, WebID decoder, batch, 6 challenges), compression lab, DataLink-style sheet |
| Reference | Glossary (623 terms), 70 PE functions, 22 AF functions, 65 PI Web API and 31 CONNECT data services endpoints, 74 commands, 77 error codes, 10 decision trees, tag-name generator and checker, archive sizing calculator |
| Industries | 12 industry hubs and 83 sourced case studies; each outcome says who reported it |
| Deployment Planner | Industry and company size in; architecture diagram, server roles by security zone, data collection, AF hierarchy, tag and storage estimate with comparable real deployments, security and regulation, rollout plan out. Each rule cites sources or is labelled "inferred" |
| Admin | Content editor validated against the schema, origin badges and revert, JSON content packs and CSV import/export with a preview, live coverage table, verification queue |

## Content against the targets

| Target in the build script | Delivered |
|---|---|
| 1,000+ questions | 1,057 |
| 500+ glossary terms | 623 |
| 30+ case studies | 83 |
| Every syllabus item covered | 94 of 94 items have lessons, questions and terms (the glossary item counts terms only) |

All 94 items are **drafted**: written from cited sources by one pass, not yet re-checked by a
second pass. None is marked reviewed or verified. 98 items carry a `verify` flag because a source was
thin, conflicting or could not be read (docs.aveva.com renders with JavaScript and could not be
read directly). They are listed on the Admin page under Verify. Examples: PE and AF function
signatures, the ProcessBook end-of-support date, licensing details, the PI DataLink function list.
The content validator also reports 115 warnings, mostly unused or duplicate-URL sources.

## Quality gates (last local run)

| Gate | Result |
|---|---|
| TypeScript (strict) | clean |
| ESLint (incl. no hard-coded colours, no `any`) | clean |
| Prettier | clean |
| Content validator | 0 errors |
| Vitest | 346 tests, 39 files, all pass |
| Playwright e2e | 58 tests, all pass, including an axe WCAG 2 A/AA scan of 20 pages in light and dark themes |
| CI (GitHub Actions) | lint, typecheck, unit, content, build, e2e and the Rust desktop check run on every push |

## Hardening done in Phase 9

- Accessibility: axe scan added to e2e; five light-theme colour tokens darkened so all text meets
  4.5:1 contrast.
- Performance: Mermaid is no longer forced into one 4.8 MB chunk; a lesson loads only the diagram
  renderer it uses. All routes are lazy-loaded; the service worker precaches everything for offline use.
- Security (from earlier phases, unchanged): strict CSP in the PWA and Tauri, least-privilege Tauri
  capabilities, Markdown sanitised with DOMPurify, backups and content packs validated with zod
  before anything is written, null-prototype objects for user-named keys in the simulators.

## Installers

`.github/workflows/release.yml` builds Windows (.msi, .exe), macOS (universal .dmg) and Linux
(.AppImage, .deb) installers. It runs on a `v*` tag (creates a draft release), from the Actions tab,
or when a pull request gets the `build-installers` label (artifacts only). Installers are unsigned;
INSTALL.md explains the SmartScreen and Gatekeeper steps.

## Known gaps

- **Sandbox challenges** exist only in the PI Web API browser (6). The declarative challenge content
  type (compression, point attributes, PE expressions, AF find, display symbols) is defined and
  validated but no challenge content was written for it.
- **No content is independently reviewed.** A second-pass review against sources would move items
  from drafted to reviewed.
- **Verification**: 98 flagged items need someone with AVEVA documentation access to confirm.
- **No online features**: no leaderboard or content-update server (would need hosting).
- **Unsigned installers**: code signing needs certificates added as repository secrets.
- **Simulations are approximations** of the real tools on synthetic data, labelled as such; they do
  not reproduce every dialog or behaviour.
