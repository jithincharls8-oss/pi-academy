# fn: PE and AF Asset Analytics function catalogues, operators, time grammar, system states, AF enums

## Summary (read this first)

- **Fact counts (approx.)**: read 96, snippet 0, inferred 31. In the catalogue tables, each row's evidence column marks the name as sourced or inferred. Most signatures and return types remain (inferred).
- **Biggest gap**: no authoritative, readable copy of the PE function reference or the AF "List of expression functions reference" was found. Every primary reference is either JS-rendered (docs.aveva.com, the zoominsoftware mirror), served without its body (manualzz, Scribd), or cut off by the PDF text limit (the 2018 workbook's Appendix B "Performance Equation Operands and Functions" on p.218 lies past the ~125k-character cap). Wayback Machine is blocked.
- **What is solid**: the function **names** (about 130) are corroborated across several sources. These are OSIsoft courses, PI Square, AVEVA Feedback, and a third-party 112-name catalogue that says it was audited against the PI Server Applications User's Guide. The AF SDK and PI Web API **enums** (summary types with bit values, calculation basis, boundary type, retrieval mode, timestamp calculation) were read from a copy of the PI Web API 2018 SP1 reference and from AF SDK type stubs. The **PI time-string grammar** was read from the PI Web API reference.
- **Still unverified**: exact PE signatures, especially optional arguments such as `pctgood` and the argument order of `Arma`, `MedianFilt`, `Delay`, `Impulse` and the `Alm*` functions. Also unverified: return types, the steam function names, AF-only function signatures (`MapData`, `ArrayLength`, `HasValueChanged`, …), operator precedence, and the string-concatenation operator. **System digital state codes** are unverified (only names are sourced). Flag all of these `verify` in the app.
- Cross-reference: research/af.md sections an.pe-syntax, an.pe-functions and an.af-functions hold further PI Square–sourced usages (TagTot per-day units, TagMean event weighting, FindEq backward search, PrevEvent `'*+1s'` idiom, `Int(ParseTime("*") - PrevEvent(...))`). They are not repeated here.

---

### fn.pe-catalogue: PI Performance Equations (PE) function catalogue

**Facts**
- The authoritative PE references are the AVEVA pages "Alphabetical reference for PE functions", "PE functions by type" and "Built-in performance equation functions". None of these pages was readable. [S:fn-docs-pe-alpha-ref] [S:fn-docs-pe-by-type] [S:fn-docs-pe-builtin] (read: titles only)
- The OEM (Rockwell) edition of the PI Server Applications guide covers the PE Scheduler, PE Recalculator, Batch Database, Totalizer, Alarm subsystem and Real-Time SQC. Its "PI Performance Equations Syntax and Functions Reference" starts on p.57 and its "PI Steam Functions Reference" on p.199. [S:fn-manualzz-rockwell-pi-server-apps] (read: TOC)
- The PI DataLink User Guide has "PI Expressions", "Syntax", "Operators" and "Performance Equation Functions" sections, so DataLink expressions use the PE function set. [S:fn-manualzz-datalink-ug] (read: TOC)
- OSIsoft's 2018 course groups PE functions into these categories: Archive Value Statistics (TagAvg, PctGood), Date and Time (Bod, Hour), Logical (And, If), Math (Abs, Sqr), PI digital states (DigState, DigText), Point Attributes (TagSpan, TagType), Search and Retrieval (TimeEq, NextEvent), Statistical (Rand, Total), Status (NoOutput, TagBad) and String (Len, Text). [S:fn-analyzing-pi-data-2018] (read; category table in section 7.2, also transcribed in af.md)
- OSIsoft seminar decks describe the PE library as a "100+ function library" with "Universal PI PE syntax". [S:fn-rs2012-asia-calcs] (read)
- `TagAvg('CaseTemp','*-1h','*')` is a time-range average with arguments (tag, start time, end time). [S:fn-rs2012-asia-calcs] (read)
- `TagTot('PowerDraw','*-1h','*') * 24` is used for an hourly total of a per-hour rate, because TagTot integrates as if the rate were per day. [S:fn-rs2012-asia-calcs] (read; the per-day rule itself is sourced in af.md)
- `TimeGE('PowerDraw','*-24h','*',20) / 3600` gives hours per day during which PowerDraw ≥ 20. TimeGE returns seconds. [S:fn-rs2012-asia-calcs] (read; "returns seconds" inferred from the /3600)
- `PctGood('PowerDraw','*-1h','*') > 50` is used as a data-quality guard before computing a total, with `NoOutput()` in the ELSE branch. [S:fn-rs2012-asia-calcs] [S:fn-rs2012-oceania-calcs] (read)
- `NoOutput()` takes no arguments and suppresses the result. [S:fn-rs2012-oceania-calcs] (read) [S:fn-gh-calculations-md] (read: "supressão do envio do resultado ao PI")
- `TimeEq('Press Status','t','*',"Running")` returns the time spent in a digital state. [S:fn-calc-asset-analytics-2022] (read)
- `DaySec` returns seconds from midnight to a given time. [S:fn-calc-asset-analytics-2022] (read)
- `Curve( x, (x1,y1) (x2,y2) … (xn,yn) )` "calculates a best fit curve for a given set of data points (x,y pairs)". The (x,y) pairs are separated by spaces, not commas. [S:fn-using-af-analyze-2019] (read) [S:fn-calc-asset-analytics-2022] (read)
- `Poly` evaluates a polynomial from numeric coefficients. [S:fn-calc-asset-analytics-2022] (read)
- The 2022 course also names TagMax, TagVal, TagNum (PI Point ID lookup), NumOfChanges (counts value/state changes), Concat (joins strings), BadVal, Exit, BOM and `Char(10)` (line break in a string result). [S:fn-calc-asset-analytics-2022] (read)
- OSIsoft's AF workbook names FindEq, TimeGE, TagMax and TagAvg as examples of PE functions used in Expression analyses. It describes the syntax as "variables, operators (+, *, …) and functions (sin, cos, abs, sqrt,…)". [S:fn-building-assets-workbook] (read)
- `MedianFilt` returns the median of the last values of a series, and the `Alm*` functions query alarm state. [S:fn-gh-calculations-md] (read; third party citing the PI Server Applications User's Guide)
- A third-party catalogue audited against the PE reference lists 112 PE names, including Arma, Impulse, MedianFilt, Delay, IsDST, AlmAckStat, AlmCondition, AlmCondText, AlmPriority, StateNo, Compare, Ascii, Char, Atn2, Mod, PStDev, SStDev, TagName and TagNum. [S:fn-gh-picatalog] (read; third party)
- That 112-name catalogue omits Abs, Total and Rand, which OSIsoft's own course lists. So it is incomplete and must not be used as the closed list. [S:fn-gh-picatalog] [S:fn-analyzing-pi-data-2018] (inferred)
- PE uses `Sqr` for square root (course: "Math (Abs, Sqr)"). The AF workbook slide writes "sqrt", and whether `Sqrt` is also accepted is unverified. [S:fn-analyzing-pi-data-2018] [S:fn-building-assets-workbook] (inferred)
- PE also has a family of steam-table functions (separate "PI Steam Functions Reference"), but their names were not read. [S:fn-manualzz-rockwell-pi-server-apps] (read: TOC)

**Catalogue table.** Legend: Evidence lists the sources that name the function. "sig: src" means the signature or example was read in a source. "sig: inf" means the signature is training knowledge and must be marked `verify`. `st`/`et` = start/end time expressions, `tag` = tag/attribute in single quotes, `pctgood` = optional minimum percent-good. Return types are (inferred) unless marked.

| Name | Category | Signature | Arguments | Returns | Example | Evidence |
|---|---|---|---|---|---|---|
| TagAvg | Archive value statistics | `TagAvg(tag, st, et [, pctgood])` | time-weighted average over range | number | `TagAvg('CaseTemp','*-1h','*')` | course, decks; sig: src (3 args), pctgood inf |
| TagTot | Archive value statistics | `TagTot(tag, st, et [, pctgood])` | time integral, input assumed per day | number | `TagTot('PowerDraw','*-1h','*')*24` | decks, course; sig: src (3 args) |
| TagMax | Archive value statistics | `TagMax(tag, st, et [, pctgood])` | maximum over range | number | `TagMax('tag1','-1h','*')` | course 2022, AF workbook, 3rd party; sig: inf |
| TagMin | Archive value statistics | `TagMin(tag, st, et [, pctgood])` | minimum | number | `TagMin('tag','t','*')` | catalogue, 3rd party; sig: inf |
| TagMean | Archive value statistics | `TagMean(tag, st, et [, pctgood])` | event-weighted mean | number | `TagMean('tag','*-2m','*')` | catalogue; af.md PI Square; sig: src (3 args) |
| PctGood | Archive value statistics | `PctGood(tag, st, et)` | % of time with good values | number 0–100 | `PctGood('PowerDraw','*-1h','*') > 50` | course, decks; sig: src |
| EventCount | Archive value statistics | `EventCount(tag, st, et [, pctgood])` | number of archived events | integer | `EventCount('prod',Bom('*'),'*')` | catalogue; af.md; sig: src (3 args) |
| NumOfChanges | Archive value statistics | `NumOfChanges(tag, st, et)` | count of value changes | integer | `NumOfChanges('Pump State','t','*')` | course 2022; sig: inf |
| Range | Archive value statistics | `Range(tag, st, et [, pctgood])` | max − min over range | number | `Range('Temp','*-1d','*')` | catalogue; sig: inf (name may be TagRange in some docs, verify) |
| StDev | Archive value statistics | `StDev(tag, st, et [, pctgood])` | time-weighted std. dev. | number | `StDev('Temp','*-1d','*')` | catalogue; sig: inf |
| TagVal | Search and retrieval | `TagVal(tag [, time])` | value at time (interpolated if no event) | value of tag type | `TagVal('Active Power','*')` | 2019 lab (both forms); sig: src |
| PrevVal | Search and retrieval | `PrevVal(tag, time)` | last recorded value before time | value | `PrevVal('tag','*')` | catalogue, 3rd party, af.md; sig: src |
| NextVal | Search and retrieval | `NextVal(tag, time)` | first recorded value after time | value | `NextVal('tag','y')` | catalogue, 3rd party; sig: inf |
| PrevEvent | Search and retrieval | `PrevEvent(tag, time)` | timestamp of previous event | time | `PrevEvent('tag','*+1s')` | catalogue; af.md; sig: src |
| NextEvent | Search and retrieval | `NextEvent(tag, time)` | timestamp of next event | time | `NextEvent('tag','t')` | course; sig: inf |
| FindEq / FindNE / FindGT / FindGE / FindLT / FindLE | Search and retrieval | `FindEq(tag, st, et, value)` | first time the condition holds; st > et searches backward | time | `FindGE('tag1','-1d','*',50)` | AF workbook, catalogue, 3rd party; sig: src (4 args) |
| TimeEq / TimeNE / TimeGT / TimeGE / TimeLT / TimeLE | Search and retrieval | `TimeGE(tag, st, et, value)` | total seconds the condition held | number (s) | `TimeGE('PowerDraw','*-24h','*',20)/3600` | decks, course; sig: src |
| Abs | Math | `Abs(x)` | absolute value | number | `Abs(DeltaTemp/2)` | course; sig: src (af.md example) |
| Sqr | Math | `Sqr(x)` | square root | number | `Sqr(16)` = 4 | course, catalogue; sig: inf |
| Exp, Log, Log10 | Math | `Exp(x)`, `Log(x)` (natural), `Log10(x)` | exponential / logs | number | `Log10(1000)` = 3 | catalogue; sig: inf (`Ln` appears only in a PI Vision 3rd-party list) |
| Sin, Cos, Tan, Asin, Acos, Atn, Atn2, Sinh, Cosh, Tanh | Math | `Sin(radians)`, `Atn2(y, x)` | trig in radians | number | `Atn2(1,1)` | catalogue, AF workbook (sin, cos); sig: inf (Atn2 argument order verify) |
| Int, Frac, Float | Math / conversion | `Int(x)`, `Frac(x)`, `Float(x)` | integer part / fractional part / to float | number | `Int(ParseTime("*") - PrevEvent('t','*'))` | catalogue; af.md (Int of time); sig: inf |
| Mod | Math | `Mod(x, y)` | remainder | number | `Mod(7,3)` = 1 | catalogue; sig: inf |
| Round, Trunc | Math / time | `Round(x [, unit])`, `Trunc(x [, unit])` | round/truncate a number or time to a unit | number or time | `Round('tag1',2)`, `Trunc(28.75,10)` | catalogue, 3rd party; sig: inf (unit semantics verify) |
| Sgn | Math | `Sgn(x)` | −1, 0 or 1 | integer | `Sgn(-5)` = −1 | catalogue; sig: inf |
| Poly | Math | `Poly(x, c0, c1, …, cn)` | polynomial c0 + c1·x + … | number | `Poly('Speed', 1, 0.5, 0.01)` | course 2022; sig: inf (coefficient order verify) |
| Curve | Math | `Curve(x, (x1,y1) (x2,y2) … (xn,yn))` | piecewise-linear lookup | number | `Curve('Adjusted Wind Speed',(0,0) (4,78) (16,3000))` | 2019 lab, 2022 course; sig: src |
| Avg, Max, Min, Median, Total | Statistical (argument lists) | `Avg(a, b, …)` | over arguments (arrays in AF) | number | `Avg('Probe 1','Probe 2')` | course (Total), catalogue; sig: src (Avg) |
| PStDev, SStDev | Statistical | `PStDev(a, b, …)`, `SStDev(a, b, …)` | population / sample std dev of arguments | number | `SStDev(1,2,3)` | catalogue; sig: inf |
| Rand | Statistical | `Rand()` | random number 0–1 | number | `Rand()` | course, AVEVA Feedback; sig: inf |
| Bod, Bom, Bonm, Noon | Date and time | `Bod(time)` etc. | start of day / month / next month; noon | time | `Bom('*')` | course, catalogue; sig: src (Bom) |
| Day, Hour, Minute, Second, Month, Year, Weekday, Yearday | Date and time | `Hour(time)` | component of a time | integer | `Weekday('*')` | course (Hour), catalogue, 3rd party; sig: src (3rd party) |
| DaySec | Date and time | `DaySec(time)` | seconds since midnight | number | `DaySec('*')` | course 2022; sig: src |
| ParseTime | Date and time | `ParseTime(string)` | evaluates a time string at run time | time | `ParseTime("*")` | catalogue; af.md; sig: src |
| IsDST | Date and time | `IsDST(time)` | daylight saving flag | boolean | `IsDST('*')` | catalogue; sig: inf |
| DigState | Digital states | `DigState(string)` | state from name | digital | `DigState("Running")` | course; sig: inf |
| DigText | Digital states | `DigText(digital)` | state name as text | string | `DigText('Pump State')` | course; sig: inf |
| StateNo | Digital states | `StateNo(digital)` | state code (offset) | integer | `StateNo('Pump State')` | catalogue; sig: inf |
| BadVal | Status | `BadVal(x)` | true if value is a bad/system state | boolean | `IF BadVal('Flow') THEN 0 ELSE 'Flow'` | course 2022; af.md; sig: src |
| IsSet | Status | `IsSet(digital, …)` | digital-state test (semantics verify) | boolean | n/a | catalogue, AVEVA Feedback; sig: inf |
| TagBad | Status | `TagBad(tag [, time])` | true if tag value is bad at time | boolean | `TagBad('Flow','*')` | course; sig: inf |
| NoOutput | Status | `NoOutput()` | write nothing this evaluation | none | `IF … THEN … ELSE NoOutput()` | decks, course; sig: src |
| TagDesc, TagEU, TagExDesc, TagName, TagSource, TagType, TagTypVal, TagZero, TagSpan, TagNum | Point attributes | `TagEU(tag)` | point attribute values | string/number | `TagSpan('tag')` | course (TagSpan, TagType, TagNum), catalogue; sig: inf |
| Concat | String | `Concat(s1, s2, …)` | join strings | string | `Concat("Pump ", DigText('State'))` | course 2022; sig: inf |
| Text | String | `Text(v1, v2, …)` | join values as text | string | `Text(Round('sinusoid',1)," is the value")` | course, 3rd party; sig: src (3rd party) |
| Len, Left, Right, Mid, InStr, LCase, UCase, Trim, LTrim, RTrim | String | `Left(s, n)`, `Mid(s, start [, len])`, `InStr([start,] s1, s2)` | string ops | string/int | `Left("ABCDE",2)` | course (Len), catalogue; sig: inf |
| Ascii, Char, Compare, Format, String | String | `Char(n)`, `Ascii(s)`, `Format(x, fmt)`, `String(x)` | char codes / format / convert | string/int | `Char(10)` (line break) | course 2022 (Char(10)), catalogue; sig: inf |
| Arma, Delay, Impulse, MedianFilt | Miscellaneous / filters (PE tags) | n/a (not read) | filters that use the PE tag's own history | number | n/a | catalogue, Calculations.md; sig: inf (do not teach syntax) |
| AlmAckStat, AlmCondition, AlmCondText, AlmPriority | Alarm (PI Alarm subsystem) | `AlmCondition(alarmtag)` (inf) | alarm state queries | varies | n/a | catalogue, Calculations.md; sig: inf |

**Terms**
- Performance Equation (PE) function: a built-in function of the PI expression language, used in PE tags, PI DataLink expressions and AF analyses [S:fn-manualzz-datalink-ug]
- pctgood (argument): an optional minimum percent-good threshold on archive-statistic functions (unverified name) [S:fn-docs-pe-alpha-ref]
- Steam functions: PE functions that compute steam-table properties, documented in their own reference chapter [S:fn-manualzz-rockwell-pi-server-apps]

**Worked-example material**
```
// Cooling to power ratio
TagAvg('CaseTemp','*-1h','*') / (TagTot('PowerDraw','*-1h','*') * 24)
// Daily run hours above 20 A
TimeGE('PowerDraw','*-24h','*',20) / 3600
// Hourly power draw with quality guard
IF PctGood('PowerDraw','*-1h','*') > 50 THEN TagTot('PowerDraw','*-1h','*') * 24 ELSE NoOutput()
```
[S:fn-rs2012-asia-calcs] (read)

**Common mistakes / pitfalls**
- Treating the 112-name third-party catalogue as complete. It lacks Abs, Total and Rand. [S:fn-gh-picatalog] (inferred)
- Writing `Sqrt` where PE documents `Sqr` (verify whether both are accepted). [S:fn-building-assets-workbook] (inferred)
- Comma-separating Curve points. The documented form separates `(x,y)` pairs with spaces. [S:fn-using-af-analyze-2019] (read)

**Open questions** (all `verify`)
- Exact optional-argument lists, especially whether every Tag* summary takes `pctgood` and the exact name of the range/stdev archive functions (`Range`/`TagRange`, `StDev`/`TagStD`).
- Signatures of Arma, Delay, Impulse, MedianFilt, IsSet and the Alm* functions.
- Steam function names (for example StmPT_H-style names; none were read).
- Whether `Ln` exists in PE or only in PI Vision calculations.
- The complete category assignment from "PE functions by type".

---

### fn.af-catalogue: AF Asset Analytics expression functions (beyond PE)

**Facts**
- The authoritative list is the AVEVA page "List of expression functions reference", which was not readable. [S:fn-docs-af-expr-functions] (read: title only)
- AF 2018 SP2 added `Exit()` "to end analysis execution". [S:fn-pisquare-af2018sp2] (read)
- AF 2018 SP2 added `Split()` "to make string arrays in analysis; specify string and delimitter". [S:fn-pisquare-af2018sp2] (read)
- AF 2018 SP2 added `NewLine()` "to the StringBuilder to enable multi-line strings". [S:fn-pisquare-af2018sp2] (read)
- AF 2018 SP2 made "All of the tag summary functions (e.g., TagTot, TagAvg, etc.)" accept an event-weighted option. It gave the data summary functions (Total, Avg, …), "formerly only event-weighted", a time-weighted option for arrays. [S:fn-pisquare-af2018sp2] (read)
- AVEVA Feedback participants name these existing array-capable functions: Concat, RecordedValues, Rand(), MapData, FilterData, TagVal, TimeStamp, ArrayLength, Total and IsSet. "You can already do Total(A1) to sum an array." [S:fn-feedback-pida-850] (read)
- Array functions such as recordedvalues(), map and count() were "introduced with AF 2018", and a countif can be built from them. [S:fn-feedback-pida-855] (read)
- As of 2022, requested but not available: a sort function, dot product, ForEach, index search, sequence/shuffle/sample and cubic spline. [S:fn-feedback-pida-850] [S:fn-feedback-pida-855] (read)
- Stephen Kwan's comment: Asset Analytics "was designed to be a streaming calculation engine", which is why ad hoc functions like cubic spline are questioned. [S:fn-feedback-pida-850] (read; author attribution unverified)
- `Split(string, "|")[2]` was reported as not working (indexing the result of Split inline), with no fix given. [S:fn-pisquare-help-with-arrays] (read)
- "To my knowledge there is not any client which is able to display anything meaningful for an Array type Attribute." [S:fn-pisquare-help-with-arrays] (read)
- `Convert(expr, "kW")` explicitly applies a UOM to a result. [S:fn-using-af-analyze-2019] (read) [S:fn-calc-asset-analytics-2022] (read)
- `TagVal('Adjusted Wind Speed')` with no time argument and `TagVal('Active Power','*')` are both used in OSIsoft labs. [S:fn-using-af-analyze-2019] (read)
- Both `//` and `/*` were reported to begin a comment in analysis expressions. [S:fn-using-af-analyze-2019] (read; extraction rendered them as "\\ and \*", so the exact characters need verifying)

**Catalogue table** (AF-only or AF-extended; signatures (inferred) unless marked)

| Name | Category | Signature | Returns | Example | Evidence |
|---|---|---|---|---|---|
| Convert | Conversion / UOM | `Convert(expr, "uom")` | number with UOM | `Convert(Curve(...),"kW")` | 2019 lab, 2022 course; sig: src |
| NoOutput | Status | `NoOutput()` | none | `IF x=0 THEN NoOutput() ELSE x` | sig: src |
| Exit | Status (AF 2018 SP2) | `Exit()` | ends evaluation, later rows skipped | `IF BadVal('In') THEN Exit() ELSE 'In'` | SP2 blog; sig: inf (no args) |
| BadVal | Status | `BadVal(x)` | boolean | `BadVal('Flow')` | sig: src (af.md) |
| HasChanged / HasValueChanged | Status | `HasChanged('attr', time)` | boolean | `HasChanged('Setpoint','*')` | af.md (Optimizing Analytics 2020); exact name verify |
| EventFrame | Event frame | `EventFrame("StartTime" \| "EndTime" \| "Duration")` | time / span | `EventFrame("StartTime")` | af.md; sig: src |
| RecordedValues | Array | `RecordedValues('attr', st, et)` | array | `RecordedValues('Temp','*-1h','*')` | AVEVA Feedback; sig: inf |
| RecordedValuesByCount | Array | `RecordedValuesByCount('attr', time, n)` | array | `RecordedValuesByCount('State','*',10)` | af.md lab; sig: src |
| FilterData | Array | `FilterData(array, predicate using $val)` | array | `FilterData(A, $val = "Drying")` | af.md lab, Feedback; sig: src |
| MapData | Array | `MapData(array, expression using $val)` | array | `MapData(A, $val * 2)` | Feedback (name only); sig: inf |
| ArrayLength | Array | `ArrayLength(array)` | integer | `ArrayLength(A)` | Feedback (name only); sig: inf |
| Count | Array | `Count(array)` | integer | `Count(FilterData(A, $val > 5))` | Feedback ("count()"); sig: inf |
| TimeStamp | Array / time | `TimeStamp(array[i])` or `TimeStamp('attr')` | time | `TimeStamp(A[1])` | af.md lab; sig: src |
| Total, Avg, Min, Max, Median, StDev, PStDev, SStDev | Data summary (arrays) | `Total(array [, weighting])` | number | `Total(A1)` | Feedback (Total), SP2 blog; weighting option sig: inf |
| Split | String / array (2018 SP2) | `Split(string, delimiter)` | string array | `Split("a\|b\|c", "\|")` | SP2 blog; sig: src (args described) |
| NewLine | String (2018 SP2) | `NewLine()` | string | `Concat("L1", NewLine(), "L2")` | SP2 blog; sig: inf |
| Concat | String | `Concat(s1, s2, …)` | string | `Concat("A","B")` | 2022 course, Feedback; sig: inf |
| NumOfChanges | Statistics | `NumOfChanges('attr', st, et)` | integer | `NumOfChanges('Pump','t','*')` | 2022 course; sig: inf |
| LastValue | Array (?) | n/a | n/a | n/a | Feedback mentions only; existence verify |

**Terms**
- Array (analysis): a value type in Expression and Event Frame Generation analyses since AF 2018, produced by RecordedValues/Split and consumed by FilterData/MapData/Total [S:fn-feedback-pida-850]
- Exit(): an AF 2018 SP2 function that ends the current analysis evaluation [S:fn-pisquare-af2018sp2]
- Split(): an AF 2018 SP2 function that turns a delimited string into a string array [S:fn-pisquare-af2018sp2]

**Worked-example material**
- countif idiom: `Count(FilterData(RecordedValues('Valve','t','*'), $val = 1))` (inferred composition of the functions named in [S:fn-feedback-pida-855]. Verify the syntax.)
- Wind-turbine expected power: `Convert(Curve('Adjusted Wind Speed', (0,0) (3.99,0) (4,78) (5,193) … (25,3000) (25.01,0) (100,0) ),"kW")`. [S:fn-using-af-analyze-2019] (read)

**Common mistakes / pitfalls**
- Indexing a function result inline (`Split(s,"|")[2]`). Assign it to a variable first (workaround inferred). [S:fn-pisquare-help-with-arrays]
- Expecting clients to display array attributes. [S:fn-pisquare-help-with-arrays]
- Expecting sort, dot-product or loop functions, which did not exist as of 2022. [S:fn-feedback-pida-850]

**Open questions** (verify)
- The full AF-only list and signatures: MapData, ArrayLength, Count, LastValue, HasValueChanged vs HasChanged, any `Now()`/`LastCalculationTime`-style functions, the weighting argument syntax for SP2 summaries, and the 1-based array indexing rule (only seen in one lab).

---

### fn.operators-time: Operators and time-expression grammar

**Facts**
- Operators used in OSIsoft course material are `+ - * / ^` (arithmetic) and `> < = >= <=` (comparison), with `IF … THEN … ELSE` conditionals. [S:fn-calc-asset-analytics-2022] (read) [S:fn-rs2012-asia-calcs] (read)
- `<>` (not equal), `AND`, `OR` and `NOT` appear in OSIsoft labs and are recorded in af.md (an.pe-syntax). In this group, `Or` and `<>` are corroborated by [S:fn-software-athlete-functions] (read; third party), and `IF … or Not Running then NoOutput()` appears in [S:fn-using-af-analyze-2019] (read).
- Chained conditionals use `else if`. [S:fn-using-af-analyze-2019] (read)
- The exponent operator `^` is used, for example `'C1'*X^1 + 'C2'*X^2`. [S:fn-using-af-analyze-2019] (read)
- The OSIsoft AF workbook lists time units s, m, h, d, w, mo and y. [S:fn-building-assets-workbook] (read)
- Reference times are `*` (now), `t` (today 00:00:00), `y` (yesterday 00:00:00) and weekday abbreviations sun–sat (midnight of the most recent such day). [S:fn-building-assets-workbook] (read)
- Examples: `t+8h` = 08:00 today, `y-8h` = 16:00 the day before yesterday, `*+1h` = one hour from now, `t+3d` = midnight three days ahead. Use only one offset per expression. [S:fn-building-assets-workbook] (read)
- The PI Web API states the interval grammar as `{+|-}<number>[.<number>] <interval> { [+|-]<number>[.<number>] <interval> }*`. [S:fn-piwebapi-time-strings] (read)
- Intervals are millisecond(s)/ms, second(s)/s, minute(s)/m and hour(s)/h, which allow fractions, and day(s)/d, month(s)/mo, week(s)/w, weekday(s)/wd and yearday(s)/yd, which do not. [S:fn-piwebapi-time-strings] (read; year `y` appears in the page's example "+ 2y", so its absence from the extracted table is likely an extraction gap)
- "Today"/"T" and "Yesterday"/"Y" "are the beginning of the specified day at 0 hours local time". A weekday name "specifies the most current occurrence at 0 hours local time". [S:fn-piwebapi-time-strings] (read)
- A month name specifies the current day of the month in that month at 0 hours. A number below 32 is a day of the month, and a four-digit number ≥ 1970 is a year. [S:fn-piwebapi-time-strings] (read)
- A null or empty time string is equivalent to `*`. Absolute times must be parseable by .NET `DateTime.TryParse`, and the SQL form `hh:mm:ss:fff` is also accepted. [S:fn-piwebapi-time-strings] (read)
- PI Web API examples: `*-8h`, `01/01`, `Monday+8h`, `T-3d`, `Yesterday + 03:45:30.25`, `Sat, 01 Nov 2008 19:35:00 GMT + 2y+5d-12h+30.55s`. [S:fn-piwebapi-time-strings] (read)
- In URLs, `+` must be URL-encoded because it is read as a space. [S:fn-piwebapi-time-strings] (read)
- A DateTime-format date part allows only one interval unless the date part is quoted. [S:fn-piwebapi-time-strings] (read)
- Value retrieval "By Time" modes in Formula/PI Point DRs are After, At or Before, At or After, Automatic, Before, Exact Time and Interpolated. "Exact -2h" returns a "No Data" error if no value exists then. [S:fn-calc-asset-analytics-2022] (read) [S:fn-building-assets-workbook] (read)

**Terms**
- PI time expression: a reference time (`*`, `t`, `y`, weekday, absolute) plus optional signed interval offsets [S:fn-piwebapi-time-strings]

**Common mistakes / pitfalls**
- Using multiple offsets (`*-1d+2h`) in PI clients, which can behave unpredictably. [S:fn-building-assets-workbook]
- Using fractional days or months (`1.5d`), which is not allowed. [S:fn-piwebapi-time-strings]

**Open questions**
- The string-concatenation operator in PE: no source shows `&` or `+` on strings. Only the `Concat()`/`Text()` functions are sourced. Verify.
- Operator precedence. `==` is not documented. Whether `XOR`/`MOD` exist as operators is unknown.

---

### fn.digital-states: System digital state set

**Facts**
- System states seen in readable sources: "Bad Input" and "Shutdown". These are stored in the value's status, so PI OLEDB Enterprise shows Null for them unless the value is read as a VARIANT. [S:fn-pisquare-oledb-digital-state] (read)
- The AF SDK `AFSystemStateCode` enum members used in code are `NoData`, `NoResult`, `Configure` and `InvalidData`. AF analyses/DRs create them with `AFValue.CreateSystemStateValue(...)`. [S:fn-gh-vitens-dbm] [S:fn-gh-afsdk-course-limitcheck] [S:fn-gh-pi-replay-helpers] (read)
- "Exact" retrieval with no value returns a "No Data" error. [S:fn-building-assets-workbook] (read)
- Other research files record "Pt Created" (shown on new attributes after tag creation), "Scan Off" (left after PE→Analytics migration), "Intf Shut", "I/O Timeout" and "Comm Fail" (written via PI Web API with `"Value": 313`). See af.md, da.md and int.md. Comm Fail = 313 is the only code sourced anywhere in the project.

**Open questions**
- The full SYSTEM state set with codes. Training knowledge (unverified, do not teach as fact): states such as Pt Created, Shutdown, No Data, I/O Timeout, Bad Input, Calc Failed, Comm Fail, Configure, Scan Off, Intf Shut, Over Range, Under Range, Invalid Data, No Result, Arc Off-line, Equip Fail, Bad Quality, Doubtful. Exact codes need [S:fn-docs-afsdk-systemstatecode] or [S:fn-docs-pids-table], both unreadable.

---

### fn.enums: AF summary types, calculation basis, boundary type and related enums

**Facts**
- `AFSummaryTypes` (flags): None=0, Total=1, Average=2, Minimum=4, Maximum=8, Range=16, StdDev=32, PopulationStdDev=64, Count=128, PercentGood=8192, TotalWithUOM=16384, All=24831, AllForNonNumeric=8320. [S:fn-gh-piconnect-af-data] (read)
- PI Web API summary types: Total ("A totalization over the time range"), Average, Minimum, Maximum, Range ("minimum-maximum"), StdDev, PopulationStdDev, Count, PercentGood, TotalWithUOM, All and AllForNonNumeric. [S:fn-piwebapi-summary-type] (read)
- Count is "the sum of event count … when calculation basis is event weighted" and "the sum of event time duration … when … time weighted". [S:fn-piwebapi-summary-type] (read)
- PercentGood is time-based for time-weighted and count-based for event-weighted calculations. [S:fn-piwebapi-summary-type] (read)
- TotalWithUOM returns the same as Total when the input has no UOM, and an error "If no valid units can be determined". [S:fn-piwebapi-summary-type] (read)
- `AFCalculationBasis`: TimeWeighted=0, EventWeighted=1, TimeWeightedContinuous=2, TimeWeightedDiscrete=3, EventWeightedExcludeMostRecentEvent=4, EventWeightedExcludeEarliestEvent=5, EventWeightedIncludeBothEnds=6. [S:fn-gh-piconnect-af-data] (read)
- TimeWeighted: "Weight the values in the calculation by the time over which they apply". Interpolation follows the attribute's Step setting, and interpolated boundary events are created as needed. [S:fn-piwebapi-calc-basis] (read)
- EventWeighted needs at least one event in range (two for standard deviation). A single interval includes events at both boundaries. With multiple intervals, ascending ranges include the start-time event and descending ranges include the end-time event. [S:fn-piwebapi-calc-basis] (read)
- TimeWeightedContinuous interpolates as continuous regardless of Step. TimeWeightedDiscrete treats values as a stair step regardless of Step. [S:fn-piwebapi-calc-basis] (read)
- EventWeightedExcludeMostRecentEvent drops the event at an interval's end time, so boundary events are not counted twice. ExcludeEarliestEvent drops the start-time event. IncludeBothEnds keeps both. [S:fn-piwebapi-calc-basis] (read)
- `AFBoundaryType`: Inside=0, Outside=1, Interpolated=2. [S:fn-gh-piconnect-af-data] (read)
- Inside returns recorded values inside the range as first/last values. Outside returns the recorded values just outside. Interpolated creates interpolated end-point values when no recorded value exists there, and is "not supported for sync times". [S:fn-piwebapi-boundary-type] (read)
- `AFRetrievalMode`: Auto=0, AtOrBefore=1, AtOrAfter=2, Exact=4, Before=6, After=7. [S:fn-gh-piconnect-af-data] (read)
- `AFTimestampCalculation`: Auto=0, EarliestTime=1, MostRecentTime=2. `AFSampleType`: ExpressionRecordedValues=0, Interval=1. [S:fn-gh-piconnect-af-data] (read)
- `AFUpdateOption`: Replace=0, NoReplace=2, ReplaceOnly=3, Insert=4, InsertNoCompression=5, Remove=6. `AFBufferOption`: DoNotBuffer=0, BufferIfPossible=1, Buffer=2. [S:fn-gh-piconnect-af-data] (read)
- AF "By Time Range" value-retrieval options in PSE are Average, Count, Delta, Maximum, Minimum, Population Standard Deviation, Standard Deviation, Start Time, End Time and Total. [S:fn-calc-asset-analytics-2022] (read)

**Terms**
- Calculation basis: how a summary weights values (time vs event, and boundary handling) [S:fn-piwebapi-calc-basis]
- Boundary type: how recorded-value retrieval treats range end points (Inside, Outside, Interpolated) [S:fn-piwebapi-boundary-type]
- TotalWithUOM: a Total that carries the result's unit of measure [S:fn-piwebapi-summary-type]

**Worked-example material**
- Requesting Total+Average+PercentGood as one flags value: 1 + 2 + 8192 = 8195 (inferred arithmetic from [S:fn-gh-piconnect-af-data]).

**Open questions**
- Values come from third-party typings and a 2018 SP1 reference copy. Confirm against current AF SDK docs (newer members may exist).
