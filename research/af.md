# Group `af`: PI Asset Framework, Asset Analytics, Performance Equations

## Summary (read first)

- Fact counts (approx.): ~330 sourced fact bullets. Confidence tags: ~420 `(read)` (some facts cite two sources), 0 `(snippet)` and ~7 `(inferred)` (including partial inferences noted inline). Plus clearly separated **"Unverified background (verify)"** blocks that hold training-knowledge material (function signatures, PSE tab names, SDK enums). The app must flag that material `verify`.
- Source situation: docs.aveva.com (the primary reference for every PE/AF function signature, PSE dialogs and AF SDK classes) is JavaScript-rendered and **was not readable**. The WebSearch tool in this environment returned titles only (no snippets), so no `(snippet)` facts were possible. The shared web-search budget ran out mid-task (200 searches per turn across agents), and the remaining work used pages already found.
- Readable sources were: OSIsoft/AVEVA course workbooks and PI World lab PDFs on cdn.osisoft.com and osicdn.blob.core.windows.net, PI Square (community.aveva.com) threads and blogs, and feedback.aveva.com idea pages that carry official AVEVA admin responses.
- **Biggest gaps** (all need `verify`):
  1. Exact signatures for the full PE and AF analysis function catalogue (the official alphabetical reference was unreadable). Only signatures seen in worked examples are sourced.
  2. Element-view tab names `Ports` and `Version`, and element versioning. No readable source covered them.
  3. AF SDK enum members (AFSummaryTypes, AFCalculationBasis, AFBoundaryType, AFTimestampCalculation) and AFValue/AFTime APIs.
  4. AF identities and mappings and the per-object security dialogs.
  5. The AFExport/AFImport command-line utilities.
  6. SQC analysis settings.
  7. Analysis Service configuration parameters and defaults (only "restart analyses in error every 15 minutes by default" is sourced).
  8. The Table Lookup DR's complete grammar and the full list of PI Point DR substitution parameters.

---

### af.server-databases: AF Server, PIFD SQL database, AF databases, PI AF Application Service

**Facts**
- AF stores its configuration in Microsoft SQL Server, and the default name of the AF SQL database is `PIFD`. [S:af-building-assets-workbook] (read)
- The SQL Server instance can be on the same machine as the AF Server or on another machine. [S:af-building-assets-workbook] (read)
- In production, the AF Server component is typically installed on a dedicated Windows server. [S:af-building-assets-workbook] (read)
- PI AF "supports all SQL Server editions". SQL Server Express is free but limited, and is "more suitable for small to medium-size installations". [S:af-architecture-workbook] (read)
- The architecture workbook states that SQL Express is limited to "a single physical CPU and 1 GB of RAM". [S:af-architecture-workbook] (read)
- The building-assets workbook says an AF high-availability setup needs Standard, Business Intelligence, Enterprise or Datacenter edition on the primary SQL member, not Express. [S:af-building-assets-workbook] (read)
- PI AF server is no longer a required prerequisite for installing PI Data Archive. [S:af-architecture-workbook] (read)
- PI AF files (.exe, .dll, SQL scripts) install under `%PIHOME64%\PIPC\AF`. [S:af-architecture-workbook] (read)
- The installer runs the AF SQL database scripts when that option is kept checked. [S:af-architecture-workbook] (read)
- The PI AF Application Service can run under a gMSA. The lab example uses `PISCHOOL\SVC-PIAF$`, and PI Analysis Service runs as `PISCHOOL\SVC-PIANALYT$`. [S:af-architecture-workbook] (read)
- The gMSA-capable services in the PI Server installer are PI AF Server, PI Analysis Service, PI Notifications Service and PI SQL DAS (RTQP). [S:af-architecture-workbook] (read)
- AVEVA recommends Windows authentication for connecting to the PI AF SQL database. [S:af-architecture-workbook] (read)
- Install PI AF Server and PI Data Archive on separate computers when AF uses data from several PI Servers or when AF is highly available. [S:af-architecture-workbook] (read)
- The PIFD `AFSystemID` table holds exactly one row, which records the AF SQL schema version, the data store name and its ID. [S:af-pisquare-orphaned-pifd] (read)
- Several AF Application Service instances can connect to the same PIFD SQL database, and some customers use this for load balancing. [S:af-pisquare-orphaned-pifd] (read)
- The AF Application Service's SQL connection string is the `connectString` key in the `<appSettings>` section of `AFService.exe.config`. [S:af-pisquare-orphaned-pifd] (read)
- The "PI AF Services" setup kit was first released in 2016 R2. It bundles PI AF Server, PI Analysis Service and PI Notifications Service. [S:af-pisquare-af-services-2017] (read)
- From 2017 R2, separate Add/Remove Programs entries for PI Analysis Service and PI Notifications Service no longer appear. Only "PI AF Services" is listed. [S:af-pisquare-af-services-2017] (read)
- An AVEVA product manager gave the PI AF Server version in the 2017 R2 release as 2.9.5.8368 and said the setup-kit name/version has no relationship to component versions. [S:af-pisquare-af-services-2017] (read)
- The AF SQL scripts are available separately under "Additional Resources" on the AF download page. [S:af-pisquare-af-services-2017] (read)
- AF references work only within one AF database. Elements and values cannot be compared across databases. [S:af-building-assets-workbook] (read)
- The built-in `Configuration` database holds PI System software configuration, and the workbook says "Do not use this database to organize your assets." [S:af-building-assets-workbook] (read)
- The units-of-measure database is a single repository "shared by all AF Databases" on an AF server. [S:af-building-assets-workbook] (read)
- UOMs, Contacts, Plugins and Libraries are shared across all AF databases on one AF server, per an AF team developer. [S:af-pisquare-uom-db-scope] (read)
- The AF SDK calls the AF Server a `PISystem` and the Data Archive a `PIServer`, keeping older product names for backward compatibility. [S:af-intro-dev-tech-2020] (read)
- A third-party integration guide states that TCP 5450 is needed for PI Data Archive traffic and port 5457 must be open from the AF server to AF clients. [S:af-sartorius-simapi-guide] (read)
- The "Configuring Analytics with PI AF" course requires port 5463 open for PI Analysis Service. [S:af-learning-configuring-analytics-course] (read)

**Terms**
- PIFD: the default name of the SQL Server database that stores an AF server's configuration [S:af-building-assets-workbook]
- PI AF Application Service: the Windows service (AFService) that AF clients connect to, and that reads and writes the PIFD SQL database [S:af-pisquare-orphaned-pifd]
- AF database: a container in an AF server for elements, templates, event frames and library objects; references cannot cross databases [S:af-building-assets-workbook]
- PI AF Services setup kit: the 2016 R2+ installer bundling AF Server, Analysis Service and Notifications Service [S:af-pisquare-af-services-2017]

**Worked-example material**
- Example database names used in OSIsoft labs: `AF Startup`, `Velocity Terminals`, `Demo`, `PI Big Tires Co.` [S:af-building-assets-workbook]; sample import file `AF Database - Green Power Company.xml` [S:af-github-afsdk-getting-started].
- Lab service accounts: `PISCHOOL\SVC-PIAF$` (AF), `PISCHOOL\SVC-PIANALYT$` (Analysis). [S:af-architecture-workbook]

**Common mistakes / pitfalls**
- Using the `Configuration` database to build asset models. [S:af-building-assets-workbook]
- Expecting UOM changes made for one AF database to stay local. They affect every database on the server. [S:af-pisquare-uom-db-scope]
- Looking for separate Analysis/Notifications entries in Programs and Features after 2017 R2. [S:af-pisquare-af-services-2017]

**Open questions**
- Official AF Server port list (5457 for AF Server; 5459 is commonly cited for the AF SDK/PI Web API connection). Only 5457 is stated, and only by a third-party guide. Verify.
- Supported SQL Server versions per AF release. Not read.

---

### af.elements-templates: Elements, element templates, references

**Facts**
- Elements are the basic building blocks of AF. An element itself "has no Data Reference and does not have a value". [S:af-building-assets-workbook] (read)
- An element name must be unique along its path, so two elements named "Transformer" cannot be under the same parent. [S:af-building-assets-workbook] (read)
- Element names cannot contain control characters or several symbols, including semicolon, question mark, backtick, double quote, backslash, pipe, braces and square brackets. [S:af-building-assets-workbook] (read)
- An element can be created with `<None>` as its template or from an element template. [S:af-building-assets-workbook] (read)
- "Convert to Template" creates a template from an element without deleting or changing the element, and sets the element to the new template. [S:af-building-assets-workbook] (read)
- Element templates live under Library > Templates > Element Templates. [S:af-building-assets-workbook] (read)
- When a template's default values, attribute definitions or structure change, elements created from that template are updated automatically. [S:af-building-assets-workbook] (read)
- Attribute-level overrides on an element survive template changes, and "Reset to Template" removes them. [S:af-building-assets-workbook] (read)
- A checkbox on the template's General tab allows extra element-level attributes, so elements of that template are then not guaranteed identical attributes. [S:af-building-assets-workbook] (read)
- Element reference types: Composition (deleting the parent deletes the child), Parent-Child (the default, where a child can have several parents) and Weak (the reference goes away with its last strong parent). [S:af-building-assets-workbook] (read)
- In PSE, dragging an element with Shift moves it, Ctrl copies it, and no modifier key creates an element reference. [S:af-building-assets-workbook] (read)
- PI Builder (Excel add-in) can publish elements in bulk, for example with Edit Mode "Create Only". [S:af-building-assets-workbook] (read)
- Element template tabs seen in a lab: Attribute Templates, Analysis Templates, plus an Analyses tab on the template. [S:af-using-af-analyze-asset-2019] (read)
- Event frame templates can be derived from base templates to build a template hierarchy, which helps searching and standardisation. [S:af-murdock-event-frames-2019] (read)
- AF 2018 SP2 added a "base template only" setting that prevents a template from being used to create elements (PSE item 215688, PI Builder item 215692). [S:af-pisquare-af2018sp2-highlights] (read)
- AF 2018 SP2 added a right-click option that permanently deletes items without a separate check-in. [S:af-pisquare-af2018sp2-highlights] (read)
- When an element with PI Point attributes is converted to a template, the Substituted column defaults to `%Element%.%Attribute%.%ID%` even if the tag name doesn't follow that pattern. AVEVA declined to change this. [S:af-feedback-pida-174] (read)
- The AF SDK `AFElementTemplate` "represents a template of information used to create an AFBaseElement", and `FindInstantiatedElements` returns the elements built from a template. [S:af-afsdk-pm-best-practices-2020] (read)

**Terms**
- Element: an AF object representing a physical or logical asset, holding attributes but no value of its own [S:af-building-assets-workbook]
- Element template: a Library definition of attributes, analyses and other content shared by all elements created from it [S:af-building-assets-workbook]
- Composition reference: an element reference where deleting the parent deletes the child [S:af-building-assets-workbook]
- Weak reference: an element reference that disappears when the child's last strong parent reference is removed [S:af-building-assets-workbook]
- Derived template: a template based on another template, inheriting its attributes [S:af-murdock-event-frames-2019]

**Worked-example material**
- Wind farm model: templates `Turbine`, `Farm`, `Region`. Rollups on Farm sum child Turbine `Expected Power (Polynomial)`. [S:af-using-af-analyze-asset-2019]
- Tank model: element `Tank02` with PI Point attribute substitution `%Element%LI.PV`, which resolves to `Tank02LI.PV`. [S:af-building-assets-workbook]

**Common mistakes / pitfalls**
- Allowing extensions on a template means not all elements share the same attributes, which breaks template-wide analyses and displays. [S:af-building-assets-workbook] (inferred)
- Overriding attribute values on elements, then being surprised when template changes don't flow through. Use Reset to Template. [S:af-building-assets-workbook]

**Open questions / Unverified background (verify)**
- Element view tabs in PSE (training knowledge, not read): **General, Child Elements, Attributes, Ports, Analyses, Notification Rules, Version**. The building-assets workbook confirms only General (with rename and Parents link), Attributes and Child Elements. Ports (for transfer/connection modelling) and Version (element versioning by effective date) are unverified.
- Whether element versioning (AFElement versions with effective dates) is still exposed in current PSE. Unverified.

---

### af.attributes: Attribute templates, value types, traits, configuration items, child attributes

