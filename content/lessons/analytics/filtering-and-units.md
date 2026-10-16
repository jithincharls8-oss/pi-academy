---
id: filtering-and-units
title: Filtered calculations and units in analyses
summary: How to summarise only the values that meet a condition, before and after AF 2018 arrays, and how units of measure really behave in analysis outputs.
domain: analytics
coverage: [an.filtering-units]
level: expert
roles: [analyst, af-developer]
minutes: 15
order: 70
objectives:
  - Build filtered summaries with an intermediate attribute or with arrays
  - Explain why split calculations can disagree with PI DataLink filtered summaries
  - Know when AF converts units and when you must use Convert()
keyTerms: [filtered-calculation, intermediate-attribute, convert-function, unit-of-measure, uom-class, filterdata, tagtot]
knowledgeCheck: [q-filtering-units-no-dimension, q-filtering-units-convert, q-filtering-units-intermediate]
related: [af-analysis-functions, tables-and-units-of-measure, pe-functions]
sources: [af-pisquare-tagtot-condition, af-pisquare-filter-expression, af-pisquare-tagtot-units, af-pisquare-uom-conversion-analytics, af-using-af-analyze-asset-2019, af-calc-asset-analytics-2022, af-pisquare-number-occurrences, af-data-exploration-notification-2020]
verify: false
---

## Plain English

A **filtered calculation** summarises only some values: "average flow while the pump is running".

- **Before AF 2018** you made an **intermediate attribute** that holds the value only when the
  condition is true, then summarised that attribute.
- **From AF 2018** array functions such as `RecordedValuesByCount` and `FilterData` can filter inside
  one expression.

**Units** are the other trap. Analyses do not understand units. AF assumes the result is already in
the output attribute's unit, unless you tell it with `Convert()`.

## Deep Dive

**Intermediate attribute pattern.**

```text
If('BIT'=1) then 'Tag1' else NoOutput()
```

A second analysis then averages or totals that output. KB01120 "Filtered calculations in Asset
Analytics" documents filtered-calculation approaches.

**Why results can differ.** PI DataLink filtered summaries use AF SDK filtered summaries. In one test
a two-step AF calculation gave 55.689 against DataLink's 66.78 for the same period; the difference was
blamed on interpolation when the calculation is split in two.

**Units in analyses.**

- Analyses have no dimensional logic; AF assumes the output is already in the output attribute's UOM.
- A summary (non-PE) expression converts to the output's UOM only when it contains no mathematical
  operations. Otherwise wrap the result in `Convert(<expression>, "kW")`.
- AF converts between a PI Point and an attribute, or between two attributes, only within one UOM
  class.
- TagTot does not know its input's units and assumes per-day rates.

> [!VERIFY]
> Whether Convert() converts from the input's UOM or only labels the result is not settled by the
> sources, which show both uses. The AF SDK RecordedValues filter-expression syntax is named only.

## Worked Example

The PI World 2019 lab turns a power curve into an output in kW:

```text
Convert(Curve('Adjusted Wind Speed', (0,0) (3.99,0) (4,78) ...),"kW")
```

Without `Convert`, a calculation that adds values in kg and writes to an attribute in grams would be
stored as if the number were already grams, giving a result 1,000 times too small.

## Diagram

```mermaid
flowchart TD
  Q{Filtered summary needed} -->|AF before 2018| I[Intermediate output: value or NoOutput]
  I --> S[Second analysis summarises the intermediate output]
  Q -->|AF 2018 or later| A[Array: RecordedValuesByCount then FilterData]
  A --> S2[Summarise the filtered array]
  S --> U{Does the expression do maths}
  S2 --> U
  U -->|yes| C[Wrap in Convert with the output unit]
  U -->|no| O[Written in output attribute UOM]
  C --> O
```

## Common Mistakes

- **Adding kg values into a gram attribute without Convert.**
- **Expecting TagTot to convert a per-hour rate.** Multiply by 24.
- **Expecting a split AF calculation to match a DataLink filtered summary exactly.**
- **Expecting conversion across UOM classes**, such as power to energy.

## Real-World Scenario

On PI Square, a user compared a PI DataLink filtered average with the same filter built in AF as two
steps (an intermediate attribute, then an average) and got 66.78 against 55.689. The thread explained
that DataLink calls AF SDK filtered summaries directly, while splitting the calculation adds
interpolation effects, and pointed to Asset Analytics 2018 array functions as a way to filter without
an intermediate attribute.
