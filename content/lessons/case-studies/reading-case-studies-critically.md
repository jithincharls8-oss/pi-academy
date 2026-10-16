---
id: reading-case-studies-critically
title: Reading PI case studies critically
summary: How to read vendor success stories, conference talks and integrator articles about the PI System, and how to quote their figures honestly.
domain: case-studies
coverage: [cs.library]
level: beginner
roles: [analyst, pi-admin, ot-engineer, af-developer, data-scientist]
minutes: 15
order: 10
objectives:
  - Tell apart the main kinds of case-study source and who reports each figure
  - Distinguish measured results from estimates, expectations and targets
  - Quote a figure exactly, with its reporter, without rounding, converting or combining
  - Check that a story actually uses the PI System before citing it
keyTerms: [success-story, pi-world]
knowledgeCheck: [q-library-who-reports, q-library-estimate-vs-result, q-library-not-pi-check]
related: [case-study-figures-and-inconsistencies, pi-in-oil-gas, pi-in-power]
sources: [ind-aveva-ss-index, ind-pres-ls-2019, ind-ss-xcel, ind-pres-power-trends-2015, ind-ss-uc-davis, ind-pres-water-2015, ind-ss-csl, ind-pres-noble-2015, ind-mipac-oktedi, ind-ss-nestle, ind-ss-henkel, ind-ss-bremen, ind-osisoft-overview]
verify: false
---

## Plain English

PI Academy's [case-study library](#/cases) holds 83 real PI System stories. They are useful: they show
what real companies built and what they say it achieved. But they are not science papers. Most are
written to sell, and almost none are independently audited.

So read every figure with three questions:

1. **Who reported it?** The vendor (AVEVA or OSIsoft), the customer, or an integrator?
2. **What kind of number is it?** A measured result, an estimate, an expectation or a target?
3. **Does the story really use the PI System?** AVEVA sells other historians and platforms too.

> [!IMPORTANT]
> In this app every case-study outcome says who reported it, for example "reported by AVEVA". Keep that
> attribution whenever you reuse a figure.

## Deep Dive

**Three kinds of source.**

| Source | Who reports the figure | Example |
|---|---|---|
| AVEVA success story (aveva.com) | AVEVA, the vendor | Covestro, Illovo, CSL Group |
| User conference talk (OSIsoft UC, PI World, AVEVA World) | The presenting company or integrator, or OSIsoft itself | Luminant (company), Longannet (Capula), Pertamina 2014 (OSIsoft) |
| Integrator article | The integrator | Ok Tedi (Mipac), E Tech biotech |

A **success story** is a vendor-published customer case; its outcomes are as reported by AVEVA, not
independently audited. **PI World / AVEVA World** is the user conference where customers present their own
deployments.

**Results, estimates, expectations, targets.** Watch the verbs:

- Xcel Energy: "Savings and efficiencies are roughly estimated over the last six years at $46 million"
  (an estimate).
- DONG Energy: could "cut OPEX by up to about €20M per year (NPV)" (an expectation, not a measured
  result).
- Detroit Water & Sewerage: "Expected $2,000,000" savings over the next 5 years (an expectation).
- UC Davis: "Projected savings of $197M over 60 years" (a projection).
- Covestro: "on track for a 50% reduction by 2030" (a target).

**Dates.** AVEVA success-story pages show only a 2026 "last published" date, which is not the project
year. Treat the year as "not stated" unless the text gives one.

**Not every AVEVA story is a PI story.** Nestlé Waverly (AVEVA Historian, CONNECT), General Mills
(System Platform), Henkel (MES, System Platform), P&G (System Platform), Barghest (System Platform) and
City of Bremen (InTouch, Historian) were all checked and found not to use PI System.

## Worked Example

**Turning a slide claim into an honest sentence.** A colleague's slide says: "PI saved Xcel $46M."

1. Find the source: an AVEVA success story quoting Kasen Huwa of Xcel Energy.
2. Read the exact words: "Savings and efficiencies are roughly estimated over the last six years at
   $46 million".
3. Note the kind of figure: a rough estimate, over six years, of savings *and efficiencies*.
4. Write it honestly: "Xcel Energy estimates savings and efficiencies of roughly $46 million over six
   years from PI-based wind forecasting (Kasen Huwa, Xcel Energy, in an AVEVA success story)."

Do not round it to $50M, convert it to a yearly figure, or drop "roughly estimated".

## Diagram

```mermaid
flowchart TD
    F[A figure in a case study] --> W{Who reported it?}
    W --> V[Vendor - AVEVA or OSIsoft]
    W --> C[Customer at a conference]
    W --> I[Integrator]
    V --> K{What kind of number?}
    C --> K
    I --> K
    K --> R[Measured result]
    K --> E[Estimate, expectation or target]
    R --> P{Uses PI System?}
    E --> P
    P -- yes --> Q[Quote exactly with reporter and kind]
    P -- no --> X[Do not cite as a PI example]
```

## Common Mistakes

- **Dropping the reporter.** "Covestro cut energy 30%" hides that AVEVA reported it.
- **Treating estimates as results.** "Estimated", "expected", "projected", "up to" and "on track" all
  change the meaning.
- **Rounding or converting.** Never round, convert currencies or units, or annualise.
- **Citing non-PI AVEVA stories** as PI examples.
- **Reading the publish date as the project year.**

## Real-World Scenario

**Noble Energy, read carefully.** Noble Energy reported that using PI during the Aseng FPSO startup
helped engineers increase production by "an estimated 10,000 barrels of oil per day". That is the
company's own estimate, given in its own OSIsoft seminar presentation. It is a strong, specific claim,
but it is still an estimate. Quote it with both qualifiers: "estimated" and "reported by Noble Energy".
See [Noble Energy](#/cases/noble-energy).

**CSL Group, a rare exception.** CSL's "8,233 mt CO2e avoided across 11 vessels in a year" is described as
third-party verified. When a source says that, mention it: it makes the figure stronger. See
[CSL Group](#/cases/csl-group).
