# Research brief for PI Academy research agents

You are researching the AVEVA PI System (formerly OSIsoft PI) so that an offline learning app can
teach it accurately. Your notes become lessons, exam questions, glossary terms and simulator data.
Accuracy matters far more than volume: a wrong fact will be taught to learners.

## Tools and access
- Use WebSearch (mode "standard"; "extended" only when standard is thin) and WebFetch.
- docs.aveva.com pages are JavaScript-rendered: WebFetch usually returns only the page shell. Use WebSearch
  to find them (search snippets often contain the key sentence) and record the URL, but mark it
  `readable: false` unless you actually read the text. Prefer readable sources:
  cdn.osisoft.com PDFs (user guides, presentations, PI World/AVEVA World decks), docs.osisoft.com
  mirrors if reachable, PI Square (pisquare.osisoft.com / community.aveva.com) threads, AVEVA
  release notes, github.com/osisoft and github.com/AVEVA sample repos and README files, AVEVA
  customer stories (aveva.com/en/perspectives/success-stories/), and reputable third-party pages.
- Direct curl to the internet is blocked; only WebSearch/WebFetch work.
- Do NOT call any mcp__hearthbot__ tools. Do not edit any file except your own two output files.

## Output (write exactly these two files)
1. `/home/claude/pi-academy/research/<GROUP>.md` organised by the coverage ids you were given.
   For each coverage id:
   - `### <coverage id>: <title>`
   - **Facts**: bullet list. Each fact is one precise sentence, followed by `[S:<source-id>]` and a
     confidence tag: `(read)` if you read it in the source text, `(snippet)` if only seen in a
     search snippet, `(inferred)` if it is your synthesis from several sources. Include exact names,
     defaults, units, limits, version numbers, command syntax, function signatures, error codes,
     wherever the sources state them. Do not state a default value or number unless a source states it.
   - **Terms**: glossary candidates as `term: one-sentence definition [S:id]`.
   - **Worked-example material**: realistic values or examples from the sources (e.g. a piconfig script,
     a PI Web API URL and JSON fragment, an AF expression).
   - **Common mistakes / pitfalls** seen in sources (PI Square threads are great for this).
   - **Open questions**: things you could not confirm. These will be flagged `verify` in the app.
2. `/home/claude/pi-academy/research/<GROUP>.sources.json`: a JSON array of sources:
   `{"id": "kebab-case-id", "title": "...", "url": "https://...", "publisher": "AVEVA|OSIsoft|PI Square|...",
     "kind": "docs|pisquare|release-notes|case-study|presentation|whitepaper|standard|github|other",
     "accessed": "2026-10-15", "readable": true|false, "notes": "optional"}`
   Prefix every source id with your group name (e.g. `da-compression-pdf-2023`) so ids never collide
   with other agents. Every `[S:id]` in the markdown must exist in this file. Only real URLs you
   actually saw in search results or fetched; never construct or guess a URL.

## Depth
Aim for at least 25 well-sourced facts per coverage id where the topic allows (more for big topics
like point attributes, PI Vision, PI Web API, AF analyses). Write the file incrementally as you go
(do not hold everything until the end), and finish with a short summary at the top of the markdown:
counts of facts by confidence, and the biggest gaps.
