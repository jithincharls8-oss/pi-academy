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