**Facts**
- Value Type guidance from the workbook: Double for most numeric values, String for text, and Boolean for 0/1 (False/True). [S:af-building-assets-workbook] (read)
- Display Digits: zero or a positive number sets decimal places, and a negative number sets significant digits. For 23.45: 3 gives 23.450, 1 gives 23.5, -1 gives 2E+001, and -5 (the default) gives 23.45. [S:af-building-assets-workbook] (read)
- The workbook instructs "Always assign a unit of measurement! Do not leave this undefined." for the Default UOM. [S:af-building-assets-workbook] (read)
- The Configuration Item property marks an attribute as configuration. The lab example uses a `Product` attribute template with default `HC1500`. [S:af-building-assets-workbook] (read)
- An attribute's Read Only flag can be removed on an element attribute. [S:af-building-assets-workbook] (read)
- Attribute traits are child attributes, and the trait types listed are Limit, Forecast, Location, Reason, Analysis start-trigger and Health. [S:af-building-assets-workbook] (read)
- The Limit traits are Minimum, Maximum, LoLo, HiHi, Lo, Hi and Target. [S:af-building-assets-workbook] (read)
- Limits are configured from the attribute's context menu entry "Limits…". [S:af-building-assets-workbook] (read)
- A lab child attribute `Efficiency Target` under `Production Efficiency` uses Default UOM Percent, Value Type Int16 and Default Value 85. [S:af-using-af-analyze-asset-2019] (read)
- Child attributes can be referenced in analyses with the pipe syntax, for example `'Production Efficiency|Efficiency Target'` and `'Polynomial Coefficients|C0'`. [S:af-using-af-analyze-asset-2019] (read)
- AF Search fields added in AF SDK 2.10 (AF 2018) include ConfigString, DisplayDigits, IsManualDataEntry, Trait, UOM, UOMID, UOMAbbr, SecurityString and SecurityToken. [S:af-afsearch-2018-deck] (read)
- Indexing an attribute improves event frame search performance with stored attribute values. Index the attributes users are likely to search frequently. [S:af-murdock-event-frames-2019] (read)
- AF 2018 SP2 prompts you to import the needed digital state set when you map a digital tag to a PI Point attribute, and can bulk-import digital state sets from a Data Archive. [S:af-pisquare-af2018sp2-highlights] (read)
- An attribute without a data reference (`<None>`) holds a static value. [S:af-building-assets-workbook] (read)

**Terms**
- Attribute template: the definition of an attribute (name, value type, default UOM, data reference) inside an element or event frame template [S:af-building-assets-workbook]
- Trait: a special child attribute with a defined role such as a limit (Hi, Lo, Target), forecast, location, reason or health [S:af-building-assets-workbook]
- Configuration item: an attribute flagged as configuration (static setup) data rather than process data [S:af-building-assets-workbook]
- Display Digits: the attribute property that controls decimal places (positive) or significant digits (negative) [S:af-building-assets-workbook]

**Worked-example material**
- Display Digits table for value 23.45: `3 → 23.450`, `1 → 23.5`, `-1 → 2E+001`, `-5 (default) → 23.45`. [S:af-building-assets-workbook]
- Limits on a pump-speed attribute drive event-frame severities: Minor above Hi, Major above HiHi, Critical above Maximum. [S:af-murdock-event-frames-2019]

**Common mistakes / pitfalls**
- Leaving Default UOM undefined, which disables UOM conversion. [S:af-building-assets-workbook]

**Open questions / Unverified background (verify)**
- Full value-type list (Boolean, Byte, Int16, Int32, Int64, Single, Double, String, DateTime, GUID, enumeration sets, arrays) and the Hidden, Excluded and Indexed property semantics. Not read.
- Whether "Excluded" hides attributes from clients and skips data retrieval. Training knowledge only.

---

### af.data-references: PI Point, Formula, Table Lookup, String Builder, URI Builder, Analysis

