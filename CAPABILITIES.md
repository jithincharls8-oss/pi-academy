# CAPABILITIES.md

Inventory taken on 2026-10-15 at the start of the build, from inside the cloud build session
(Claude Code on the web). "Phase" refers to the phases in the master build script.

## Environment facts that shape the build

| Fact | Consequence |
|---|---|
| Node 22, npm 10, pnpm 10, TypeScript, ESLint, Prettier installed | Frontend toolchain works locally |
| Rust 1.97 / cargo installed, crates.io reachable | Tauri Rust crate can be compiled and checked |
| `libwebkit2gtk-4.1-dev` is **not** installable (apt has no package) | Tauri installers cannot be produced in this container. They are produced by the GitHub Actions matrix (Windows/macOS/Linux runners) |
| Playwright 1.56 + Chromium pre-installed | E2E tests and visual checks run against the PWA build |
| `docs.aveva.com` is a JavaScript-rendered site; direct `curl` is blocked by the proxy and WebFetch returns only the page shell | AVEVA doc pages are found through WebSearch (their URLs are recorded as sources) and read through PDFs on `cdn.osisoft.com`, PI Square, release notes and other text pages that WebFetch can read. Facts that could only be located but not read are flagged `verify` |
| Repo `jithincharls8-oss/pi-academy` attached (clone works) but pushes are refused until the Claude GitHub App is installed on it | Commits are made locally per milestone and mirrored to `/mnt/project-files/pi-academy`; they are pushed and CI runs once access is granted |

## Capability table

| Capability | Type | What it does | Which build phase uses it |
|---|---|---|---|
| Plan (agent) | Subagent | Architecture/implementation planning | Phase 1 (PLAN.md review) |
| general-purpose (agent) | Subagent | Multi-step research and build work in parallel | Phase 5, 6, 8 (parallel simulators and per-domain content fill) |
| Explore (agent) | Subagent | Read-only fan-out codebase search | Phases 7, 9 (finding hard-coded colours, `any`, TODOs) |
| claude-code-guide (agent) | Subagent | Claude Code / SDK questions | Not needed |
| statusline-setup (agent) | Subagent | Status line config | Not needed |
| anthropic-skills:deep-research | Skill | Coordinates research subagents into a sourced report | Phase 8 (domain research), Phase 6 (case studies) |
| code-review | Skill | Correctness review of the diff | End of every phase |
| security-review | Skill | Security review of pending changes | End of every phase, Phase 9 |
| simplify | Skill | Reuse/simplification cleanup | End of Phases 2, 4, 5 |
| run | Skill | Launch and drive the app to confirm it works | Every phase (visual check of the PWA build) |
| design:design-system | Plugin skill (design) | Audit tokens, find hard-coded values | Phase 2 (tokens), Phase 9 audit |
| design:accessibility-review | Plugin skill (design) | WCAG 2.1 AA audit | Phase 9, spot checks in 3 to 7 |
| design:design-critique | Plugin skill (design) | Usability/hierarchy feedback on screens | Phases 3, 5, 7 |
| design:ux-copy | Plugin skill (design) | Microcopy, empty states, errors | Phases 3, 4, 7 |
| design:design-handoff | Plugin skill (design) | Spec sheets | Not needed (no separate design hand-off) |
| design:user-research / research-synthesis | Plugin skill (design) | User research | Not needed (no research data) |
| productivity:task-management / memory-management / start / update | Plugin skill (productivity) | TASKS.md and memory | Not used; BUILD_LOG.md and project memory cover this |
| dataviz | Skill | Chart design method, palette, a11y | Phases 4 (heatmap), 5 (compression charts), 7 (dashboard) |
| artifact-design / artifact-diagramming | Skill | Design guidance for published pages and diagrams | FINAL_REPORT summary page; Mermaid diagram style in lessons |
| anthropic-skills:xlsx | Skill | Spreadsheet read/write | Phase 7 (CSV import/export format check) |
| anthropic-skills:pdf | Skill | PDF reading/extraction | Phase 8 (reading AVEVA/OSIsoft PDF sources) |
| anthropic-skills:docx / pptx / docs / google-workspace | Skill | Office/Docs output | Not needed (deliverables are Markdown in the repo, as the script specifies) |
| session-start-hook | Skill | SessionStart hook so cloud sessions can run tests | Phase 9 (once a repo is attached) |
| WebSearch | Built-in tool | Web search | Phases 6, 8 (find AVEVA docs, PI Square, case studies) |
| WebFetch | Built-in tool | Read a page or PDF | Phases 6, 8 (read sources) |
| Agent / SendMessage | Built-in tool | Spawn and steer subagents | Phases 5, 6, 8 |
| Bash, Read, Write, Edit, Grep, Glob | Built-in tool | Build, test, edit | All phases |
| Playwright 1.56 + Chromium | Pre-installed tool | E2E tests and screenshots | Phases 2 to 9 |
| GitHub MCP (`mcp__github__*`) + `gh` CLI | MCP server / CLI | Repos, branches, PRs, CI runs | Blocked until a repo is attached (see above) |
| claude-code-remote MCP (`list_repos`, `add_repo`, `subscribe_pr_activity`) | MCP server | Attach repos, watch PRs | When a repo is attached |
| Artifact tool | Built-in tool | Publish an HTML page | Optional: a hosted preview of the PWA build |
| hearthbot MCP | MCP server | Thread replies and status | All phases (progress reporting) |
| Claude_Docs MCP | MCP server | Editable docs | Not needed (Markdown docs live in the repo per the script) |
| Expedia, Kiwi.com, lastminute.com, CarGurus, Granola, Higgsfield AI MCPs | MCP servers | Travel, cars, meetings, media generation | Not relevant to this build |
| Memory (`/tmp/claude/memory/team/silo`) | Project memory | Persistent notes for later sessions | Resume instructions, key decisions |

## Missing or failed capabilities, and the fallback used

| Capability | Status | Fallback |
|---|---|---|
| Context7 MCP (`plugin:context7`) | Configured but **failed to connect** (proxy tunnel refused) | Library docs from installed package types and READMEs in `node_modules`; WebSearch/WebFetch for anything else |
| Slack, Figma, Linear, Notion, Asana, Atlassian, Intercom (design plugin MCPs) | **Failed to connect** (proxy 403) | Not needed for this build; design work uses the design-plugin skills, which work without them |
| ClickUp, Monday (productivity plugin MCPs) | **Failed to connect** (proxy 403) | BUILD_LOG.md and COVERAGE.md track work |
| Fireflies connector | Sign-in expired | Not needed |
| TDD / debugging / verification / brainstorming / spec skills | **Not installed** | TDD done by hand: Vitest tests written before core logic (selection, SM-2, streaks, compression, PE evaluator); `run` skill + Playwright for verification |
| shadcn/ui MCP or CLI registry | Not installed | shadcn-style components written into `src/components/ui` (same Radix + Tailwind + `cva` pattern) |
| Browser MCP (Claude in Chrome / built-in browser) | Not available in a cloud thread | Pre-installed Playwright + Chromium for screenshots and e2e |
| Plan Mode | Not available in a thread session | PLAN.md written and reviewed before any code |
| Linux system WebKit for Tauri | Not installable here | GitHub Actions builds the installers |
| Slash commands, custom subagents in `~/.claude/agents`, CLAUDE.md, project memory | None present (memory index empty) | n/a |
