# PI Academy

An offline-first app for learning, practising and trying out the **AVEVA PI System**. It runs as a
desktop app (Windows, macOS, Linux, built with Tauri) and as an installable web app (PWA). Both
use the same code and keep everything on your device.

> PI Academy is an independent study tool. It is not made, endorsed or supported by AVEVA. The
> tool mockups are look-alikes running on a fictional plant, not the real software.

## What's inside

| Area | What you can do |
|---|---|
| **Learn** | Lessons in six parts (plain English, deep dive, worked example, diagram, common mistakes, real-world scenario), each with a knowledge check, key terms and sources. Paths by level and by role. |
| **Daily Exam and Practice** | A 10-question daily exam with streaks, topic quizzes, a 60-question domain-weighted mock exam with a timer, spaced-repetition review (SM-2) and a readiness score. |
| **PI Sandbox** | Clickable mockups on the simulated Riverbend Plant: PI Vision displays, PI System Explorer, PI System Management Tools (with a piconfig/piartool console), a PI Web API browser, a compression lab and a DataLink-style sheet. |
| **Reference** | Glossary, PE and AF functions, PI Web API endpoints, commands, error codes, decision trees, a tag-name generator and an archive sizing calculator. |
| **Deployment Planner** | Pick an industry and company size and see a suggested PI architecture: servers, network zones, data collection, AF hierarchy, tag estimate, security, regulation and rollout, with a source for every rule. |
| **Industries and case studies** | 12 industry hubs and 83 real customer case studies. Every figure says who reported it. |
| **Admin** | Edit content in the app, import and export content packs (JSON or CSV), track syllabus coverage and work through items flagged "needs verification". |

## Honesty rules for content

- Every lesson, question, term and case study cites at least one source in `content/sources`.
- Anything that could not be confirmed in a readable source is marked **Needs verification** in the
  app, with a note saying what to check. See the Admin page's Verification tab.
- Case-study figures are copied exactly and labelled "reported by". Most are vendor-published.
- Coverage is reported as it stands in `COVERAGE.md` and on the Admin page, not rounded up.

## Quick start (developers)

```bash
npm ci
npm run dev        # web app at http://localhost:5173
npm test           # unit tests (Vitest)
npm run e2e        # browser tests (Playwright; run `npm run build` first)
npm run tauri dev  # desktop app (needs Rust and the Tauri prerequisites)
```

See [INSTALL.md](INSTALL.md) for installing the app, [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for
adding content, [PLAN.md](PLAN.md) for the architecture and [BUILD_LOG.md](BUILD_LOG.md) for how it
was built.

## Tech

React 19, TypeScript (strict), Vite, Tailwind CSS v4, sql.js (SQLite in WebAssembly), MiniSearch,
zod, marked + DOMPurify, Mermaid, Recharts, Tauri 2, Playwright and Vitest.

## Data and privacy

Progress, notes and your own content are stored in a local SQLite database: in the app data folder
on desktop, or in browser storage for the web app. Nothing is sent anywhere. Links to sources
only open when you turn on online features in Settings. Use Settings to back up or restore.