**Facts**
- Built-in data reference types listed in the workbook are PI Point, PI Point Array, Formula, Table Lookup, String Builder and URI Builder. `<None>` means a static value. [S:af-building-assets-workbook] (read)
- PI Point DR settings include Data Server (for example `PISRV01`), Tag (for example `TANK01LI.PV`) and Source Units. A lab maps a tag in PSI to an attribute whose default UOM is bar. [S:af-building-assets-workbook] (read)
- The default PI Point naming rule for created tags is `%Element%.%Attribute%.%ID%`. [S:af-building-assets-workbook] (read)
- PI Point substitution example: tag pattern `%Element%LI.PV` on element `Tank02` resolves to `Tank02LI.PV`. [S:af-building-assets-workbook] (read)
- Substitution parameters in elements with Parent-Child references resolve according to the hierarchy path the element is accessed through. [S:af-building-assets-workbook] (read)
- `%@AttributeName%` substitutes the value of another attribute. `%@|Transformer ID%` refers to an attribute on the containing element, and `%@..\Site ID%` refers to an attribute on the parent element. [S:af-pisquare-substitution-strings] (read)
- In relative attribute paths, `..\` moves up to the parent element and `.|` moves down to an attribute. Without `.|`, the parser treats the name as a child element. [S:af-pisquare-substitution-strings] (read)
- `%@..\|..\|Transformer ID%` was the tested form for an attribute two levels up the attribute hierarchy. [S:af-pisquare-substitution-strings] (read)
- Substitution examples used to build tag names from attributes include `%Server%`, `%@|Site%`, `%@|Unit%` and `%@.|Tagname%`. [S:af-pisquare-tlookup-10000] (read)
- A ConfigString pattern cited for PI Point DRs is `\\%Server%\%Attribute%;UOM=uom`. [S:af-feedback-pida-174] (read)
- The Analysis Service's suggested PI Point name in one lab was `%Database%_%Element%.%Attribute%`, with point source `AFAnalysis`. [S:af-using-af-analyze-asset-2019] (read)
- Right-click the Elements root and choose "Create or Update Data Reference" to create the PI tags. Attributes should then show "Pt Created". [S:af-analyzing-pi-data-2018] (read)
- `AFDataReference.CreateConfig(instantiatedElements, false, null)` is the AF SDK call to create or update PI Point DR configurations in bulk. [S:af-afsdk-pm-best-practices-2020] (read)
- AF 2018 SP2 lets the default Data Archive be set at AF Server or AF database level, instead of relying only on the client-selected `%Server%` default. [S:af-pisquare-af2018sp2-highlights] (read)
- PI Point DR "By Time Range" retrieval options include "Average (time-weighted)". [S:af-calc-asset-analytics-2022] (read)
- Formula DR parameters are letters bound to attributes with UOMs (for example `D` = Density in kg/L, `V` = Volume in L), with an equation such as `D * V` and a separately set result UOM. The Functions dropdown offers `pi()`. [S:af-building-assets-workbook] (read)
- Formula data references are "not time-weighted". [S:af-calc-asset-analytics-2022] (read)
- A Formula DR attribute used as an analysis input is computed on demand and can cause performance problems. [S:af-feedback-pida-825] (read)
- The Table Lookup DR is configured with a Table, a Result Column and a Where clause, for example `MaterialID = @Product`, where `@` references an attribute value. [S:af-building-assets-workbook] (read)
- Table Lookup Where-builder example: Column `Wind Speed`, Operator `INTERPOLATE`, Attribute or Value `@Adjusted Wind Speed`. "Add And" appends the condition, and the result appears in the "Complete WHERE Clause" box. [S:af-using-af-analyze-asset-2019] (read)
- A Table Lookup ConfigString takes the form `SELECT ColumnName2 FROM Table1 WHERE ColumnName1 = 2 ORDER BY ColumnName2`. [S:af-pisquare-tlookup-timezones] (read)
- Appending `;RWM=<value>` to a Table Lookup ConfigString sets a replacement value used when the query returns no rows, for example `;RWM=%Time%` or `;RWM=@Attribute2`. [S:af-pisquare-tlookup-timezones] (read)
- A Table Lookup example with relative attribute references is `SELECT NetGen FROM GenInfo WHERE SiteName = @[..\..\|SiteAbbr] AND UnitAbbr = @[..\|UnitAbbr];RWN=No Data`. [S:af-pisquare-tlookup-ef] (read)
- `@[..\.|CompletionID]` references an attribute on the parent element inside a Table Lookup WHERE clause. [S:af-pisquare-substitution-strings] (read)
- Table Lookup DRs do not support the same relative syntax as event frame attributes. A workaround is a String Builder attribute holding the relative path, referenced from the lookup. [S:af-pisquare-tlookup-ef] (read)
- In AF 2.5+, the Table Lookup option "Table provided time series data", with a Timestamp column chosen as the time column, makes each returned value carry its row's timestamp. [S:af-pisquare-linked-table-timestamp] (read)
- SQL functions such as `DATEDIFF`/`GETDATE` were reported undefined inside Table Lookup settings on AF 2.4. [S:af-pisquare-linked-table-timestamp] (read)
- String Builder DR: "Add New String", then insert substitution parameters such as `%Element%`. [S:af-building-assets-workbook] (read)
- AF 2018 SP2 added `NewLine()` to String Builder for multi-line strings. [S:af-pisquare-af2018sp2-highlights] (read)
- An Analysis Data Reference is computed only when a client requests the attribute's data. [S:af-calc-asset-analytics-2022] (read)
- When an Analysis DR output was trended in ProcessBook, it evaluated at every input event and ignored the analysis's periodic schedule. AVEVA staff called this a known backlog issue, and the recommended fix is a PI Point output. [S:af-pisquare-analysis-dr-plotting] (read)
- Event frame attribute PI Point DR syntax for capturing a value from the referenced element is `.\Elements[.]|%Attribute%;TimeRangeMethod=StartTime`. [S:af-analyzing-pi-data-2018] (read)
- Event frame aggregation attribute examples: `.\Elements[.]|Outlet Temperature;TimeRangeMethod=Average` and `...;TimeRangeMethod=Maximum`. [S:af-data-exploration-notification-2020] (read)
- Event frame attribute time range retrieval methods listed are Time Range, Time Range Override and Not Supported. [S:af-analyzing-pi-data-2018] (read)
- AF conversion between units happens between a PI Point and an AF attribute, or between two AF attributes, provided both units are in the same UOM class. [S:af-pisquare-uom-conversion-analytics] (read)

**Terms**
- Data reference (DR): a plug-in that supplies an attribute's value from an external source (PI Point, formula, table, string, URI or analysis) [S:af-building-assets-workbook]
- Substitution parameter: a `%...%` token in a DR config string that is replaced at run time, such as `%Element%`, `%Attribute%`, `%Server%`, `%ID%` or `%@Attr%` [S:af-building-assets-workbook]
- Table Lookup DR: a DR that returns a value from an AF table using a SQL-like SELECT/WHERE query, which can reference attribute values with `@` [S:af-pisquare-tlookup-timezones]
- String Builder DR: a DR that concatenates literal text and substitution parameters into a string [S:af-building-assets-workbook]
- Analysis Data Reference: an output attribute computed on demand by the client, not stored [S:af-calc-asset-analytics-2022]
- RWM: the Table Lookup ConfigString option giving the replacement value used when no row matches [S:af-pisquare-tlookup-timezones]

**Worked-example material**
- PI Point DR: `\\%Server%\%Element%.%Attribute%.%ID%` (default naming rule `%Element%.%Attribute%.%ID%`). [S:af-building-assets-workbook]
- Table Lookup: `SELECT NetGen FROM GenInfo WHERE SiteName = @[..\..\|SiteAbbr] AND UnitAbbr = @[..\|UnitAbbr]`. [S:af-pisquare-tlookup-ef]
- Table Lookup with interpolation: table `PowerCurve`, WHERE `[Wind Speed] INTERPOLATE @Adjusted Wind Speed`, result attribute `Expected Power (Tabular)` in kW. [S:af-using-af-analyze-asset-2019] (exact SQL text of the INTERPOLATE clause not read)
- Event frame attribute: `.\Elements[.]|Outlet Temperature;TimeRangeMethod=Average`. [S:af-data-exploration-notification-2020]

**Common mistakes / pitfalls**
- Using relative paths (`..\..\`) that break when hierarchy depth differs between sites. [S:af-pisquare-substitution-strings]
- Table Lookup returning a 1/1/1970 timestamp because "Table provided time series data" wasn't enabled. [S:af-pisquare-linked-table-timestamp]
- Table Lookup timezone shift: a replacement value read from a DateTime attribute came back 7 hours ahead (logged as WI 166420). [S:af-pisquare-tlookup-timezones]
- Feeding Formula DR attributes into analyses, which adds on-demand computation cost. [S:af-feedback-pida-825]
- Trending an Analysis DR and expecting the periodic schedule to apply. [S:af-pisquare-analysis-dr-plotting]

**Open questions / Unverified background (verify)**
- Full substitution parameter list (training knowledge): `%Element%`, `%..\Element%`, `%Attribute%`, `%..|Attribute%`, `%Database%`, `%Server%`, `%System%`, `%ElementId%`, `%ID%`, `%Template%`, `%Description%`, `%@attr%`, time tokens like `%Time%`/`%StartTime%`/`%UTCEndTime:O%`. Only `%Element%`, `%Attribute%`, `%ID%`, `%Server%`, `%Database%`, `%@...%`, `%Time%`, `%EndTime%`, `%UTCEndTime:O%` and `%TEMPLATE%`/`%STARTTIME:fmt%` (naming patterns) are sourced.
- Whether `%..\Element%` resolves to the parent element name (strongly implied by the naming pattern `%..\ELEMENT%` in [S:af-analyzing-pi-data-2018]). Mark inferred.
- PI Point DR options such as "Read-only", "Value Retrieval Methods" (Automatic, At or Before, Interpolated, ...) and the ConfigString keys (`UOM=`, `TimeRangeMethod=`, `RelativeTime=`...). Only `TimeRangeMethod=` and `UOM=` are sourced.
- URI Builder DR. Listed but not described in any readable source.
- Table Lookup grammar details (`INTERPOLATE`, `ORDER BY`, `TT` time column, `RWN`). `RWN=No Data` appears only in one thread, and its meaning (replacement when no rows?) needs confirming. `RWM` vs `RWN` is unresolved.

---

### af.categories-enums: Categories and enumeration sets

**Facts**
- Categories appear in the Library, and rollup inputs can be filtered by Attribute Category or Element Category masks. [S:af-analyzing-pi-data-2018] (read)
- Suggested analysis categories in a lab are "Calculated Data" and "Aggregation". [S:af-using-af-analyze-asset-2019] (read)
- An enumeration set is "an ordinal list of sequential integer values, which are mapped to names". [S:af-building-assets-workbook] (read)
- Enumeration set example: `0 AQ4500`, `1 HC1500`, `2 WX1200`. [S:af-building-assets-workbook] (read)
- Hierarchical enumeration values use `|`, as in `WX1200|Old Recipe` (3) and `WX1200|New Recipe` (4). Hierarchical enumeration sets were added in AF 2017 R2. [S:af-building-assets-workbook] (read)
- Reason codes let operators pick from a multi-tiered enumeration set when annotating event frames. [S:af-murdock-event-frames-2019] (read)
- AFSearch supports `Category:` filters on elements and attributes. In nested queries, the filter inside braces applies to the element and the one outside applies to the attribute. [S:af-pisquare-afsearch-2017r2-blog] (read)
- The SimApi integration filters elements by a semicolon-separated list of Element Categories. [S:af-sartorius-simapi-guide] (read)

**Terms**
- Category: a Library label applied to elements, attributes, analyses, event frames or tables for grouping and searching [S:af-analyzing-pi-data-2018]
- Enumeration set: an AF Library list mapping integer values to names, usable as an attribute value type [S:af-building-assets-workbook]

**Worked-example material**
- `Element:{Template:'FCC Pump Process' Category:'ProcessMonitoring'} Category:'Process Monitoring'` (attributes in category "Process Monitoring" on elements of a template and category). [S:af-pisquare-afsearch-2017r2-blog]

**Open questions**
- Category types (element, attribute, analysis, notification rule, table, reference type) and whether Library categories are per-database. Verify.

---

### af.tables-uom: AF tables, linked tables, UOM database

**Facts**
- AF tables can be internal, imported or linked. [S:af-building-assets-workbook] (read)
- Example table "Material Properties" has columns MaterialID (String) and Density (Double, kg/m3). [S:af-building-assets-workbook] (read)
- Best practice is to keep an AF table under 10,000 rows. [S:af-pisquare-tlookup-10000] (read)
- Since PI 2014, the 10K-row guideline no longer applies to external (linked) tables, because a parameterised query is resolved on the server. [S:af-pisquare-tlookup-10000] (read)
- Internal tables are loaded into each client's memory. [S:af-pisquare-tlookup-10000] (read)
- Time-zone handling for table data is configured on the table (PSE > Library > Tables). [S:af-pisquare-tlookup-timezones] (read)
- The PI World 2020 tips deck recommends reducing table size with parameterised queries. [S:af-tips-managing-analytics-2020] (read)
- UOMs belong to UOM classes (for example Volume, Density, Ratio) and UOM groups (Metric, US Customary). [S:af-building-assets-workbook] (read)
- Custom UOMs can be added, for example "ratio" and "decimeter" (0.1 m). [S:af-building-assets-workbook] (read)
- The Display UOM Group is set in PSE under Tools > Options. [S:af-building-assets-workbook] (read)
- AF converts UOMs only when both units are in the same UOM class. [S:af-pisquare-tagtot-units] (read)
- AF treats UOMs and their abbreviations case-insensitively. [S:af-pisquare-uom-db-scope] (read)
- UOM uniqueness is enforced across the whole UOM database, not per class. [S:af-pisquare-uom-db-scope] (read)
- Exporting an AF database with "All Referenced Objects" includes the UOM database. [S:af-pisquare-uom-db-scope] (read)
- The PSE Navigator includes a "Unit of Measure" section. [S:af-building-assets-workbook] (read)

**Terms**
- Linked table: an AF table whose rows come from an external database through a connection, and which can be queried with parameters on the server [S:af-pisquare-tlookup-10000]
- UOM class: a family of convertible units (such as Volume) [S:af-building-assets-workbook]
- UOM group: a display preference set (Metric, US Customary) used to pick display units [S:af-building-assets-workbook]

**Worked-example material**
- Custom UOM `decimeter` = 0.1 m in class Length. [S:af-building-assets-workbook]
- PI Point in PSI shown in an attribute whose default UOM is bar (Source Units = psi). [S:af-building-assets-workbook]

**Common mistakes / pitfalls**
- Defining UOMs whose abbreviations differ only by case (for example `MW` vs `mW`). [S:af-pisquare-uom-db-scope] (inferred)
- Expecting conversion across classes (power → energy). [S:af-pisquare-tagtot-units]

**Open questions**
- Canonical UOM per class and the conversion formula format (factor/offset or custom formula). Not read.
- Linked table connection types (OLE DB / ODBC) and the cache/refresh interval. Not read.

---

### af.event-frames: Event frames, templates, triggers, severity, acknowledgement, reason codes

**Facts**
- An event frame is defined by a name, a start time and end time, and context. [S:af-analyzing-pi-data-2018] (read)
- Event frame templates in AF define event types and the data captured in each event. [S:af-analyzing-pi-data-2018] (read)
- The 2019 deck describes event frames as "Bookmarks for time-series data". [S:af-murdock-event-frames-2019] (read)
- Event frames can be created by Batch Framework interfaces, Asset Analytics or AF SDK, and the deck also mentions PI EFGen. [S:af-murdock-event-frames-2019] (read)
- An Event Frame Generation analysis is configured with an Event Frame Template, start/end triggers, additional variables and "Outputs at close". [S:af-murdock-event-frames-2019] (read)
- Event Frame Generation has an optional root-cause window (default five minutes before the event start), recorded as a child event frame. [S:af-analyzing-pi-data-2018] (read)
- Event Frame Generation supports a minimum "time true" period before an event frame is generated. [S:af-analyzing-pi-data-2018] (read)
- An Event Frame Generation analysis can define several start triggers, one per severity level. The deck's example: Minor above Hi, Major above HiHi, Critical above Maximum. [S:af-murdock-event-frames-2019] (read)
- With multiple-severity configuration, Asset Analytics creates "only direct children", and a single start trigger must be true. [S:af-murdock-event-frames-2019] (read)
- A lab Event Frame Generation analysis used Generation Mode `Variable`. [S:af-using-af-analyze-asset-2019] (read)
- Event frame naming pattern example: `OSIDemo_%TEMPLATE% - %ELEMENT% - %STARTTIME:yyyy-MM-dd HH:mm:ss%`. [S:af-using-af-analyze-asset-2019] (read)
- Another naming pattern example: `%..\ELEMENT% %ELEMENT% %TEMPLATE% %STARTTIME:yyyyMM-dd HH:mm:ss%`. [S:af-analyzing-pi-data-2018] (read)
- The naming pattern is set on the event frame template's General tab. [S:af-data-exploration-notification-2020] (read)
- `EventFrame("StartTime")`, `EventFrame("EndTime")` and `EventFrame("Duration")` can be used in Event Frame Generation outputs. An example is `TagTot('Regenerant Vapor Flow', EventFrame("StartTime"), EventFrame("EndTime"))`. [S:af-data-exploration-notification-2020] (read)
- Each "Output at Close" expression must be mapped to an event frame attribute, and the mapping order is not the same as the expression order. [S:af-data-exploration-notification-2020] (read)
- Calculation results can be captured when the event frame closes and stored as an event frame attribute or a PI tag. [S:af-murdock-event-frames-2019] (read)
- Event frame search parameters include search type, start/end, "Include descendants", event frame name (wildcards allowed), element name, template and extra criteria. [S:af-analyzing-pi-data-2018] (read)
- In PI Vision's Events pane, the colour to the left of each event shows its severity. [S:af-analyzing-pi-data-2018] (read)
- Operators can write reason codes back to event frames after the fact, choosing from a multi-tiered enumeration set. [S:af-murdock-event-frames-2019] (read)
- Event frame search performance benefits from indexed attributes, and the 2019 release improved simple queries (time range + 1 attribute). [S:af-murdock-event-frames-2019] (read)
- Bulk event frame deletion uses the AFDiag command-line utility. [S:af-murdock-event-frames-2019] (read)
- Requiring a reason code, comment or e-signature before acknowledgement is an open idea (no status), so it is not a product feature. [S:af-feedback-pida-649] (read)
- Active (open) event frames have a start time but no end time. [S:af-sartorius-simapi-guide] (read)
- The AF SDK search for event frames uses `AFEventFrameSearch` with a search mode such as `AFSearchMode.Overlapped` and a query like `Element:<path> Template:<path> '|Tank Level':>=75`. [S:af-pisquare-afeventframesearch-blog] (read)
- A lab Event Frame Generation start trigger is `Efficiency < Target AND 'Status' <> "Stop"`, where `Efficiency` and `Target` are variables (no quotes) and `'Status'` is an attribute. [S:af-using-af-analyze-asset-2019] (read)
- Another lab start trigger is `'Best Operating State'="Regenerating"`. The frame ends when the state stops being "Regenerating". [S:af-data-exploration-notification-2020] (read)
- The "Enable analysis when creating from template" checkbox controls whether analyses created from a template start enabled. [S:af-data-exploration-notification-2020] (read)
- AF 2017 R2 or later is required for event frame output analyses and dynamic notification endpoints. [S:af-learning-configuring-analytics-course] (read)

**Terms**
- Event frame: an AF object marking a time range of interest (with name, start, end and context) [S:af-analyzing-pi-data-2018]
- Event frame template: Library definition of an event type's attributes and naming pattern [S:af-analyzing-pi-data-2018]
- Naming pattern: an event frame template string with tokens like `%ELEMENT%`, `%TEMPLATE%`, `%STARTTIME:format%` used to name new event frames [S:af-using-af-analyze-asset-2019]
- Start trigger: the Boolean expression whose transition to true opens an event frame [S:af-data-exploration-notification-2020]
- Root cause event frame: a child event frame covering a fixed window (default 5 min) before the start [S:af-analyzing-pi-data-2018]
- Time true: the minimum duration a start trigger must stay true before the frame is created [S:af-analyzing-pi-data-2018]
- Reason code: an enumeration-based annotation explaining an event [S:af-murdock-event-frames-2019]
- Severity: the classification of an event frame (Minor, Major, Critical and others) shown by colour in clients [S:af-murdock-event-frames-2019]

**Worked-example material**
- Naming pattern: `OSIDemo_%TEMPLATE% - %ELEMENT% - %STARTTIME:yyyy-MM-dd HH:mm:ss%`. [S:af-using-af-analyze-asset-2019]
- Output at close: `TimeEq('Best Operating State', PreviousDryingEvent,'*',"Drying") /3600`. [S:af-data-exploration-notification-2020]
- Variable: `PreviousRegenEvent = FindEq('Best Operating State','*','-7d', "Regenerating")`. [S:af-data-exploration-notification-2020]

**Common mistakes / pitfalls**
- Mapping outputs-at-close assuming they line up with the attribute order. [S:af-data-exploration-notification-2020]
- Capturing every attribute ("Capture meaningful data – not all data"). [S:af-murdock-event-frames-2019]

**Open questions / Unverified background (verify)**
- Full AFSeverity enumeration (training knowledge: None, Information, Warning, Minor, Major, Critical) [S:af-docs-afsdk-afseverity] (page unreadable).
- Acknowledgement mechanics: `AFEventFrame.Acknowledge()`, AcknowledgedBy/AcknowledgedDate, and "can be acknowledged" template setting [S:af-docs-afsdk-ef-acknowledge] (page unreadable).
- Exact end-trigger behaviour when no explicit end trigger is defined (sourced lab only says it ends when the start condition is false).
- Event frame "Capture values" (freezing attribute values on close) as a separate setting. Not read.

---

### af.notifications: Notification rules, delivery channels, contacts, subscriptions

**Facts**
- Legacy PI Notifications 1.0 (January 2008) was built on AF 2.0, with a plug-in infrastructure for Analysis Rules, Time Rules and Delivery Channels. [S:af-notifications-2009-deck] (read)
- PI Notifications 1.1 (Q2 2009) added Notification Templates, bulk copy of subscriber configuration, and delivery endpoints linked to Active Directory contacts. [S:af-notifications-2009-deck] (read)
- Legacy delivery channels listed in 2009 were Pager, Phone, Email, Web Services, BizTalk, SAP and custom delivery channels. [S:af-notifications-2009-deck] (read)
- AF 2016 R2 introduced the new notifications (notification rules), and an AF Server 2.8.5 (2016 R2) server no longer supports legacy 2012 notifications. [S:af-pisquare-notif-service-not-running] (read)
- Legacy notifications are migrated with the "PI Notifications Migration Tool" in `%pihome%\Notifications`. Some legacy features are not supported by notification rules and must be changed or left unmigrated. [S:af-pisquare-notif-migration] (read)
- The PI Notifications Migration tool is needed only if PI Notifications 2012 was in use. [S:af-pisquare-notif-service-not-running] (read)
- PI Server 2016 R2+ notification rules support only Email and Web Service delivery channels, and "custom delivery endpoints are not supported". [S:af-pisquare-notif-sms] (read)
- AVEVA declined to provide a migration path for custom delivery channels from Notifications 2012 to notification rules (admin response, August 2022). [S:af-feedback-pida-994] (read)
- The web service delivery channel can push to REST or SOAP services, and AF 2017 R2 improved it with authentication against external web services. [S:af-pisquare-custom-delivery-channel] (read)
- PI Notifications Service runs as virtual account `NT SERVICE\PINotificationsService`. [S:af-pisquare-notif-service-not-running] (read)
- The Notifications log is `%programdata%\osisoft\pinotifications\logs\pinotifications-log.txt`. [S:af-pisquare-notif-service-not-running] (read)
- Notification rules are triggered by event frames. A rule can be created from an Event Frame Generation analysis via "Create a new notification rule template for <analysis>" in Analysis Details. [S:af-data-exploration-notification-2020] (read)
- Subscriptions are configured with View/Edit Subscriptions, by dragging a contact's delivery endpoint (for example E-mail) into Subscriptions, then Check In. [S:af-data-exploration-notification-2020] (read)
- Delivery formats are managed with "Manage Formats". The lab duplicates "Global Default Email", renames it, removes items (Server, Database, Severity) and adds a link with Insert Link. [S:af-data-exploration-notification-2020] (read)
- "Test Send" sends a test notification to a contact. [S:af-data-exploration-notification-2020] (read)
- Notifications can fire when an event starts, when it ends, or both. [S:af-kwan-getting-more-aa-2019] (read)
- Legacy 2012 notifications used 7 PI tags each (including `<GUID>_Action` and `<GUID>_TimeOffset`), while modern notifications "do not rely on 7 PI tags". [S:af-pisquare-notification-tags-109] (read)
- Notification rules cannot be managed in PI Builder. The DataLink Notification add-in shows status but cannot edit rules. [S:af-pisquare-pibuilder-notifications] (read)
- The AF 2016 Notifications CTP merged analysis and notification management into the same PSE plug-in experience. [S:af-pisquare-pibuilder-notifications] (read)
- AF 2018 SP2 allows importing analyses and notification rules in a disabled state. [S:af-pisquare-af2018sp2-highlights] (read)
- AF SDK 2.9.5 (AF 2017 R2) added `AFNotificationContactTemplateSearch`, for example query `Name:'Davi*'`. [S:af-pisquare-afsearch-2017r2-blog] (read)
- Recommended HA for PI Notifications Service is Windows Server Failover Clustering. [S:af-feedback-pida-185] (read)
- Dynamic notification endpoints require AF 2017 R2 or later. [S:af-learning-configuring-analytics-course] (read)

**Terms**
- Notification rule: the 2016 R2+ AF object that sends messages to subscribers when event frames matching criteria start or end [S:af-data-exploration-notification-2020]
- Delivery channel: the transport plug-in for a notification (Email or Web Service in 2016 R2+) [S:af-pisquare-notif-sms]
- Delivery endpoint: a contact's specific address on a channel (an e-mail address or a web service URL) [S:af-data-exploration-notification-2020]
- Subscription: the link between a notification rule and a contact's delivery endpoint [S:af-data-exploration-notification-2020]
- Delivery format: the template for message content (for example "Global Default Email") [S:af-data-exploration-notification-2020]
- PI Notifications Migration Tool: utility that converts 2012 legacy notifications to notification rules [S:af-pisquare-notif-migration]

**Worked-example material**
- Rule template "My Dryer Notification" (EF generation trigger `'My Dryer Regeneration Cycle Time Forecast' >= 11`), subscriber `student01@pischool.int`, custom format "My Dryer Notification Email" with a PI Vision link (`starttime=*-7d`, `endtime=*`). [S:af-data-exploration-notification-2020]

**Common mistakes / pitfalls**
- Planning SMS through a custom delivery channel. Not available after 2016 R2, so use an email-to-SMS gateway or web service. [S:af-pisquare-notif-sms]
- Upgrading AF to 2016 R2 without migrating 2012 notifications, which stops them working. [S:af-pisquare-notif-service-not-running]
- Legacy-notification tags producing `[-109] Value at This Time Already Exists` messages. Migrate to new notifications. [S:af-pisquare-notification-tags-109]

**Open questions / Unverified background (verify)**
- Notification rule tabs/fields (training knowledge): Trigger (criteria on event frame template, severity, element), "Non-repetition interval", resend interval, escalation, contact groups and escalation teams, Notify on Start/End/Acknowledge. Only start/end is sourced.
- Notification contact types (individual, group, escalation team) and the Contacts navigator section. Not read.

---
### af.analyses: Expression, Rollup, Event Frame Generation, SQC; Analysis Service; outputs

**Facts**
- The four AF analysis types are Expression, Rollup, Event Frame Generation and SQC. [S:af-calc-asset-analytics-2022] (read)
- Expression analyses use Performance Equation (PE) syntax and support multi-line calculations, where each row is a variable that later rows can use. [S:af-calc-asset-analytics-2022] (read)
- Expression analyses created on an element template are automatically applied to all elements of that template. [S:af-analyzing-pi-data-2018] (read)
- Rollup analyses aggregate attributes selected by name, category or template. The rollup functions are Sum, Average, Minimum, Maximum, Count and Median. [S:af-calc-asset-analytics-2022] (read)
- Rollup source attributes can come from child elements or the element itself, filtered by Attribute Name, Attribute Category, Element Category or Element Template masks. A child-element rollup on a template needs an example element. [S:af-analyzing-pi-data-2018] (read)
- Rollup outputs must use PI Point data references, and rollup analyses do not allow turning off output history. [S:af-calc-asset-analytics-2022] (read) [S:af-using-af-analyze-asset-2019] (read)
- SQC analyses use Statistical Quality Control methods to check attribute values against set boundaries. [S:af-calc-asset-analytics-2022] (read)
- Asset Analytics has "150+ built in functions". [S:af-tips-managing-analytics-2020] (read)
- "The Analysis Service runs all analyses of a AF Server." [S:af-calc-asset-analytics-2022] (read)
- When an output attribute is mapped to a PI Point, results are archived in the Data Archive. The default point name pattern is `%Element%.%Attribute%.%ID%`. [S:af-calc-asset-analytics-2022] (read)
- Output-mapping UI: Map > New Attribute Template, "Save Output History" (Yes) and the "Tag Creation" checkbox. [S:af-using-af-analyze-asset-2019] (read)
- Analysis Service point creation settings in a lab: Suggested PI Point Name `%Database%_%Element%.%Attribute%`, point source `AFAnalysis`. [S:af-using-af-analyze-asset-2019] (read)
- A forecast analysis writes future-timestamped values to a future PI point by enabling Tag Creation with the future flag set to 1, and using output timestamp "Relative to Trigger Time" with offset `*+1h`. [S:af-using-af-analyze-asset-2019] (read)
- The **Evaluate** button "executes the expressions against values at evaluation (i.e. now)" and shows values beside each variable. On a template, an Example Element must be chosen. [S:af-calc-asset-analytics-2022] (read) [S:af-using-af-analyze-asset-2019] (read)
- **Preview Results** (then Generate Results) runs the expression against archived values and shows a trend or table of results. [S:af-calc-asset-analytics-2022] (read) [S:af-using-af-analyze-asset-2019] (read)
- Evaluate and Preview run on the client with the user's account and compressed archive data, while the Analysis Service uses its service account and snapshot data, so results can differ. [S:af-calc-asset-analytics-2022] (read)
- Test before Check In, because check-in starts the analysis on every element of the template. [S:af-using-af-analyze-asset-2019] (read)
- Analysis editor controls seen in labs: Evaluate, Preview Results, Export Results, Enable/Disable Analysis, Backfill\Recalculate, Queue, Map (output attribute), Event Frame Template dropdown, and the Analysis Details link. [S:af-data-exploration-notification-2020] (read)
- Variables are created by highlighting text, right-clicking and assigning it to a variable. Comments start with `//`. [S:af-kwan-getting-more-aa-2019] (read) [S:af-calc-asset-analytics-2022] (read)
- `NoOutput()` suppresses writing a result for an evaluation. [S:af-calc-asset-analytics-2022] (read)
- `Exit()` (added in AF 2018 SP2) stops evaluation of all further rows without evaluating them. [S:af-optimizing-analytics-2020] (read) [S:af-pisquare-af2018sp2-highlights] (read)
- Analyses read inputs from the service's local cache. One thread says writing a value to an upstream analysis output's snapshot from PSE did not re-trigger a dependent analysis. [S:af-pisquare-pse-write-trigger] (read)
- The Analysis Service tries to restart analyses in an error state every fifteen minutes by default. [S:af-optimizing-analytics-2020] (read)
- For high availability, the Analysis Service supports Windows Server Failover Clustering, and PI Point outputs are buffered by the PI Buffer Subsystem. [S:af-kwan-getting-more-aa-2019] (read) [S:af-feedback-pida-185] (read)
- Asset Analytics is designed for streaming calculations and is not suited to ad-hoc queries or bulk extraction across very many attributes. [S:af-kwan-getting-more-aa-2019] (read)
- AF SDK names the expression plug-in `PerformanceEquation` (`AnalysisRulePlugIns["PerformanceEquation"]`). Its ConfigString holds lines like `Avg2d := TagAvg('Temperature','*-2d','*');`. [S:af-pisquare-programmatic-analytics-blog] (read)
- `AnalysisRule.MapVariable("SumAvg", attribute)` maps an analysis variable to an output attribute, `SetStatus(AFStatus.Enabled)` enables it, and `CheckIn()` commits it. [S:af-pisquare-programmatic-analytics-blog] (read)
- `AFAnalysisRuleState.Outputs` holds evaluated values in variable-definition order, and `GetConfiguration` reports unresolved inputs/outputs and config errors. [S:af-pisquare-results-without-output] (read)
- Asset Analytics 2018 added array functions (for example `RecordedValuesByCount`, `FilterData`), which enable filtered calculations and moving averages without intermediate attributes. [S:af-pisquare-filter-expression] (read) [S:af-feedback-pida-1018] (read)
- AF 2018 SP2 added `Split()`, which builds string arrays from a string and a delimiter. [S:af-pisquare-af2018sp2-highlights] (read)

