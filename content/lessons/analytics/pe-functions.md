---
id: pe-functions
title: Performance Equation functions
summary: The core PE function families - archive statistics, search and retrieval, time, math and status - with the traps that catch people, such as TagTot's per-day units.
domain: analytics
coverage: [an.pe-functions]
level: practitioner
roles: [analyst, af-developer]
minutes: 25
order: 20
objectives:
  - Choose the right summary function (TagAvg, TagMean, TagTot, EventCount, PctGood)
  - Use TimeEq, FindEq, PrevEvent, PrevVal and TagVal correctly
  - Apply TagTot's per-day assumption to rates in other units
  - Guard calculations with PctGood, BadVal and NoOutput
keyTerms: [tagtot, tagavg, tagmean, timeeq, findeq, prevevent, tagval, badval, eventcount, pctgood, nooutput, curve-function, poly-function, daysec, bom-function]
knowledgeCheck: [q-pe-functions-tagtot-units, q-pe-functions-weighting, q-pe-functions-quality-guard]
related: [pe-syntax, af-analysis-functions, time-vs-event-weighting]
sources: [af-analyzing-pi-data-2018, af-pisquare-tagtot-units, af-pisquare-time-vs-event-weighted, af-pisquare-retrieval-methods-timerange, af-pisquare-sum-values, af-calc-asset-analytics-2022, af-pisquare-cumulative-duration, af-data-exploration-notification-2020, af-pisquare-number-occurrences, af-pisquare-prevevent-prevval, af-pisquare-last-recorded-value, af-using-af-analyze-asset-2019, af-pisquare-pe-to-analytics-migration, af-pisquare-pe-zero-2min, af-pisquare-pe-text-output, af-pisquare-timestamp-diff, fn-rs2012-asia-calcs, fn-rs2012-oceania-calcs, fn-using-af-analyze-2019, fn-analyzing-pi-data-2018, fn-gh-picatalog, af-pisquare-tagtot-condition]
verify: false
---

## Plain English

PE has a library of more than 100 built-in functions. OSIsoft's 2018 course sorts them into
categories:

| Category | Examples |
|---|---|
| Archive Value Statistics | TagAvg, PctGood |
| Date and Time | Bod, Hour |
| Logical | And, If |
| Math | Abs, Sqr |
| PI digital states | DigState, DigText |
| Point Attributes | TagSpan, TagType |
| Search and Retrieval | TimeEq, NextEvent |
| Statistical | Rand, Total |
| Status | NoOutput, TagBad |
| String | Len, Text |

Most functions that work on history take a tag (or attribute), a start time and an end time:
`TagAvg('CaseTemp','*-1h','*')`.

## Deep Dive

**Summaries.**

- `TagAvg(tag, st, et)`: time-weighted average.
- `TagMean(tag, st, et)`: event-weighted mean of recorded events (the exception among mostly
  time-weighted functions).
- `TagTot(tag, st, et)`: time integral that **assumes the rate is per day** and knows nothing of the
  tag's units. A per-hour rate needs `* 24`.
- `EventCount(tag, st, et)`: number of events. `TagMean * EventCount` gives an event-weighted sum.
- `PctGood(tag, st, et)`: percent of good data, ideal as a guard.
- The 2022 course also names TagMax, TagNum, NumOfChanges, TimeGE and TimeGT.

**Search and retrieval.**

- `TimeEq(tag, st, et, value)`: seconds the input equalled the value. It reads every event in the
  window, so cost grows with event count.
- `FindEq(tag, st, et, value)`: timestamp of an occurrence; start later than end searches backwards.
- `PrevEvent(tag, time)` / `PrevVal(tag, time)`: time / value of the previous recorded event.
  `PrevEvent('tag','*+1s')` includes an event at the current time.
- `TagVal(tag [, time])`: value at a time; with no time it uses the evaluation time.

**Math and time.** `Curve(x, (x1,y1) (x2,y2) ...)` interpolates linearly between points (spaces between
pairs). `Poly(x, c0, c1, ...)` evaluates a polynomial. `Avg(a, b, ...)` averages its arguments.
`DaySec(time)` gives seconds since midnight; `Bom(time)` the beginning of the month.

**Status.** `BadVal(x)` tests for a bad value; `NoOutput()` writes nothing.

**In PI DataLink.** `PIExpVal("<PE expression>", time, ...)` evaluates PE in Excel; inside the string,
double quotes are doubled. "Calculated Data" cannot return strings from IF logic; "Sampled Data" with
a PE expression can.

> [!VERIFY]
> Exact signatures beyond the examples shown, including optional percent-good arguments, are not
> confirmed: the official alphabetical PE reference was unreadable. A third-party 112-name catalogue
> is incomplete (it lacks Abs, Total and Rand), so do not treat it as the full list.

## Worked Example

From an OSIsoft regional seminar, for a pump with `PowerDraw` (a per-hour rate) and `CaseTemp`:

```text
// Cooling to power ratio
TagAvg('CaseTemp','*-1h','*') / (TagTot('PowerDraw','*-1h','*') * 24)
// Daily run hours above 20 A
TimeGE('PowerDraw','*-24h','*',20) / 3600
// Hourly power draw with a quality guard
IF PctGood('PowerDraw','*-1h','*') > 50 THEN TagTot('PowerDraw','*-1h','*') * 24 ELSE NoOutput()
```

Month-to-date sum of production events: `TagMean(prod,bom('*'),'*')*EventCount(prod,bom('*'),'*')`.

## Diagram

```mermaid
flowchart TD
  Q{What do you need} -->|average of a continuous rate| A[TagAvg - time-weighted]
  Q -->|average of discrete samples| M[TagMean - event-weighted]
  Q -->|total of a rate| T[TagTot - multiply by 24 for per-hour]
  Q -->|time in a state| E[TimeEq or TimeGE - seconds]
  Q -->|when something happened| F[FindEq or PrevEvent - timestamp]
  Q -->|is data trustworthy| G[PctGood or BadVal then NoOutput]
```

## Common Mistakes

- **Forgetting TagTot's per-day assumption.** Totals of per-hour rates come out 24 times too small.
- **TagAvg where TagMean is wanted** on sparse discrete data, or the reverse.
- **Averages hiding values.** `TagAvg = 0` can be true for -1 and +1; use `TimeEq` to test "was zero".
- **Comma-separated Curve points.**
- **Expecting PrevGoodVal in AF.** It does not exist; combine BadVal, PrevVal and PrevEvent.

## Real-World Scenario

Two PI Square threads show the TagTot trap in practice. In one, the working expression for a total
from a flow measured in t/h was `TagTot('filtredFlow', BOM('*'), '*') * 24`: the `* 24` is needed
because TagTot integrates as if the rate were per day. In the other, the answer explains that
TagTot "has no knowledge of the actual units of the input rate tag", and that AF will not convert
the result from a power class to an energy class for you.