**Terms**
- Expression analysis: a multi-row PE-syntax calculation whose variables can map to output attributes [S:af-calc-asset-analytics-2022]
- Rollup analysis: an aggregation (Sum/Average/Min/Max/Count/Median) over matching attributes of child elements or the element [S:af-analyzing-pi-data-2018]
- Event Frame Generation analysis: an analysis that opens and closes event frames from trigger expressions [S:af-calc-asset-analytics-2022]
- SQC analysis: a Statistical Quality Control analysis that tests values against control limits [S:af-calc-asset-analytics-2022]
- PI Analysis Service: the Windows service that schedules and runs all analyses of an AF server [S:af-calc-asset-analytics-2022]
- Example element: the element chosen in a template's analysis editor to resolve attributes for Evaluate/Preview [S:af-using-af-analyze-asset-2019]
- NoOutput(): a function that tells the analysis not to write a value for this evaluation [S:af-calc-asset-analytics-2022]
- Exit(): a function that stops evaluating the remaining rows of an expression analysis [S:af-optimizing-analytics-2020]

**Worked-example material**
```
// Production efficiency (PI World 2019 lab)
ExpectedPowerVar  = TagVal('Expected Power (Polynomial)','*')
ActivePowerVar    = TagVal('Active Power','*')
ProductionDelta   = ExpectedPowerVar-ActivePowerVar
Running           = If 'Status' = "Run" or 'Status' = "Partial Run" then true else false
Efficiency        = IF ExpectedPowerVar = 0 or Not Running then NoOutput() else ActivePowerVar/ExpectedPowerVar*100
```
[S:af-using-af-analyze-asset-2019] (structure read. Exact keywords such as "then true else false" were reconstructed from the summary of the lab text, so verify)
- Curve function: `Convert(Curve('Adjusted Wind Speed', (0,0) (3.99,0) (4,78) ...),"kW")`. [S:af-using-af-analyze-asset-2019] (read)
- Rolling sum: `TagTot('Attribute1','*-10m','*')`. Time running since midnight: `TimeEq('Press Status','t','*',"Running")`. [S:af-calc-asset-analytics-2022] (read)

**Common mistakes / pitfalls**
- Checking in an untested template analysis starts it on all elements immediately. [S:af-using-af-analyze-asset-2019]
- Evaluate/Preview results differ from service results because of data source (archive vs snapshot) and account. [S:af-calc-asset-analytics-2022]
- Many analyses in error, retried every 15 minutes, can hurt performance. [S:af-optimizing-analytics-2020]
- Calling the same expensive function repeatedly instead of storing it in a variable. [S:af-tips-managing-analytics-2020]

**Open questions / Unverified background (verify)**
- SQC settings (training knowledge): input attribute, UCL/LCL/Center line attributes, rules such as Western Electric (one point outside 3σ, 2 of 3 beyond 2σ, ...), and the output written. No readable source.
- Rollup "Median" is sourced, but training knowledge also lists other rollup functions (for example Range or StdDev). Not confirmed.
- AF SDK plug-in names for Rollup/EventFrame/SQC rules (training knowledge: `Rollup`, `EventFrame`, `SQC`). Not read.

---

### af.scheduling: Periodic vs event-triggered, triggers, backfill/recalc, latency, skipped evaluations

**Facts**
- "Periodic scheduling is clock-based": you set a period and an optional offset from midnight. [S:af-calc-asset-analytics-2022] (read)
- Event-triggered scheduling runs whenever the chosen input attributes receive new values. [S:af-calc-asset-analytics-2022] (read)
- The trigger time is the scheduled time for periodic analyses, and the input's event time for event-triggered analyses. [S:af-calc-asset-analytics-2022] (read)
- Advanced output timestamp options are Trigger Time (default), Execution Time and Relative to Trigger Time, which allows future-stamped outputs. [S:af-calc-asset-analytics-2022] (read)
- Event-triggered options seen in labs are "Any Input" or a specific list of triggering inputs. [S:af-using-af-analyze-asset-2019] (read)
- The Periodic Configure dialog has a "Specify Offset" checkbox. One lab used a 5-minute period with a 1-second offset for rollups. [S:af-using-af-analyze-asset-2019] (read)
- In the AF SDK, the periodic time rule plug-in is `Periodic` with ConfigString `Frequency=300` (seconds). [S:af-pisquare-programmatic-analytics-blog] (read)
- For an event-triggered time rule, the ConfigString is empty when any input can trigger. Otherwise it lists the triggering attributes separated by semicolons. [S:af-pisquare-results-without-output] (read)
- Event-triggered scheduling was labelled "Natural" in older AF versions. A 2014 R2-era thread shows Scheduling "Natural" with "Any Input". [S:af-pisquare-pse-write-trigger] (inferred)
- Defaulting to "Any Input" can trigger an analysis several times per second when it has several inputs. A request to change that default has no AVEVA response. [S:af-feedback-pida-756] (read)
- Backfilling runs an analysis over an earlier period. Options are "Leave existing data and fill gaps" or "Permanently delete existing data and recalculate". [S:af-calc-asset-analytics-2022] (read)
- "Backfilling/recalculation requires that the output attributes have been mapped to PI Points." [S:af-calc-asset-analytics-2022] (read)
- Requests from the Management tab account for dependencies. Requests from a single element's Analyses tab ignore them unless the dependent-analyses recalculation option is selected. [S:af-calc-asset-analytics-2022] (read)
- Backfill procedure: Management > Analysis Searches > Add Criteria (for example Template) > select analyses > Operations > Backfill/Recalculate > Start (for example `*-1w`) > choose mode > Queue. Progress shows in the Backfilling column. [S:af-using-af-analyze-asset-2019] (read)
- AF 2018 SP2 lets you cancel bulk backfill/recalculation jobs from the Management plug-in. [S:af-pisquare-af2018sp2-highlights] (read)
- Auto-recalculation handles late or out-of-order data. Enable it when past data must be corrected, and avoid it when past results must not change. [S:af-kwan-getting-more-aa-2019] (read)
- Auto-backfilling fills gaps between service restarts, and analyses are queued at service start. [S:af-kwan-getting-more-aa-2019] (read)
- Avoid expensive, frequently evaluated summary queries such as `TagAvg()` over long ranges. Use a smaller range, evaluate less often, or rely on PI point compression. [S:af-adebayo-optimizing-aa-2019] (read)
- Real-time and recalculation work run as independent workers, and real-time calculations take priority. [S:af-kwan-getting-more-aa-2019] (read)
- Late or out-of-order data can trigger cascades of recalculation through dependent analyses. A suggested mitigation is to disable automatic recalculation and recalculate manually at low-load times (not midnight). [S:af-optimizing-analytics-2020] (read)
- Analysis group template syntax: `Template=<TemplatePath>[Schedule:<Schedule>Rank:<Rank>]`. [S:af-tips-managing-analytics-2020] (read)
- TriggerRatio = AverageElapsed / AverageTrigger. Ideally below 0.15, and about 2.5 means the group "will lag perpetually". [S:af-tips-managing-analytics-2020] (read)
- Maximum Latency is healthy when constantly around 5 s or below your tolerated latency. Evaluation Skipped Count should stay at 0, and a steadily rising value is bad. [S:af-tips-managing-analytics-2020] (read)
- The Analysis Service exposes counters including Analyses in Error/Running/Suspended, Cache Hit/Miss, Evaluation Count, Error Count, OOO Ignored Count, Events Cached/Processed, and Recalculation Requests Completed/Queued. [S:af-tips-managing-analytics-2020] (read)
- Run-time statistics (evaluation time, triggering rate, state, skip count) are available through the AF SDK from 2018 SP2. An example statistics query is `status:'Running' averageLag>'60000' sortBy:'averageLag' sortOrder:'Desc'`. [S:af-tips-managing-analytics-2020] (read)
- "The Elapsed time should always be less than the triggering interval". High lag means the engine cannot keep up. [S:af-optimizing-analytics-2020] (read)
- The PSE statistics view "only shows the worst performing five instances of each analytic template", and statistics reset when the service restarts. [S:af-optimizing-analytics-2020] (read)
- The PSE Performance view lists analysis groups by schedule. Group names end in "LoadSheddingSupported" or "LoadSheddingNotSupported". [S:af-pisquare-analysis-groups] (read)
- Expensive summaries such as `TagAvg()` over a month evaluated frequently should be replaced by shorter windows, less frequent schedules or daily-to-monthly rollups. [S:af-tips-managing-analytics-2020] (read) [S:af-pisquare-tagtot-condition] (read)
- A 30-day average that was event-scheduled was moved to hourly periodic scheduling in a performance lab. [S:af-optimizing-analytics-2020] (read)
- `HasChanged(<Attribute>,<Time>)` can gate expensive calculations so they don't run more often than needed. [S:af-optimizing-analytics-2020] (read)
- Legacy PE (Performance Equation) tags allow event-based scheduling on only one trigger tag. If an evaluation takes longer than the period, it may skip. [S:af-pisquare-pe-digital-states] (read)

**Terms**
- Periodic schedule: clock-based triggering every N seconds/minutes with optional offset [S:af-calc-asset-analytics-2022]
- Event-triggered (Natural) schedule: an analysis runs when its input attributes get new events [S:af-calc-asset-analytics-2022]
- Trigger time: the timestamp an evaluation is computed at and, by default, the output timestamp [S:af-calc-asset-analytics-2022]
- Backfill: computing analysis results for a past range [S:af-calc-asset-analytics-2022]
- Recalculation: deleting and recomputing existing outputs [S:af-calc-asset-analytics-2022]
- Auto-recalculation: automatic recompute when late or out-of-order input data arrives [S:af-kwan-getting-more-aa-2019]
- Evaluation latency/lag: delay between trigger time and evaluation completion [S:af-tips-managing-analytics-2020]
- Skipped evaluation: an evaluation the service drops because it cannot keep up [S:af-tips-managing-analytics-2020]

**Worked-example material**
- Periodic 5-minute rollup, Offset 1 s (ConfigString `Frequency=300`). [S:af-using-af-analyze-asset-2019] [S:af-pisquare-programmatic-analytics-blog]
- Backfill `*-7d` to `*`, mode "Permanently delete existing data and recalculate", then Queue. [S:af-analyzing-pi-data-2018]

**Common mistakes / pitfalls**
- Leaving "Any Input" on analyses with many fast inputs. [S:af-feedback-pida-756]
- Backfilling analyses whose outputs aren't PI Points (not allowed). [S:af-calc-asset-analytics-2022]
- Recalculating at midnight, when many daily calculations already run. [S:af-optimizing-analytics-2020]

**Open questions / Unverified background (verify)**
- "Natural" vs "explicit" trigger terminology in current docs. Training knowledge: event-triggered analyses wait (default "wait time" ~5 s?) for data from all inputs before evaluating. Not read.
- Analysis Service configuration parameters (for example the maximum evaluation queue, data cache time) and their defaults. Not read.

---

### af.sdk: AF SDK object model and AFSearch query syntax

**Facts**
- AF SDK is "a Microsoft .NET based programmatic library" for Visual Basic .NET, C# and Managed C++. It ships in the "PI AF Client (includes AF SDK)". [S:af-intro-dev-tech-2020] (read)
- AF SDK requires .NET Framework 3.5 at minimum, and the .NET 4.5 assemblies are recommended for the full feature set. [S:af-intro-dev-tech-2020] (read)
- `PISystems` is declared as `public sealed class PISystems : IList<PISystem>`. [S:af-afsdk-pm-best-practices-2020] (read)
- "The PISystem represents a single logical data store for the AF SDK." [S:af-afsdk-pm-best-practices-2020] (read)
- "The AFDatabase represents a single database ... in a PI AF Server." [S:af-afsdk-pm-best-practices-2020] (read)
- Connection pattern: `piSystem.Connect();` then check `piSystem.ConnectionInfo.IsConnected`. [S:af-afsdk-pm-best-practices-2020] (read)
- `AFDatabase.CheckIn()` commits pending changes, and `AFDatabase.FindChangedItems` is recommended for detecting changes. [S:af-afsdk-pm-best-practices-2020] (read)
- XML export/import in the SDK: `PISystem.ExportXml(obj, PIExportMode.NoUniqueID | PIExportMode.Flat, ...)` and `PISystem.ImportXml(db, PIImportMode.AutoCheckIn, ...)`. [S:af-afsdk-pm-best-practices-2020] (read)
- Basic data calls named in OSIsoft training: `PISystem.Connect()`, `AFAttribute.GetValue()`, `AFAttribute.Data.UpdateValue()`. [S:af-intro-dev-tech-2020] (read)
- `AFCalculation.CalculateAtIntervals` evaluates a PE expression such as `PrevVal('sinusoid','*')` at intervals. Timestamps returned are the interval times. [S:af-pisquare-last-recorded-value] (read)
- The new AFSearch classes were introduced in AF 2016 (SDK 2.8.0) for elements, event frames, notification rules and notification rule templates. `AFAttributeSearch` and `AFNotificationContactTemplateSearch` were added in AF 2017 R2 (SDK 2.9.5). [S:af-afsearch-2018-deck] (read)
- `FindObjectIds` was added in SDK 2.8.5 (AF 2016 R2) and lightweight `FindObjectFields` in 2.9.0 (AF 2017). [S:af-afsearch-2018-deck] (read)
- Search filters added by version: 2.8.5: GroupID, Source, Destination. 2.9.0: CreationDate, ModifyDate, TargetName, TimeContext, TimeContextEnd. 2.9.5: EventFrame, IsInternal, Parent, PlugIn, PlugInName. 2.10: ID supports Equal or `IN(...)`. [S:af-afsearch-2018-deck] (read)
- Nested queries use braces, for example `Element:{Template:'FCC Pump Process' Category:'ProcessMonitoring'} Category:'Process Monitoring'` (AF 2017 R2). [S:af-pisquare-afsearch-2017r2-blog] (read)
- Inside a C# interpolated string, literal braces in a nested query must be doubled (`{{`, `}}`). [S:af-pisquare-afsearch-2017r2-blog] (read)
- Search values with wildcards are quoted, for example `Name:'Davi*'`. [S:af-pisquare-afsearch-2017r2-blog] (read)
- Attribute value filters in an AFSearch query use `'|Attribute Name':>=75` (note the leading pipe and the operator after the colon). [S:af-pisquare-afeventframesearch-blog] (read)
- A verified PI Square answer used `Template:ALARM_TEMPLATE |IS_ALARM:=TRUE ElementName:MPA` for event frame search. [S:af-pisquare-efsearch-attr-value] (read)
- `AFEventFrameSearch(database, "name", AFSearchMode.Overlapped, startTime, endTime, query)` is the constructor form taking a time window and a query string. [S:af-pisquare-afeventframesearch-blog] (read)
- Token-based search uses `AFSearchToken(AFSearchFilter.X, AFSearchOperator.Y, value)`, with filters such as Element, Template, Start, End and Value, and operators Equal, LessThanOrEqual and GreaterThanOrEqual. [S:af-pisquare-afeventframesearch-blog] (read)
- Server-side caching is opted in with `search.CacheTimeout = TimeSpan.FromMinutes(10)`. "A CacheTimeout of 10 minutes is more than generous for most applications." [S:af-pisquare-afeventframesearch-blog] (read) [S:af-afsearch-2018-deck] (read)
- Page through results with `FindEventFrames(startIndex: 0, fullLoad: false, pageSize: 1000)`. Setting pageSize to int.MaxValue is "Recommend: Never!". [S:af-pisquare-afeventframesearch-blog] (read) [S:af-afsearch-2018-deck] (read)
- With AFSearch, `First()`, `FirstOrDefault()` and `Skip()` are always safe, `Take()` is usually safe for small counts, and most other LINQ calls (`Count()`, `Select()`, `Where()`) are not safe. [S:af-afsearch-2018-deck] (read)
- `GetTotalCount()` returns the count of items to be sent from server to client. [S:af-afsearch-2018-deck] (read)
- From AF 2018, attribute value conditions do not require the data reference to be defined at template level. [S:af-afsearch-2018-deck] (read)
- Analyses are accessed with `element.Analyses["name"]` and created with `element.Analyses.Add("name")` in namespace `OSIsoft.AF.Analysis`. [S:af-pisquare-programmatic-analytics-blog] (read)

**Terms**
- PISystems: the collection of known AF servers on a client [S:af-afsdk-pm-best-practices-2020]
- PISystem: the AF SDK object for an AF server [S:af-afsdk-pm-best-practices-2020]
- AFDatabase: the AF SDK object for one AF database [S:af-afsdk-pm-best-practices-2020]
- AFSearch: the family of server-side search classes (AFElementSearch, AFEventFrameSearch, AFAttributeSearch, ...) using query strings or tokens [S:af-afsearch-2018-deck]
- CacheTimeout: the AFSearch property that keeps server-side search results cached for paging [S:af-pisquare-afeventframesearch-blog]

**Worked-example material**
```csharp
string query = "Element:{Template:'FCC Pump Process' Category:'ProcessMonitoring'} Category:'Process Monitoring'";
using (AFAttributeSearch search = new AFAttributeSearch(root.Database, "nested query string", query))
{
    search.CacheTimeout = TimeSpan.FromMinutes(10);
    foreach (AFAttribute item in search.FindAttributes()) { /* ... */ }
}
```
[S:af-pisquare-afsearch-2017r2-blog] (read)
- EF query: `Element:<path> Template:<path> '|Tank Level':>=75` with `AFSearchMode.Overlapped`. [S:af-pisquare-afeventframesearch-blog]

**Common mistakes / pitfalls**
- Calling `.Count()` or `.Where()` on an AFSearch enumeration, which pulls everything. Use `GetTotalCount()`. [S:af-afsearch-2018-deck]
- Forgetting to dispose the search (use `using` or `Close()`). [S:af-afsearch-2018-deck]
- Using `AFSearchFilter.Value` tokens incorrectly. Value searches need `AFSearchValueToken`. [S:af-pisquare-efsearch-attr-value]

**Open questions / Unverified background (verify)**
- Training knowledge (not read): `AFElement`, `AFAttribute.Data.RecordedValues(AFTimeRange, AFBoundaryType, ...)`, `InterpolatedValues`, `Summary(timeRange, AFSummaryTypes, AFCalculationBasis, AFTimestampCalculation)`; `AFTime("*-1h")`, `new AFTimeRange("*-1d","*")`; `AFValue` (Value, Timestamp, IsGood, UOM); AFSummaryTypes members (Total, Average, Minimum, Maximum, Range, StdDev, PopulationStdDev, Count, PercentGood, All, ...); AFCalculationBasis (TimeWeighted, EventWeighted, TimeWeightedContinuous, TimeWeightedDiscrete, EventWeightedExcludeMostRecentEvent, EventWeightedExcludeEarliestEvent, EventWeightedIncludeBothEnds); AFBoundaryType (Inside, Outside, Interpolated). Verify all.
- Query-string keyword list for AFElementSearch (Name, Description, Template, Category, Root, AllDescendants, ...). Only those in examples are sourced.

---

### af.pse: PI System Explorer

**Facts**
- PSE Navigator sections: Elements, Event Frames, Library, Unit of Measure and Management. The Navigator is in the lower left. [S:af-building-assets-workbook] (read) [S:af-data-exploration-notification-2020] (read)
- The Browser pane lists the objects of the selected Navigator section. The Viewer pane is the main work area. [S:af-building-assets-workbook] (read)
- Other PSE UI parts described are the Configuration Panel (attribute properties), Palette, Status Bar, and Menu Bar/Toolbar. [S:af-building-assets-workbook] (read)
- Keyboard shortcuts in a lab: Elements Ctrl+1, Event Frames Ctrl+2, Library Ctrl+3. Check In is Ctrl+S. [S:af-using-af-analyze-asset-2019] (read)
- "The AF Server uses a sandbox concept for modifications". Changes are visible to others only after Check In, and checked-out objects can't be edited by others until checked in. [S:af-building-assets-workbook] (read)
- "Undo all changes to the Database" resets the sandbox. [S:af-building-assets-workbook] (read)
- Export: File > Export to File, or right-click an object > Export. Import: File > Import from File. "Include All Referenced Objects" exports templates, tables and UOMs needed to rebuild the structure. [S:af-building-assets-workbook] (read)
- The Management plug-in is where analyses are searched, enabled, disabled, backfilled and recalculated in bulk. [S:af-using-af-analyze-asset-2019] (read)
- Event Frame Searches: right-click > New Search, choose a template, and rename the search. [S:af-using-af-analyze-asset-2019] (read)
- Notification UI in PSE includes View/Edit Subscriptions, Manage Formats, Insert Link and Test Send. [S:af-data-exploration-notification-2020] (read)
- AF 2018 SP2 added an Effective Access tab in the Security Configuration dialog (from a reader comment on the release blog). [S:af-pisquare-af2018sp2-highlights] (read)
- The legacy (2012) Notifications navigator section was removed in newer PSE. Notification rules live with elements and templates. [S:af-pisquare-notif-migration] (read)
- Display UOM Group is set in Tools > Options. [S:af-building-assets-workbook] (read)

**Terms**
- Check In: committing sandboxed PSE edits to the AF server [S:af-building-assets-workbook]
- Navigator / Browser / Viewer: PSE's section list, object tree and work area panes [S:af-building-assets-workbook]

**Worked-example material**
- Export path in a lab: `C:\Class\Exercises\01_Velocity Terminals\My Velocity Terminals.xml`. [S:af-building-assets-workbook]

**Common mistakes / pitfalls**
- Forgetting to Check In, so colleagues and services don't see the changes. [S:af-building-assets-workbook] (inferred)
- Exporting without "Include All Referenced Objects", then failing to import into another server. [S:af-building-assets-workbook]

**Open questions / Unverified background (verify)**
- Element Viewer tabs: General, Child Elements, Attributes, Ports, Analyses, Notification Rules, Version (only General, Attributes, Child Elements, Analyses and Notification-rule tabs are sourced). The Contacts navigator section was not seen in readable sources.
- Data reference "Settings…" dialog layouts (PI Point: Data Server, Tag, Source Units, Value retrieval method, "Tag Creation" options; Formula: variable grid; Table Lookup: Table/Result column/Where builder). Partly sourced above.

---

### af.collectives-security: AF HA, collectives (legacy), Always On, security

**Facts**
- AVEVA's 2022 official recommendation: use a load balancer for the AF Application Service, Windows Server failover clustering for PI Analysis Service and PI Notifications Service, and SQL Server Always On Availability Groups for the SQL backend. [S:af-feedback-pida-185] (read)
- AVEVA states these configurations ensure redundancy and read/write after failover, "which was not supported with AF Collectives", and it has "no plans to further update the AF Collective implementation". [S:af-feedback-pida-185] (read)
- A 2015 HA deck shows AF HA using Network Load Balancing ("Fully Automatic", "Seamless to clients") and supporting HA writes such as event frames. The SQL tier is a "Cluster or SQL AlwaysOn Group". [S:af-ha-2015-deck] (read)
- PI Data Archive collective members are "completely independent data stores", unlike AF, which shares one SQL database. [S:af-ha-2015-deck] (read) (contrast inferred)
- For large distributed systems, the architecture course recommends two AF servers behind a network load balancer, with SQL Server on separate redundant computers. [S:af-architecture-workbook] (read)
- Users connect to PI AF with Windows Integrated Security, and effective permissions on AF objects are based on the Windows identity and stored as Windows security descriptors. [S:af-architecture-workbook] (read)
- An old thread notes AF SDK 2.5 had no collective support, with buffering targeted for AF SDK 2014. [S:af-pisquare-collective-thread] (read)
- AF Search can filter by SecurityString and SecurityToken (AF SDK 2.10). [S:af-afsearch-2018-deck] (read)

**Terms**
- AF collective (legacy): a primary/secondary AF server arrangement with SQL replication where secondaries were read-only. AVEVA no longer develops it [S:af-feedback-pida-185]
- Always On Availability Group: SQL Server HA feature recommended for the PIFD backend [S:af-feedback-pida-185]

**Common mistakes / pitfalls**
- Designing new systems on AF collectives, which have no read/write after failover. [S:af-feedback-pida-185]

**Open questions / Unverified background (verify)**
- AF identities and mappings (training knowledge: AF 2015+ introduced AF identities such as Administrators, Engineers, World, Owner; mappings link Windows accounts/groups to identities; access rights Read, Write, Read Data, Write Data, Delete, Execute, Admin, Subscribe, Annotate). Not read.
- Default identity set and permission defaults. Not read.

---

### af.library-versioning: Library, export/import, versioning

**Facts**
- The Library contains element templates (Library > Templates > Element Templates), event frame templates, categories, enumeration sets and tables. [S:af-building-assets-workbook] (read) [S:af-data-exploration-notification-2020] (read)
- XML export/import is done from PSE File > Export to File / Import from File. "Include All Referenced Objects" also exports templates, tables and UOMs. [S:af-building-assets-workbook] (read)
- AF Libraries automatically include the UOM database. [S:af-pisquare-uom-db-scope] (read)
- AF SDK supports XML export/import (`ExportXml`/`ImportXml` with `PIExportMode`/`PIImportMode` flags such as `NoUniqueID`, `Flat`, `AutoCheckIn`). [S:af-afsdk-pm-best-practices-2020] (read)
- From AF 2018 SP2, analyses and notification rules can be imported disabled for review. [S:af-pisquare-af2018sp2-highlights] (read)
- The AF SDK getting-started sample ships its database as an XML file to be imported in PSE. [S:af-github-afsdk-getting-started] (read)

**Open questions / Unverified background (verify)**
- AFExport.exe / AFImport.exe command-line utilities in `%PIHOME%\AF` (training knowledge). Not read.
- Element versioning: AF historically supported versioned elements and templates with effective dates (the "Version" tab). Unverified whether current PSE still exposes it.

---
### an.pe-syntax: Performance Equation syntax

**Facts**
- Attribute names, PI tag names and time expressions are enclosed in single quotes, for example `'CDT158'` and `'*-1h'`. [S:af-calc-asset-analytics-2022] (read)
- Strings and digital state names are enclosed in double quotes, for example `"ON"` and `"Running"`. [S:af-calc-asset-analytics-2022] (read)
- Operators and function names are written without quotes (`+`, `*`, `^`, `TagTot()`). [S:af-calc-asset-analytics-2022] (read)
- Comments in analysis expressions start with `//`. [S:af-calc-asset-analytics-2022] (read)
- Variables defined in earlier rows of an expression analysis are referenced without quotes, while attributes are in single quotes. [S:af-using-af-analyze-asset-2019] (read)
- Conditional syntax is `IF <condition> THEN <value> ELSE <value>`, which can be nested with `ELSE IF`. [S:af-analyzing-pi-data-2018] (read) [S:af-pisquare-pe-digital-states] (read)
- Logical operators `AND`, `OR` and `NOT` combine conditions, and `<>` is "not equal". [S:af-using-af-analyze-asset-2019] (read) [S:af-analyzing-pi-data-2018] (read)
- A PE IF expression can return digital state names, for example `IF 'tag' <= 680 THEN "Green" ELSE IF 'tag' > 700 THEN "Red" ELSE "White"`. [S:af-pisquare-pe-digital-states] (read)
- Time abbreviations: `*` = current time, `t` = today 00:00:00, `y` = yesterday 00:00:00. [S:af-visualizing-pi-data] (read)
- Time offset units are s, m, h, d, mo, y and w. Examples: `*-1h` (one hour ago), `t+8h` (08:00 today), `y-8h` (16:00 the day before yesterday), `mon+14.5h` (14:30 last Monday). [S:af-visualizing-pi-data] (read)
- Only one time offset should be used in a time expression ("Including multiple offsets can lead to unpredictable results"). [S:af-visualizing-pi-data] (read)
- Fractional offset values are allowed only for seconds, minutes and hours. [S:af-visualizing-pi-data] (read)
- In an absolute time with the time part omitted, midnight is assumed. If day, month or year is omitted, the current one is assumed. [S:af-visualizing-pi-data] (read)
- A quoted time expression is evaluated when the expression is parsed (compile time), whereas `ParseTime()` evaluates its string argument. [S:af-pisquare-timestamp-diff] (read)
- Subtracting two timestamps gives a time span. `Int()` of a timestamp returns UTC seconds, and `Int()` of a time span returned seconds in testing. [S:af-pisquare-timestamp-diff] (read)
- Writing an integer to a DateTime attribute in Analytics treats it as UTC seconds. [S:af-pisquare-timestamp-diff] (read)
- PE tag error `[-12301] Performance Equation parsing error` can be caused by referencing a tag that does not exist. The `pipetest` utility can test PE syntax. [S:af-pisquare-pe-12301] (read)
- PI message logs report a parse error position as "Offset x" characters into the expression. [S:af-pisquare-pe-12301] (read)
- A conversion factor does not apply to a PE tag. Put the multiplier directly into the expression. [S:af-pisquare-pe-12301] (read)
- Legacy PE tags (point source C, evaluated by PI Performance Equation Scheduler) support clock scheduling or event scheduling on a single trigger tag. [S:af-pisquare-pe-digital-states] (read) [S:af-pisquare-pe-to-analytics-migration] (read)
- Migrating PE tags to Analytics by changing point source from `C` to the analysis point source and clearing ExDesc can leave a "Scan Off" value in the tag. [S:af-pisquare-pe-to-analytics-migration] (read)
- AF Analytics has no `PrevGoodVal` function. The workaround uses `BadVal`, `PrevVal` and `PrevEvent`. [S:af-pisquare-pe-to-analytics-migration] (read)
- One PI Square answer claims `=` is assignment and `==` the equality operator, but OSIsoft lab expressions use single `=` for comparison (`'Status' = "Run"`). Treat `=` as comparison in PE. [S:af-pisquare-filter-expression] (read) [S:af-using-af-analyze-asset-2019] (read) (inferred resolution)
- Use straight single quotes (`'`), not typographic smart quotes or backticks. Wrong quote characters cause parse errors. [S:af-software-athlete-calc-syntax] (read) [S:af-pisquare-pe-12301] (read)
- The 2013 AF Analytics roadmap set "Performance Equation Syntax" as the expression language goal for AF analytics. [S:af-af-analytics-2013-deck] (read)

**Terms**
- Performance Equation (PE): the PI expression language (and legacy PE point type) using quoted tags/attributes, PI time expressions and built-in functions [S:af-calc-asset-analytics-2022]
- PI time expression: a string such as `*`, `t`, `y`, `*-1h`, `t+8h` resolved relative to the evaluation time [S:af-visualizing-pi-data]
- Digital state literal: a state name in double quotes, such as `"Running"` [S:af-calc-asset-analytics-2022]

**Worked-example material**
- `IF (AvgTemp-Abs(DeltaTemp/2))/AvgTemp > 0.2 THEN TRUE ELSE FALSE` (start trigger). [S:af-analyzing-pi-data-2018]
- `if TagMean('tag','*-2m','*') = 0 then 1 else 0` and `TimeEq('tag', '*-2m', '*', 0) = 120` (zero for 2 minutes). [S:af-pisquare-pe-zero-2min]
- `Int(ParseTime("*") - PrevEvent('Input Tag', ParseTime("*")))` (seconds since last event). [S:af-pisquare-timestamp-diff]

**Common mistakes / pitfalls**
- Using smart quotes or backticks around tag names. [S:af-pisquare-pe-12301]
- Missing spaces before `THEN`/`ELSE`, or stray doubled quotes. [S:af-pisquare-pe-digital-states]
- Referencing a tag that was not migrated to the new server, which gives error -12301. [S:af-pisquare-pe-12301]
- Using several offsets in one time expression (for example `*-1d+2h`). [S:af-visualizing-pi-data]

**Open questions**
- Full operator precedence table, and whether `==` is accepted. Verify.
- Other time keywords (`today`, `yesterday`, `sun`..`sat`, month names). Only `mon` is sourced as a day abbreviation.

---

### an.pe-functions: Performance Equation functions

**Facts (sourced usages; signatures as seen in examples)**
- `TagTot('attr', start, end)` returns a time integral that assumes the input is in units per day, so a per-hour rate needs `* 24`. [S:af-analyzing-pi-data-2018] (read) [S:af-pisquare-tagtot-units] (read)
- `TagTot` "has no knowledge of the actual units of the input rate tag". [S:af-pisquare-tagtot-units] (read)
- `TagAvg('tag', start, end)` is time-weighted. [S:af-pisquare-time-vs-event-weighted] (read)
- `TagMean('tag', start, end)` is event-weighted (the mean of recorded events). [S:af-pisquare-time-vs-event-weighted] (read) [S:af-pisquare-tagtot-units] (read)
- Most PI analytics summary functions are time-weighted, "the exception being TagMean". [S:af-pisquare-retrieval-methods-timerange] (read)
- When re-evaluated every second with no new data, `TagAvg` returns new values because time advances, while `TagMean` doesn't change until a new event arrives. [S:af-pisquare-time-vs-event-weighted] (read)
- `EventCount('attr', start, end)` returns the number of events in the range. `TagMean(x,s,e)*EventCount(x,s,e)` gives an event-weighted sum. [S:af-pisquare-tagtot-units] (read) [S:af-pisquare-sum-values] (read)
- `TimeEq('attr', start, end, value)` returns the time in seconds that the attribute equaled value in the range. An example is `TimeEq('Press Status','t','*',"Running")`. [S:af-calc-asset-analytics-2022] (read) [S:af-pisquare-number-occurrences] (read)
- `TimeEq` must consider every event in the window, so its cost grows with event count. Past results don't change and can be cached. [S:af-pisquare-cumulative-duration] (read)
- `FindEq('attr', start, end, value)` returns the timestamp of the first occurrence of value. A start later than the end searches backwards, for example `FindEq('Best Operating State','*','-7d', "Regenerating")`. [S:af-data-exploration-notification-2020] (read) [S:af-pisquare-number-occurrences] (read) (backward search inferred from example)
- `PrevEvent('tag', time)` returns the timestamp of the previous recorded event, and `PrevVal('tag', time)` returns its value. [S:af-pisquare-prevevent-prevval] (read) [S:af-pisquare-last-recorded-value] (read)
- `PrevEvent('tag','*+1s')` is used so the event at the current timestamp is included. [S:af-pisquare-prevevent-prevval] (read) [S:af-pisquare-pse-write-trigger] (read)
- `TagVal('tag', time)` returns the value at a time (interpolated for continuous tags when no event exists), and `TagVal('attr')` with no time uses the evaluation time. [S:af-using-af-analyze-asset-2019] (read) [S:af-pisquare-prevevent-prevval] (read) (interpolation behaviour from ACE Value method, inferred to apply)
- `BadVal(x)` tests whether a value is bad (a system digital state). Example: `IF BadVal('Flow') THEN 0 ELSE 'Flow'`. [S:af-pisquare-pe-to-analytics-migration] (read) [S:af-software-athlete-calc-syntax] (read)
- `DaySec(time)` returns seconds since midnight, for example `DaySec('*')`. It fails for spans over a day. [S:af-calc-asset-analytics-2022] (read) [S:af-pisquare-timestamp-diff] (read)
- `Curve(x, (x1,y1) (x2,y2) … (xn,yn))` linearly interpolates between points. [S:af-calc-asset-analytics-2022] (read)
- `Poly(x, c0, c1, ...)` evaluates a polynomial from numeric coefficients. [S:af-calc-asset-analytics-2022] (read)
- `Bom(time)` is the beginning of the month, for example `bom('*')`. [S:af-pisquare-sum-values] (read)
- Functions listed by category in the 2018 course (Section 7.2): Archive Value Statistics (TagAvg, PctGood), Date and Time (Bod, Hour), Logical (And, If), Math (Abs, Sqr), PI digital states (DigState, DigText), Point Attributes (TagSpan, TagType), Search and Retrieval (TimeEq, NextEvent), Statistical (Rand, Total), Status (NoOutput, TagBad), String (Len, Text). [S:af-analyzing-pi-data-2018] (read)
- `Avg(a, b, ...)` averages its arguments, for example `Avg('Exhaust Gas Temperature - #1 Probe','Exhaust Gas Temperature - #2 Probe')`. [S:af-analyzing-pi-data-2018] (read)
- The 2022 course also names TagMax, TagNum, NumOfChanges, TimeGE, TimeGT, Exit, BadVal, NoOutput, BOM and Convert. [S:af-calc-asset-analytics-2022] (read)
- `PIExpVal("<PE expression>", time, ...)` evaluates a PE expression in PI DataLink. Inside the string, double quotes are doubled (`""Hello""`). [S:af-pisquare-pe-text-output] (read)
- PI DataLink "Calculated Data" returns statistical results and can't return strings from IF logic. "Sampled Data" with a PE expression can. [S:af-pisquare-pe-text-output] (read)
- Example usages from a third-party list (corroboration only): `TagMax('tag1','-1h','*')`, `FindGE('tag1','-1d','*',50)`, `Round('tag1',2)`, `Trunc(28.75,10)`, `Text(Round('sinusoid',1)," is the current value...", '*')`, `Hour('t')`, `Weekday('*')`, `Yearday('*')`. [S:af-software-athlete-calc-functions] (read)

**Terms**
- TagTot: totalizer function returning the time integral of an input assumed to be per-day [S:af-pisquare-tagtot-units]
- TagAvg: time-weighted average over a range [S:af-pisquare-time-vs-event-weighted]
- TagMean: event-weighted (arithmetic) average of recorded events over a range [S:af-pisquare-time-vs-event-weighted]
- TimeEq: time in seconds an input equaled a value during a range [S:af-calc-asset-analytics-2022]
- PrevEvent / PrevVal: timestamp / value of the previous archived event before a time [S:af-pisquare-prevevent-prevval]
- BadVal: returns true when the argument is a bad (system digital state) value [S:af-pisquare-pe-to-analytics-migration]

**Worked-example material**
- Running hours accumulator: `'RunningHours_Tag' + TimeEq('Binary_Tag',PrevEvent('Binary_Tag','*'),...,"0")/3600`. [S:af-pisquare-cumulative-duration] (expression partially garbled in source, so verify)
- Month-to-date event sum: `TagMean(prod,bom('*'),'*')*EventCount(prod,bom('*'),'*')`. [S:af-pisquare-sum-values]
- Daily total from t/h rate: `TagTot('filtredFlow', BOM('*'), '*') * 24`. [S:af-pisquare-tagtot-condition]

**Common mistakes / pitfalls**
- Forgetting TagTot's per-day assumption, which gives totals 24× too small for per-hour rates or 86400× for per-second rates. [S:af-pisquare-tagtot-units] (86400 factor inferred)
- Using TagAvg on sparse discrete data where TagMean is wanted, or vice versa. [S:af-pisquare-mean-vs-average]
- Averages hiding values: `TagAvg = 0` can be true with values -1 and +1, so prefer `TimeEq`. [S:af-pisquare-pe-zero-2min]

**Open questions / Unverified signature list (training knowledge; flag every item `verify`)**
The official alphabetical PE reference [S:af-docs-pe-alpha-ref] was unreadable. Commonly documented signatures (unverified):
- Summary: `TagAvg(tag, st, et [, pctgood])`, `TagTot(tag, st, et [, pctgood])`, `TagMax/TagMin/TagMean(tag, st, et [, pctgood])`, `TagRange`, `TagStD`, `PctGood(tag, st, et)`, `EventCount(tag, st, et [, pctgood])`, `NumOfChanges(tag, st, et)`, `TagNum`.
- Retrieval: `TagVal(tag [, time])`, `PrevVal(tag, time)`, `NextVal(tag, time)`, `PrevEvent(tag, time)`, `NextEvent(tag, time)`, `TagBad(tag [, time])`.
- Search: `FindEq/FindNE/FindGT/FindGE/FindLT/FindLE(tag, st, et, value)`; `TimeEq/TimeNE/TimeGT/TimeGE/TimeLT/TimeLE(tag, st, et, value)`.
- Time: `ParseTime(str)`, `Bod(t)`, `Bom(t)`, `Bonm(t)`, `Noon(t)`, `Day/Hour/Minute/Second/Month/Year/Weekday/Yearday(t)`, `DaySec(t)`.
- Math: `Abs, Sqr, Sqrt, Exp, Log, Log10, Round(x [, unit]), Trunc(x [, unit]), Int, Frac, Sgn, Min(...), Max(...), Avg(...), Total(...), Median(...), StDev(...), Poly, Curve, Sin/Cos/Tan/ASin/ACos/ATan/Sinh/Cosh/Tanh, Rand`.
- Digital/String: `DigState(str)`, `DigText(state)`, `IsSet`, `Concat`, `Left(s,n)`, `Right(s,n)`, `Mid(s, start [, len])`, `Len`, `LCase`, `UCase`, `Trim/LTrim/RTrim`, `InStr`, `String(x)`, `Text(...)`, `Format`.
- Tag attributes: `TagDesc, TagEU, TagExDesc, TagSource, TagSpan, TagType, TagTypVal, TagZero`.

---

### an.af-functions: AF analysis functions (beyond PE)

**Facts**
- AF analyses accept PE syntax functions plus AF-specific ones. "150+ built in functions" are cited. [S:af-tips-managing-analytics-2020] (read)
- `EventFrame("StartTime")`, `EventFrame("EndTime")` and `EventFrame("Duration")` return properties of the current event frame in Event Frame Generation analyses. [S:af-data-exploration-notification-2020] (read) [S:af-analyzing-pi-data-2018] (read)
- `RecordedValuesByCount('attr', time, n)` returns an array of the last n recorded values. [S:af-data-exploration-notification-2020] (read)
- `FilterData(array, $val = "Drying")` filters an array with a predicate, where `$val` refers to each element's value. [S:af-data-exploration-notification-2020] (read)
- `TimeStamp(array[1])` returns the timestamp of an array element, and arrays are 1-based in this example. [S:af-data-exploration-notification-2020] (read)
- `Convert(expr, "kW")` assigns or converts the result to a UOM before it is written to the output. [S:af-calc-asset-analytics-2022] (read) [S:af-using-af-analyze-asset-2019] (read)
- `NoOutput()` produces no output for the evaluation. [S:af-calc-asset-analytics-2022] (read)
- `Exit()` ends analysis execution and skips the remaining rows (AF 2018 SP2). [S:af-pisquare-af2018sp2-highlights] (read) [S:af-optimizing-analytics-2020] (read)
- `HasChanged(<Attribute>,<Time>)` checks whether an attribute changed, to throttle expensive work. [S:af-optimizing-analytics-2020] (read)
- `Split()` (AF 2018 SP2) creates string arrays from a string and a delimiter. [S:af-pisquare-af2018sp2-highlights] (read)
- AF 2018 SP2 gave all tag summary functions (TagTot, TagAvg, …) an event-weighted option, and gave the array/data summary functions (Total, Avg, …) a time-weighted option. Before that, the array functions were event-weighted only. [S:af-pisquare-af2018sp2-highlights] (read) [S:af-feedback-pida-1059] (read)
- Array functionality in PI Server 2018 analytics makes moving averages possible. [S:af-feedback-pida-1018] (read)
- AF analysis functions that take an attribute name argument do not accept a nested expression in its place. A request to allow this has no status. [S:af-feedback-pida-825] (read)
- AF Analytics has no built-in function to count occurrences of a value in a range. The workaround is an intermediate analysis `IF 'Tag' = "Value" THEN 1 ELSE NoOutput()` followed by `EventCount(...)`. [S:af-pisquare-number-occurrences] (read)
- KB01120 "Filtered calculations in Asset Analytics" documents filtered-calculation approaches. [S:af-pisquare-number-occurrences] (read) [S:af-pisquare-tagtot-condition] (read)
- `Timestamp('attr')` in a scheduled analysis returned the evaluation time, because the value is interpolated to the trigger time. [S:af-pisquare-timestamp-diff] (read)
- Functions used in OSIsoft labs: PrevVal, NoOutput, TagAvg, BadVal, Not, TagTot, PrevEvent, FindEq, TimeEq, TagMax, EventFrame, RecordedValuesByCount, FilterData, TimeStamp, TagVal. [S:af-data-exploration-notification-2020] (read)

**Terms**
- Analysis array: an array value returned by functions like RecordedValuesByCount, processed with FilterData and array summaries [S:af-data-exploration-notification-2020]
- FilterData: an AF function that returns array elements matching a `$val` predicate [S:af-data-exploration-notification-2020]
- Convert(): an AF function that converts or assigns a UOM to an expression result [S:af-using-af-analyze-asset-2019]
- EventFrame(): an AF function returning the current event frame's StartTime/EndTime/Duration [S:af-data-exploration-notification-2020]

**Worked-example material**
```
PastTenStates    = RecordedValuesByCount('Best Operating State','*',10)
PastDryingStates = FilterData(PastTenStates, $val="Drying")
LastDryingEvent  = TimeStamp(PastDryingStates[1])
HrsIntoDrying    = TimeEq('Best Operating State', LastDryingEvent, '*', "Drying")/3600
```
[S:af-data-exploration-notification-2020] (read)

**Open questions / Unverified (training knowledge, verify)**
- AF-only function list by category: Array (RecordedValues, RecordedValuesByCount, FilterData, ArrayLength?, Sort?), Data summary on arrays (Avg, Total, Min, Max, StDev, Median), Time (`Now()`, `LastCalculationTime`?, `TimeStamp`), Event frame (`EventFrame`), Logical/Conversion (`Convert`, `Float`, `Int`, `String`, `DigText`), String (`Concat`, `Left`, `Right`, `Mid`, `Len`, `Replace`, `Split`, `NewLine`), Status (`NoOutput`, `Exit`, `BadVal`, `HasChanged`, `HasValueChanged`?). Signature details not sourced.

---

### an.weighting: Time-weighted vs event-weighted

**Facts**
- Time-weighted averaging weights each value by how long it was in effect, while event-weighted averaging counts each recorded event equally, for example `(v1+v2+v3)/3`. [S:af-pisquare-time-vs-event-weighted] (read)
- "Average is time-weighted and mean is event-weighted" in PI DataLink. Use average for continuous rates such as flow, and mean for discrete measurements. [S:af-pisquare-mean-vs-average] (read)
- `TagAvg` is time-weighted and `TagMean` is event-weighted. [S:af-pisquare-sum-values] (read)
- PI Data Archive summary calculations support Average, Count, Delta, Maximum/Minimum, Population Standard Deviation, Range, Standard Deviation and Total, as event- or time-weighted. [S:af-optimizing-analytics-2020] (read)
- Summary calculations on the PI Data Archive send only the results to the Analytics server, which reduces Analytics load but increases Data Archive load. [S:af-optimizing-analytics-2020] (read)
- Event-weighted summaries for tag functions and time-weighted options for array summaries arrived in AF 2018 SP2. [S:af-pisquare-af2018sp2-highlights] (read) [S:af-feedback-pida-1059] (read)
- An event-weighted standard deviation over an arbitrary range had no clean method before AF 2018. [S:af-pisquare-retrieval-methods-timerange] (read)
- An event frame rollup custom DR offers Average (time-weighted) and Mean (event-weighted). When rolling up durations, Average and Mean give the same result. [S:af-pisquare-ef-rollup-cdr-blog] (read)
- For a value that stays at 0, TagAvg and TagMean give essentially the same result. [S:af-pisquare-pe-zero-2min] (read)

**Terms**
- Time-weighted: a summary in which each value counts in proportion to its duration [S:af-pisquare-time-vs-event-weighted]
- Event-weighted: a summary in which each recorded event counts equally [S:af-pisquare-time-vs-event-weighted]

**Worked-example material**
- Values: v1 = 10 for 10 s, v2 = 20 for 5 s, v3 = 30 for 5 s (20 s window, step interpretation). Event-weighted mean = 20. Time-weighted = (10·10+20·5+30·5)/20 = 17.5. [S:af-pisquare-time-vs-event-weighted] (numbers constructed from the thread's durations; arithmetic inferred)

**Open questions**
- AFCalculationBasis member list and exact boundary handling for EventWeighted (whether events exactly at the start/end are included). Verify.

---

### an.interpolation: Step, interpolated vs recorded vs plot values, boundaries

**Facts**
- For a continuous (non-step) tag, PI uses the next archived event to interpolate a value at a time between events, which makes moving averages ramp. [S:af-pisquare-moving-average] (read)
- For a step tag, interpolation always uses the last recorded value. [S:af-pisquare-moving-average] (read)
- `Value`-style retrieval interpolates at a time unless an archived event exists at that time. [S:af-pisquare-prevevent-prevval] (read)
- PI DataLink function meanings: Compressed Data = "All the values of a Data Item for a specified time period"; Sampled Data = "Evenly-spaced, interpolated values ... over a regular interval"; Timed Data = "Actual or interpolated sample values ... at specified time stamps". [S:af-visualizing-pi-data] (read)
- `CalculateAtIntervals` returns interval timestamps, not the timestamps of the underlying recorded events. [S:af-pisquare-last-recorded-value] (read)
- In scheduled analyses, attribute values are interpolated to the trigger time, so `Timestamp('attr')` returns the trigger time. [S:af-pisquare-timestamp-diff] (read)
- Evaluate/Preview use compressed archive data, while the running service uses snapshot data. [S:af-calc-asset-analytics-2022] (read)

**Terms**
- Step attribute: a point/attribute whose value holds until the next event (no linear interpolation) [S:af-pisquare-moving-average]
- Interpolated value: a value computed between two recorded events (linear for continuous tags) [S:af-pisquare-moving-average]
- Recorded (compressed) value: an actual archived event [S:af-visualizing-pi-data]

**Open questions / Unverified (verify)**
- AFBoundaryType Inside/Outside/Interpolated semantics, and "plot values" (PlotValues with intervals returning first/last/min/max per interval). Not read.

---

### an.rollups-summaries: Summary types and rollup analyses

**Facts**
- Rollup functions are Sum, Average, Minimum, Maximum, Count and Median. [S:af-calc-asset-analytics-2022] (read) [S:af-analyzing-pi-data-2018] (read)
- A lab rollup on the Farm template uses Sum for `Expected Power Production` and `Net Production Delta`, and Average for `Average Production Efficiency`, on a 5-minute frequency. [S:af-using-af-analyze-asset-2019] (read)
- A rollup can select child attributes by Attribute Name (for example "Expected Power (Polynomial)"). [S:af-using-af-analyze-asset-2019] (read)
- Rollup outputs must be PI Points, and output history can't be turned off. [S:af-calc-asset-analytics-2022] (read) [S:af-using-af-analyze-asset-2019] (read)
- Rollups can cause recalculation cascades with late data. [S:af-optimizing-analytics-2020] (read)
- PI Data Archive summary types: Average, Count, Delta, Maximum/Minimum, Population Standard Deviation, Range, Standard Deviation, Total. [S:af-optimizing-analytics-2020] (read)
- An event frame rollup custom DR provides Sum, Average, Mean, Minimum, Maximum, Range and Count. [S:af-pisquare-ef-rollup-cdr-blog] (read)

**Open questions**
- AFSummaryTypes enum members, and the PercentGood and All types. Verify (training knowledge: Total, Average, Minimum, Maximum, Range, StdDev, PopulationStdDev, Count, PercentGood, TotalWithUOM, All, AllForNonNumeric).

---

### an.filtering-units: Filter expressions and UOM conversion in analyses

**Facts**
- Before 2018, filtered averages were built with an intermediate attribute, for example `If('BIT'=1) then 'Tag1' else NoOutput()`, then summarised. [S:af-pisquare-tagtot-condition] (read)
- From Asset Analytics 2018, array functions can do filtered calculations without an intermediate attribute. [S:af-pisquare-filter-expression] (read)
- PI DataLink filtered summaries use AF SDK filtered summaries. Two-step AF filtering gave a different result (55.689 vs 66.78 in one test), which was blamed on interpolation when the calculation is split. [S:af-pisquare-filter-expression] (read)
- Summary (non-PE) expressions convert to the output attribute's UOM when they contain no mathematical operations. Otherwise wrap the result in `Convert()`. [S:af-pisquare-tagtot-units] (read)
- Analyses have no UOM dimensional logic. AF assumes the analysis output is already in the output attribute's configured UOM. [S:af-pisquare-uom-conversion-analytics] (read)
- UOM conversion happens only between a PI Point and an AF attribute, or between two AF attributes, within the same UOM class. [S:af-pisquare-uom-conversion-analytics] (read) [S:af-pisquare-tagtot-units] (read)
- `Convert(<expression>, "kW")` is the documented lab pattern for setting an output unit. [S:af-using-af-analyze-asset-2019] (read)

**Common mistakes / pitfalls**
- Expecting an analysis that adds kg values to write correctly to a gram attribute without `Convert`. [S:af-pisquare-uom-conversion-analytics]
- Expecting TagTot to convert a per-hour rate. [S:af-pisquare-tagtot-units]

**Open questions**
- Exact Convert() semantics: does it convert from the input's UOM, or only label the value? The sources show both usages. Verify.
- Filter expression syntax in AF SDK `RecordedValues(..., filterExpression, ...)` (for example `'tag' >= 10`). Mentioned only by name. [S:af-pisquare-number-occurrences]
