# dev2: developer and integration gap-fill (DataLink functions, Integrator, PI SQL, AF SDK, scripting, piconfig)

**Summary**
- Confidence-tagged lines: about 177 (read), 5 (snippet), 2 (inferred).
- Coverage ids:
  - dev2.datalink-functions
  - dev2.integrator
  - dev2.pisql
  - dev2.afsdk
  - dev2.scripting
  - dev2.piconfig
- DataLink signatures come from the OSIsoft PI DataLink 4.1 guide (2009) and the Rockwell FactoryTalk Historian DataLink 4.2 guide, which is the same product rebranded. Modern (2019+) DataLink keeps these names; checked against 2019/2020 course workbooks.
- Biggest gaps (see Open questions):
  - Modern mode-string spellings (e.g. "average (timeweighted)")
  - Function names behind Asset Filter Search and Event search
  - RTQP `Master.Element.Value` / `ft_` functions (not found; GetSummary/GetSampledValues TVFs found instead)
  - PI SQL DAS ports
  - PIPoint.CurrentValue/InterpolatedValues overloads and GetObserverEvents
  - Whether "Backup-PIDataArchive" exists (samples use `Start-PIBackup`)
  - `piartool -fs` meaning
  - The `,t` flag in `@mode create, t`
  - Full pidiag option list
  - PIconnect's pythonnet dependency
- docs.aveva.com pages were not readable.

---

### dev2.datalink-functions: PI DataLink worksheet functions, arguments, modes

**Facts**
- PI DataLink worksheet functions by group (v4.x guide):

  | Group | Functions |
  |---|---|
  | Single value | `PICurrVal()`, `PIArcVal()`, `PIExpVal()` |
  | Multiple value | `PINCompDat()`, `PINCompFilDat()`, `PICompDat()`, `PICompFilDat()`, `PISampDat()`, `PISampFilDat()`, `PIExpDat()`, `PITimeDat()`, `PITimeExpDat()` |
  | Calculation | `PICalcVal()`, `PIAdvCalcVal()`, `PIAdvCalcFilVal()`, `PIAdvCalcExpVal()`, `PIAdvCalcExpFilVal()`, `PICalcDat()`, `PIAdvCalcDat()`, `PIAdvCalcFilDat()`, `PIAdvCalcExpDat()`, `PIAdvCalcExpFilDat()` |
  | Time filter | `PITimeFilter()`, `PITimeFilterVal()` |
  | Tag | `PIPointIDToTag()`, `PIAttributeMaskToTag()`, `PITagAtt()` |
  | Module Database | `PIAliasToTag()`, `PIPropertyToValue()` |
  | Input | `PIPutVal()` |

  [S:dev2-manualzz-datalink-toc] (read)
- Single-value syntax:
  - `PICurrVal(tagname, outcode, PIServer)`
  - `PIArcVal(tagname, timestamp, outcode, PIServer, mode)`
  - `PIExpVal(expression, timestamp, PIServer)`

  [S:dev2-datalink-ug-41] (read)
- For `PICurrVal` and `PIArcVal`, outcode is "An output code to determine results placement, either 0, 1, or 2". `mode` in PIArcVal is "The mode used to determine which values are retrieved". [S:dev2-datalink-ug-41] (read)
- Number-of-values syntax:
  - `PINCompDat(tagname, stime, numvals, outcode, PIServer, mode)`
  - `PINCompFilDat(tagname, stime, numvals, filtexp, filtcode, outcode, PIServer, mode)`

  `numvals` is "The number of desired values (negative if counting backward in time)"; `mode` is "The method of handling values at boundaries of the time range". [S:dev2-datalink-ug-41] (read)
- `PICompDat(tagname, stime, etime, outcode, PIServer, mode)` retrieves compressed (archived) values; `mode` is the boundary handling method. [S:dev2-ftdl42-p124] (read)
- In `PICompFilDat`, `filtcode` is "either 1 to return Filtered status or 0 to skip". [S:dev2-ftdl42-p126] (read)
- `PISampDat(tagname, stime, etime, interval, outcode, PIServer)` returns sampled (interpolated) values at a fixed interval. [S:dev2-ftdl42-p126] (read)
- `PISampFilDat` takes `tagname, stime, etime, interval, filtexp, filtcode, outcode, PIServer`; its outcode is 0, 1, 2 or 3. [S:dev2-ftdl42-p128] (read)
- Outcodes for sampled data: 0 = values only; 1 = values plus timestamps; 2 transposes 0 (row); 3 transposes 1. [S:dev2-ftdl42-p128] (read)
- `PIExpDat(expression, stime, etime, interval, outcode, PIServer)` samples a PI expression at an interval; outcode 0–3. [S:dev2-ftdl42-p129] (read)
- `PITimeDat(tagname, timestamps, PIServer, mode)`: `timestamps` is "A reference to an array of time stamps"; results follow the orientation of the timestamp range (column in, column out). [S:dev2-ftdl42-p130] (read)
- Timed Data modes: Interpolated (interpolates at the specified timestamps) and Exact Time (returns only values exactly matching, otherwise "No events found"). [S:dev2-datalink-ug-41] (read)
- `PICalcDat(tagname, stime, etime, interval, mode, cfactor, outcode, PIServer)` was generated only by the XP-2003 dialog; "2007 versions use PIAdvCalcDat()". [S:dev2-ftdl42-p140] (read)
- `PIAdvCalcDat(tagname, stime, etime, interval, mode, calcbasis, minpctgood, cfactor, outcode, PIServer)`. [S:dev2-ftdl42-p141] (read)
- `PIAdvCalcVal(tagname, stime, etime, mode, calcbasis, minpctgood, cfactor, outcode, PIServer)` returns one calculated value over a range (no interval). [S:dev2-ftdl42-p134] (read)
- `PIAdvCalcFilDat(tagname, stime, etime, interval, filtexp, mode, calcbasis, sampmode, sampfreq, minpctgood, cfactor, outcode, PIServer)`. [S:dev2-ftdl42-p142] (read)
- `PIAdvCalcExpFilVal(expression, stime, etime, filtexp, mode, calcbasis, sampmode, sampfreq, minpctgood, cfactor, outcode, PIServer)`. [S:dev2-ftdl42-p138] (read)
- Calculation argument meanings:
  - `calcbasis`: "The weighting method used to calculate values"
  - `sampmode`: "The sampling method used for calculation expressions"
  - `sampfreq`: "The frequency used for interpolated sampling"
  - `minpctgood`: "The minimum percentage of good data required to calculate and return a value"
  - `cfactor`: "The time unit of flow for the source tag, required for Total calculations"

  [S:dev2-ftdl42-p136] (read)
- Calculation outcodes are 0, 1, 2, 4, 5, 6 or 7 "and not 3". 4 adds percent good; 5 adds timestamps and percent good; 6 and 7 transpose 4 and 5 into rows. [S:dev2-ftdl42-p136] (read) [S:dev2-ftdl42-p141] (read)
- `PITimeFilter(expression, stime, etime, interval, timeunit, outcode, PIServer)` and `PITimeFilterVal(expression, stime, etime, timeunit, outcode, PIServer)`. `timeunit` is the "Time unit of the calculated result". [S:dev2-ftdl42-p147] (read) [S:dev2-ftdl42-p148] (read)
- Time Filtered "returns the amount of time that a performance equation evaluates to true during a specified time period". [S:dev2-datalink-basics-2019] (read)
- Outcode is a bit field in the v4.1 guide:

  | Bit | Meaning |
  |---|---|
  | 1st | Show Timestamps |
  | 2nd | Orientation (columns/row) |
  | 3rd | Show Percent Good |
  | 4th | Hide Count |
  | 5th | Show Extended Status |
  | 6th | Show Annotations |
  | 7th | Show Start Time |
  | 8th | Show End Time |
  | 9th | Show Min/Max Time |

  [S:dev2-datalink-ug-41] (read)
- Archive Value retrieval modes:
  - Previous: "retrieves the value exactly matching or preceding the specified timestamp"
  - Previous only: "retrieves the value preceding the specified timestamp"
  - Interpolated: interpolates at the time, "or follows Previous only behavior"
  - Auto: interpolates at the time, "or follows Previous behavior"
  - Next: value exactly matching or following
  - Next Only: value following
  - Exact Time: "retrieves only a value exactly matching the timestamp, or returns No events found"

  [S:dev2-datalink-ug-41] (read)
- In DataLink 2019 SP1 the Archive Value default is Auto, which "Interpolates at the exact timestamp provided, unless the data item is a step point". [S:dev2-datalink-basics-2019] (read)
- Compressed Data boundary types:
  - Inside (default): values at or just inside the start and end times
  - Outside: "Returns the closest values occurring immediately outside the range"
  - Interpolated: "Returns interpolated values at start and end times"
  - Auto: interpolated, but Inside behaviour for step tags

  [S:dev2-datalink-ug-41] (read)
- Calculation modes include Total, Average, Mean, Minimum, Maximum, Range, Standard deviation and Count. Mean is "an event-weighted version of the Average function". [S:dev2-datalink-ug-41] (read) [S:dev2-datalink-basics-2019] (read)
- "Calculations are time-weighted by default." Event-weighted gives each event equal weight and needs at least one event (two for standard deviation). [S:dev2-datalink-ug-41] (read)
- Sampling modes for filtered tag calculations:
  - Point Compressed (default): each event triggers filter evaluation
  - Expression Compressed: filter evaluated at each event of every point it references
  - Interpolated: evaluated at the Expression Sampling Frequency

  Expression calculations offer Compressed and Interpolated. [S:dev2-datalink-ug-41] (read)
- The conversion factor is used for Total calculations when the point's flow unit differs from the server default of units per day. [S:dev2-datalink-ug-41] (read)
- A blank server argument uses the default PI server. [S:dev2-datalink-ug-41] (read)
- Compressed Data options:
  - Hide count, Show time stamps, Show Value Attributes and Annotations, and Column/Row; "none of which are selected by default"
  - Swapping start and end times returns data in reverse order

  [S:dev2-datalink-basics-2019] (read)
- Asset Filter Search filters on element name, element template, element category, element description and attribute values. It takes a Root path and Attributes to display. Results can be "a function array which can update automatically, or as static values". [S:dev2-datalink-basics-2019] (read)
- Event search has two functions:
  - Explore "returns one event per row and nests child events under parent events"
  - Compare "returns one event per row but can return attributes from related events in that same row"

  [S:dev2-datalink-basics-2019] (read)
- Expressions are performance equations that "only calculate on demand". Archive Value, Sampled Data and Timed Data accept expressions. [S:dev2-datalink-basics-2019] (read)
- "Current Value is a volatile function". Press F9 to force recalculation. [S:dev2-datalink-basics-2019] (read)
- The PI DataLink Basics course used "PI DataLink 2019 SP1 Patch 1 5.5.2.0". [S:dev2-datalink-basics-2019] (read)
- In modern DataLink the first argument can be an AF data item resolved against a root path, e.g. root `\\PISRV1\OSIsoft Plant\Production Area` and data item `Production`. [S:dev2-datalink-lab-2020] (read)

**Terms**
- outcode: integer argument that controls output layout (timestamps, orientation, percent good, etc.) of a DataLink function [S:dev2-datalink-ug-41]
- retrieval mode: rule PIArcVal/PITimeDat uses to pick a value at a timestamp (Previous, Next, Interpolated, Auto, Exact Time...) [S:dev2-datalink-ug-41]
- boundary type: rule for values at the start/end of a compressed-data range (Inside, Outside, Interpolated, Auto) [S:dev2-datalink-ug-41]
- conversion factor (cfactor): multiplier for Total so rate units match the time base (1440 for per-minute rates) [S:dev2-datalink-ug-41] [S:dev2-datalink-lab-2020]
- Asset Filter Search: DataLink search returning AF elements matching name/template/category/description/attribute-value filters [S:dev2-datalink-basics-2019]

**Worked-example material**
- `=PICurrVal("sinusoid",0,)` [S:dev2-datalink-ug-41]
- `=PIArcVal("cdep158","11-dec-92 19:20",0,"casaba","interpolated")`: interpolated value at 19:20 from server casaba. [S:dev2-ftdl42-p121]
- `=PICompFilDat("cdf144","2:00","10:00","'cdep158'>38",1,1,,)`: compressed data when cdep158 > 38, "Filtered" shown where false, default server, inside boundary. [S:dev2-ftdl42-p126]
- `=PINCompFilDat("cdf144","2:00",10,"'cdep158'>38",1,1,,)` [S:dev2-ftdl42-p124]
- `=PISampFilDat("sinusoid","11-Jan-97","+3h","1h",A1,1,1,)` [S:dev2-ftdl42-p128]
- `=PIExpDat("sqr('sinusoid')","y","t","1h",1,"thevax")` [S:dev2-ftdl42-p130]
- `=PICalcVal("cdf144","y","t","total",1440,4,)`: time-weighted total ×1440 with percent good. [S:dev2-ftdl42-p134]
- `=PICalcDat(b1,"y","t","3h","total",24,1,)` [S:dev2-ftdl42-p141]
- `=PIAdvCalcFilVal("cdf144","y","t","'cdm158'=""Manual""","total","time-weighted","pt. compressed","10m",50,1,4,)` [S:dev2-ftdl42-p136]
- `=PIAdvCalcExpVal("'cdf144'+'cdt158'","y","t","total","time-weighted","compressed","10m",50,1,4,)` [S:dev2-ftdl42-p138]
- `=PITimeFilter($A$1,"y","t","1h","seconds",1,"thevax")` [S:dev2-ftdl42-p148]
- Modern lab formula: `=PIAdvCalcVal('Raw Data'!$B2,'Raw Data'!C$1,'Raw Data'!D$1,"average (timeweighted)","time-weighted",0,1,0,"")` [S:dev2-datalink-lab-2020]
- VBA: `Application.Run("PICompDat", piTag, startTime, endTime, 9, "", "inside")`, `Application.Run("PISampDat", piTag, startTime, endTime, sampleTime, 1, "")`, `Application.Run("PIArcVal", piTag, startTime, 0, "", "auto")` [S:dev2-gh-osipidl-vba]

**Common mistakes / pitfalls**
- Filter expressions beginning with a point name or timestamp need doubled single quotes, or wrapping in parentheses, because Excel treats a leading `'` as a text prefix. [S:dev2-datalink-basics-2019] (read)
- If more values return than the array holds, DataLink shows "Resize to show all values". Right-click > Recalculate (Resize) Function. [S:dev2-datalink-basics-2019] (read)
- Check percent good before trusting a calculated result. [S:dev2-datalink-basics-2019] (read)
- Outcode 3 is invalid for calculation and time-filter functions. [S:dev2-ftdl42-p136] (read)
- Only a single time offset is allowed in an expression time. [S:dev2-datalink-basics-2019] (read)

**Open questions**
- Exact mode strings for current versions: e.g. whether PIAdvCalcVal mode is `"average"` or `"average (timeweighted)"`. The 2020 lab shows the latter, older guides the former (verify).
- Function names behind Asset Filter Search and Explore/Compare Events: not read; docs.aveva.com pages exist but are not readable.
- Full v4.1 outcode bit-to-decimal mapping (e.g. why outcode 9 = timestamps + hide count?) inferred only (verify).
- PITimeFilter time unit values beyond "seconds" (minutes, hours, days?) not read.

---

### dev2.integrator: PI Integrator for Business Analytics

**Facts**
- PI Integrator "reads data from PI Asset Framework and writes the data to a variety of 3rd-party platforms", which are called Targets. [S:dev2-integrator-bi-course-2020r2] (read)
- View types:
  - Asset View is "based on Elements and Element Templates"
  - Event View is "based on Event Frames and Event Frame Templates"
  - Streaming View is "for publish targets that support streaming such as" Apache Kafka, Azure Event Hub and Azure IoT Hub

  [S:dev2-integrator-bi-course-2020r2] (read)
- A view is built from a Shape created in the Shape Builder. Shape elements are matched by template, optionally including derived templates, and can be filtered and matched by asset name or template. [S:dev2-integrator-bi-course-2020r2] (read)
- Asset view columns come from asset attributes. Event view columns come from event frame attributes. [S:dev2-integrator-bi-course-2020r2] (read)
- A view has Start and End Time and an interval set through "Edit Value Mode" (e.g. a 1-hour step). It produces a TimeStamp column. Optional time columns include Month, Month Name, Week of the Year and Hour. [S:dev2-integrator-bi-course-2020r2] (read)
- Publish options include Run Once, scheduled runs (e.g. hourly), and Streaming Views for real-time publishing. [S:dev2-integrator-bi-course-2020r2] (read)
- "In short, Advanced Edition supports streaming views while Standard Edition does not." [S:dev2-integrator-bi-course-2020r2] (read)
- Editions in 2018:
  - Standard Edition 2018: scheduled bulk data updates
  - Advanced Edition 2018: new; a superset of Standard that adds "Continuously streaming data"

  [S:dev2-integrators-uc18eu] (read)
- 2018 targets:
  - Standard: SQL Server, Azure SQL Data Warehouse, Oracle RDBMS, Azure SQL Database, Apache Hive, Hadoop HDFS, Azure Data Lake Store, flat files and ODBC
  - Advanced adds Apache Kafka, Azure IoT Hub and Azure Event Hubs

  [S:dev2-integrators-uc18eu] (read)
- Advanced Edition 2018 features:
  - attribute-value-pair or raw "package" transmission
  - Confluent Avro Schema Registry support with Kafka
  - streaming updated PI data when a new snapshot arrives

  [S:dev2-integrators-uc18eu] (read)
- 2020 R2 course target list:
  - Amazon: Kinesis Data Streams, Redshift, S3
  - Apache: Hive, Kafka
  - Azure: Data Lake Storage Gen 1, Event Hubs, IoT Hub, SQL Database, SQL Data Warehouse
  - Google: BigQuery, Cloud Storage, Cloud Pub/Sub
  - Other: HDFS, Microsoft SQL Server, Oracle, SAP HANA ODBC, Text file, PI View

  [S:dev2-integrator-bi-course-2020r2] (read)
- 2018 R2 (Q4 2018 roadmap) was to add Amazon Web Services support. [S:dev2-integrators-uc18eu] (read)
- In 2015 the product had three editions:
  - Business Intelligence Edition ("Access decision-ready data via ODBC", via PI Views)
  - Data Warehouse Edition
  - SAP HANA Edition

  [S:dev2-integrator-knox-2015] (read)
- 2015 native connections: Microsoft SQL Server and flat file (released), SAP HANA (Q4 2015), Oracle RDBMS 11/12 (Q2 2016), Hadoop HDFS and Hive (Q2 2016). [S:dev2-integrator-knox-2015] (read)
- The processing pipeline is Cleanse ("data quality"), Augment ("model normalization"), Shape ("data compatibility", "data aggregation"), Transmit (push to targets). [S:dev2-integrator-knox-2015] (read)
- Licensing is by stream count. A stream is a unique PI tag used in a view, counted once across views. "Publishing static attributes does not consume streams." [S:dev2-integrator-bi-course-2020r2] (read)
- Removing a view clears its buffered data, but "this does not free up the available output streams allowed with your license". [S:dev2-integrator-bi-course-2020r2] (read)
- Backend SQL databases are PIIntegratorDB, PIIntegratorLogs and PIIntegratorStats. In the course, the web UI was at `https://pisrv01.pischool.int:444`. [S:dev2-integrator-bi-course-2020r2] (read)
- PI tags cannot be used directly. They must first be mapped as AF attributes. [S:dev2-integrator-bi-course-2020r2] (read)
- PI Integrator for Microsoft Azure 2016 was repackaged into PI Integrator for BA 2018. [S:dev2-integrators-uc18eu] (read)
- PI Integrator for Esri ArcGIS 2017 SP1 added:
  - time-enabled maps
  - augmented feature layers
  - automatic detection of new AF assets
  - Integrated Windows Authentication

  [S:dev2-integrators-uc18eu] (read)
- SAP HANA IoT Integrator by OSIsoft (2017) offered HANA ODBC, HANA SDS and HANA SDI transfer methods. [S:dev2-integrators-uc18eu] (read)

**Terms**
- Shape: reusable template-based pattern of AF elements and attributes that defines a view's structure [S:dev2-integrator-bi-course-2020r2]
- Asset View / Event View / Streaming View: Integrator views over elements, event frames, or streamed real-time data [S:dev2-integrator-bi-course-2020r2]
- Stream (Integrator licensing): a unique PI tag used in any view [S:dev2-integrator-bi-course-2020r2]
- PI View: Integrator target exposing the view for ODBC/SQL query; dev/test only and deprecated [S:dev2-integrator-bi-course-2020r2]

**Worked-example material**
- Course flow:
  1. Build an asset shape on mixing-tank templates.
  2. Asset view: 1-hour interval, Month and Hour columns.
  3. Publish Run Once to SQL Server.
  4. Import into Power BI.

  [S:dev2-integrator-bi-course-2020r2] (inferred)
- Event view tip: set Event Frame Duration unit to Second, otherwise "it will be displayed as a round number of hours". [S:dev2-integrator-bi-course-2020r2] (read)

**Common mistakes / pitfalls**
- PI View "should not be used if a Microsoft SQL Server target is available". PI Views are deprecated due to a security vulnerability. [S:dev2-integrator-bi-course-2020r2] (read)
- Previews may be incomplete (e.g. missing units). [S:dev2-integrator-bi-course-2020r2] (read)
- Power BI is not a direct target. Load from SQL Server or another target. [S:dev2-integrator-bi-course-2020r2] (read)

**Open questions**
- Current (2023+) target list and whether PI Integrator is in maintenance or superseded by CONNECT data services (verify).
- Key columns, value mapping, backfill options in the view publish settings not read.

---

### dev2.pisql: PI SQL Client, RTQP, PI OLEDB Provider, PI OLEDB Enterprise, PI JDBC, PI SQL DAS

**Facts**
- RTQP "Connection = AF Database": the data model is an entity-relationship model where each connection targets one AF database. [S:dev2-bachmann-pisql-2019] (read) [S:dev2-pisql-migrate-lab-2020] (read)
- The architecture labels "PI SQL DAS (RTQP Engine)" as middleware connected to SQL Server and the AF Server. [S:dev2-bachmann-pisql-2019] (read)
- PI SQL Client drivers:
  - OLE DB
  - ODBC v3
  - JDBC v4.0, v4.1 and v4.2, "Https only" and "Pure Java"

  [S:dev2-bachmann-pisql-2019] (read)
- PI SQL Client 2018 R2 added ODBC and JDBC and removed the AF SDK dependency. The first release, 2018, contained only OLE DB. [S:dev2-bachmann-pisql-2019] (read) [S:dev2-pisql-migrate-lab-2020] (read)
- The only built-in RTQP catalog is `Master`. Tables include `Master.Element.Element`, `Master.Element.Attribute` and `Master.EventFrame.EventFrame`. [S:dev2-pisql-migrate-lab-2020] (read)
- `Master.Element.Attribute` exposes the attribute's current value via columns `ValueTimeStamp` and `Value`. RTQP has no separate Snapshot table. [S:dev2-bachmann-pisql-2019] (read) [S:dev2-pisql-migrate-lab-2020] (read)
- Template-based table-valued functions (new in RTQP), such as `[Master].[Element].[GetSummary]` and `GetSampledValues`, take the element template name (e.g. `'Wind Farm'`) as the first argument plus attribute names. They are invoked with `CROSS APPLY`. [S:dev2-pisql-migrate-lab-2020] (read)
- RTQP helper functions include `ParentName(path, level)`, `Double(timespan, second)`, `Format`, `List` (aggregate) and `Split` (table-valued). [S:dev2-pisql-migrate-lab-2020] (read)
- Migration rules from PI OLEDB Enterprise:
  - Use `PrimaryPath` and `Template` columns directly instead of joining `ElementHierarchy` and `ElementTemplate`.
  - Subqueries are supported only in FROM.
  - `OPTION (FORCE ORDER)` is not supported.
  - Named parameters are not supported; use positional `?`.
  - Event frame versioning was dropped; Query Date (Latest, Now, or a timestamp) still applies.

  [S:dev2-pisql-migrate-lab-2020] (read)
- PI SQL Client connection strings:
  - OLE DB: `Provider=PISQLClient.1;Data Source=PISRV01\WindFarm;Integrated Security=SSPI`
  - ODBC: `DRIVER=PI SQL Client;Integrated Security=SSPI;AF Server=PISRV01;AF Database=WindFarm`

  [S:dev2-pisql-migrate-lab-2020] (read)
- PI SQL Commander Lite connects to RTQP and PI OLEDB Enterprise. It provides model browsing, a Query Compendium, a wizard for template-specific catalogs, and SQL generation for TVF templates. [S:dev2-pisql-migrate-lab-2020] (read)
- In 2019, Data Archive (PI tag) tables in RTQP were listed under "Future", along with INSERT/UPDATE/DELETE for event frames, tags and attribute values. [S:dev2-bachmann-pisql-2019] (read)
- A 2022 PI Square feedback idea, "Be able to use RTQP to access PI Points and Config strings (DA Directly)", has "No status". Commenters say "PI OLEDB Provider is, unfortunately, their best way to query PI Data Archive data programmatically" without AF. [S:dev2-feedback-rtqp-pipoints] (read)
- An idea to add element reference type to RTQP tables (available in OLEDB Enterprise) was "Declined" on 23 Aug 2022. [S:dev2-feedback-rtqp-elemref] (read)
- PI OLEDB Provider catalogs:
  - "piarchive contains archive related tables"
  - "pipoint contains tag configuration tables (one per point class)"
  - "pids contains PI digital state tables"
  - "piuser contains user database tables"

  [S:dev2-pioledb-basics] (read)
- PI OLEDB tables seen in sources:
  - `piarchive..picomp2`: compressed/archived values
  - `piarchive..piinterp` / `piinterp2`: interpolated values at a timestep
  - `piarchive..piavg`, `pitotal`, `pimin`, `pimax`: aggregates
  - `piarchive..pisnapshot`: snapshot
  - `pipoint..classic`, `pipoint..pipoint2`: point configuration

  [S:dev2-pioledb-basics] (read) [S:dev2-opssys-pioledb] (read) [S:dev2-pisquare-pipoint-table] (read)
- The PI OLEDB manual calls piinterp2 "its newer implementation ... (recommended)" compared with piinterp. [S:dev2-opssys-pioledb] (read)
- `piarchive..piavg` returns time-weighted averages by default. For event-weighted, query `pimean` or add `calcbasis = 'EventWeighted'`. [S:dev2-pisquare-sql-datalink] (read)
- "PICalcVal function is deprecated and PIAdvCalcVal is its successor." [S:dev2-pisquare-sql-datalink] (read)
- For AF data, use PI SQL Client and its GetSummary/GetSummaries table-valued functions. PI OLEDB Provider is for PI point data. [S:dev2-pisquare-sql-datalink] (read)
- An OSIsoft staff answer says pipoint2 is recommended over pipoint "unless an application needs backward compatibility". [S:dev2-pisquare-pipoint-table] (read)
- The same answer says picomp2 "is not an indexed version of picomp"; it stores values as variants instead of separate float and string columns. [S:dev2-pisquare-pipoint-table] (read)
- Querying `piinterp` returns interpolated values starting at the query time at a timestep (default 1h). This produced odd timestamps (xx:09:51). `picomp2` returns archived events with their real timestamps. [S:dev2-pisquare-interp-vs-comp] (read)
- "PI JDBC Driver is a JDBC 4.0 compliant driver". "PI SQL Data Access Server is required for PI JDBC Driver". It supports PI Data Archive, PI AF Server and PI Integrator for Business Analytics. [S:dev2-techsupport-pijdbc] (read)
- PI JDBC driver details:
  - class `com.osisoft.jdbc.Driver`
  - URL `jdbc:pisql://<das_node>/Data Source=<pi_server_name>; Integrated Security=SSPI;`
  - jar `PIJDBCDriver.jar` under `PIPC\JDBC`
  - legacy setups also needed PI OLEDB Enterprise on the DAS

  [S:dev2-ignition-pijdbc] (read)

**Terms**
- RTQP (Real-Time Query Processor) engine: PI SQL DAS engine on the AF server that exposes one AF database as the `Master` catalog to PI SQL Client [S:dev2-bachmann-pisql-2019]
- PI SQL DAS (Data Access Server): gateway service that runs SQL queries for PI JDBC/PI SQL Client over HTTPS or net.tcp [S:dev2-techsupport-pijdbc]
- picomp2: PI OLEDB Provider table of archived (compressed) events [S:dev2-pioledb-basics]
- piinterp2: PI OLEDB Provider table of interpolated values at a timestep [S:dev2-opssys-pioledb]
- pipoint..classic: point-configuration table for classic point-class attributes [S:dev2-pioledb-basics]

**Worked-example material**
- PI OLEDB Provider queries [S:dev2-pioledb-basics]:
  ```sql
  SELECT time,value FROM piarchive..piinterp WHERE tag = 'ba:level.1' AND time BETWEEN '*-1d' AND '*' AND value > 0
  SELECT COUNT(*) FROM piarchive..picomp2 WHERE tag = 'sinusoid' AND time >= BOM('*')
  SELECT time, value, annotations FROM piarchive..picomp2 WHERE tag = 'mytag' AND time >= 't' AND annotated = TRUE
  SELECT tag, descriptor, creationdate FROM pipoint..classic WHERE pointsource = 'R' OR pointsource = '9'
  INSERT piarchive..picomp2 (tag, time, value, status) VALUES ('somePIPoint', 'y+8h', 12.5, 0)
  ```
- 15-minute averages [S:dev2-pisquare-sql-datalink]:
  ```sql
  SELECT * FROM [piarchive]..[piavg]
  WHERE tag = 'tagname' AND time BETWEEN '*-1h' AND '*' AND timestep = '15m' AND pctgood >= 100
  ```
- Interpolated first value [S:dev2-opssys-pioledb]:
  ```sql
  SELECT TOP 1 time,value FROM piarchive..piinterp2 WHERE Tag = 'SOURCETAG'
  ```
- RTQP query [S:dev2-bachmann-pisql-2019]:
  ```sql
  SELECT e.PrimaryPath + e.Name, e.Template FROM Master.Element.Element e WHERE e.Template IN ('Boiler', 'Heater')
  ```
- RTQP lab structure [S:dev2-pisql-migrate-lab-2020] (read):
  - `Master.Element.Element e JOIN Master.EventFrame.EventFrame ef ON e.ID = ef.PrimaryReferencedElementID`
  - `CROSS APPLY [Master].[Element].[GetSummary]('Wind Farm', ...)(e.ID, ef.StartTime, ef.EndTime) s`
  - Filters: `e.PrimaryPath LIKE '\West%' AND e.Template = 'Wind Farm' AND e.Name = ?`
- JDBC test queries [S:dev2-ignition-pijdbc]:
  ```sql
  SELECT * FROM [pisystem].[piproductversion]
  SELECT TOP 10 tag, time, cast(value as Float32) FROM piarchive..picomp2 WHERE tag = 'sinusoid'
  ```

**Common mistakes / pitfalls**
- Using piinterp when archived values were wanted gives interpolated values on a timestep aligned to query time. Use picomp2. [S:dev2-pisquare-interp-vs-comp] (read)
- picomp2 values are variants. Some clients (e.g. Ignition charts) fail unless you `cast(value as Float32)`. [S:dev2-ignition-pijdbc] (read)
- Through a SQL Server Linked Server, PI time strings can raise "Conversion failed when converting date and/or time from character string". OPENQUERY worked around it. [S:dev2-pisquare-sql-datalink] (read)
- Selecting snapshot Value columns in RTQP when not needed greatly increases execution time. [S:dev2-pisql-migrate-lab-2020] (read)
- `pipoint..classic` only returns classic point-class attributes. Use `pipoint2` to get all tags. [S:dev2-pisquare-pipoint-table] (read)

**Open questions**
- `Master.Element.Value` table and `ft_`-prefixed function names were not found in any readable source. The lab shows `GetSummary`/`GetSampledValues` instead. Treat `Master.Element.ft_...` as unverified.
- Whether newer RTQP releases (2021+) expose PI points directly is unconfirmed. The 2022 feedback suggests not (verify).
- PI SQL DAS default ports (5461/5462/5465?) not read.
- Required WHERE restrictions and default time range for picomp2 not read.

---

### dev2.afsdk: AF SDK (PIServers, PIPoint, PIPointList, data pipes, AFSearch, CheckIn)

**Facts**
- AVEVA's AF SDK Getting Started Guide (repo `AVEVA/AF-SDK-Getting-Started-Guide`, formerly under `osisoft`) is version 1.1.2, written against AF 2.10. It has five exercises:
  - Ex1 Connection and Hierarchy Basics
  - Ex2 Searching for Assets
  - Ex3 Reading and Writing Data
  - Ex4 Building an AF Hierarchy
  - Ex5 Working with Event Frames

  [S:dev2-gh-afsdk-gsg] (read)
- The guide needs a "Green Power Company" AF database imported from `AF Database - Green Power Company.xml` (create PI points on import, enable analyses). Tests run with `dotnet test`. [S:dev2-gh-afsdk-gsg] (read)
- Connect to AF:
  - `PISystems systems = new PISystems();`
  - `systems[serverName]` or `systems.DefaultPISystem`
  - then `assetServer.Databases[databaseName]` or `.Databases.DefaultDatabase`

  [S:dev2-gh-afsdk-ex3] (read)
- Find an attribute by path: `AFAttribute.FindAttribute(@"\Meters\" + meterName + @"|Energy Usage", database)`. `|` separates element path from attribute name. [S:dev2-gh-afsdk-ex3] (read)
- Recorded values on an attribute: `attr.Data.RecordedValues(timeRange, AFBoundaryType.Inside, desiredUOM, filterExpression: null, includeFilteredValues: false)`. The sample's desired UOM is `UOMs["kilojoule"]`. [S:dev2-gh-afsdk-ex3] (read)
- `attr.Data.InterpolatedValues(timeRange, interval: new AFTimeSpan(timeSpan), desiredUOM: null, filterExpression: null, includeFilteredValues: false)` returns evenly spaced interpolated values. [S:dev2-gh-afsdk-ex3] (read)
- Hourly averages call `attr.Data.Summaries(timeRange, summaryDuration: new AFTimeSpan(TimeSpan.FromHours(1)), AFSummaryTypes.Average, AFCalculationBasis.TimeWeighted, AFTimestampCalculation.EarliestTime)`. It returns `IDictionary<AFSummaryTypes, AFValues>`. [S:dev2-gh-afsdk-ex3] (read)
- Bulk reads on an `AFAttributeList`:
  - `attrList.Data.RecordedValue(time)` gets one value per attribute at a time.
  - `attrList.Data.Summaries(..., pagingConfig)` gets summaries, with `new PIPagingConfiguration(PIPageType.TagCount, 100)`.

  [S:dev2-gh-afsdk-ex3] (read)
- Bulk writes and deletes use `AFListData.UpdateValues(values, AFUpdateOption.Remove)` and `AFListData.UpdateValues(values, AFUpdateOption.Insert)`. [S:dev2-gh-afsdk-ex3] (read)
- Building the hierarchy:
  - `database.Elements.Add("Feeders")`
  - `database.ElementTemplates.Add(templateName)`
  - `feederTemplate.AttributeTemplates.Add("City")`
  - `power.DataReferencePlugIn = database.PISystem.DataReferencePlugIns["PI Point"]`
  - `feeders.Elements.Add("Feeder001", template)`
  - `london.Elements.Add(feeder0001, weakRefType)` adds a weak reference

  [S:dev2-gh-afsdk-ex4] (read)
- PI Point data reference config string example: `power.ConfigString = @"%@\Configuration|PIDataArchiveName%\SINUSOID";`. It substitutes an attribute value for the server. [S:dev2-gh-afsdk-ex4] (read)
- Changes are persisted with `database.CheckIn()`. The sample guards with `if (database.IsDirty) database.CheckIn();`. [S:dev2-gh-afsdk-ex4] (read) [S:dev2-gh-afsdk-ex5] (read)
- Event frames:
  - An event frame template is an element template with `InstanceType = typeof(AFEventFrame)`.
  - Create one with `new AFEventFrame(database, "*", eventFrameTemplate)`, then `SetStartTime`, `SetEndTime`, `PrimaryReferencedElement = meter`, and `CheckIn()`.

  [S:dev2-gh-afsdk-ex5] (read)
- `AFDataReference.GetPIPointDataReference()` returns the PI Point data reference plug-in. [S:dev2-gh-afsdk-ex5] (read)
- Event frame searches:
  - `new AFEventFrameSearch(database, "EventFrame Captures", AFEventFrameSearchMode.ForwardFromStartTime, startTime, queryString)`
  - `new AFEventFrameSearch(database, name, AFSearchMode.StartInclusive, startTime, endTime, queryString)`
  - `item.CaptureValues()` captures attribute values

  [S:dev2-gh-afsdk-ex5] (read)
- Element search: `new AFElementSearch(database, "Meters", "Template:MeterBasic")`. Iterate with `FindObjects()`. Set `elementQuery.CacheTimeout = TimeSpan.FromMinutes(5)` to cache results. [S:dev2-gh-afsdk-ex5] (read) [S:dev2-gh-afsdk-ex3] (read)
- Query strings may quote values: `template:"MeterBasic"` (built with `string.Format("template:\"{0}\"", templateName)`) and `Template:'Antimatter Relay' Name:T001` both appear in samples. [S:dev2-gh-afsdk-ex3] (read) [S:dev2-gh-lonnie-afsearch] (read)
- AF SDK 2.9.5 added nested queries. Example: `Element:{Name:'Boiler*'} Name:'Feed Rate'` finds Feed Rate attributes on elements named Boiler*. Both AF client and server must support `PISystemFeatures.QuerySearchAttribute`. [S:dev2-pisquare-afsearch-nested] (read)
- In an attribute search, `Name:'Feed Rate'` matches the attribute name. `'|Feed Rate'` would be a relative path. [S:dev2-pisquare-afsearch-nested] (read)
- "Looks like a nested query cannot contain its own nested query." For example, `Element:{ ... Parent:{...} }` inside AFAttributeSearch failed. [S:dev2-pisquare-afsearch-nested] (read)
- PI point access:
  - `new PIServers().DefaultPIServer`
  - `PIPoint.FindPIPoints(dataArchive, tagNames, attributeNames)`
  - `dataArchive.CreatePIPoints(definitions)`

  [S:dev2-gh-afsdk-course-ex5] (read)
- Snapshot data pipe:
  1. `new PIDataPipe(AFDataPipeType.Snapshot)`
  2. `pipe.AddSignups(points)`
  3. `pipe.GetUpdateEvents(1000)` returns `AFListResults<PIPoint, AFDataPipeEvent>`
  4. `pipe.Close()`, then `pipe.Dispose()`

  [S:dev2-gh-afsdk-course-ex5] (read)
- Common single-point patterns:
  - `PIPoint.FindPIPoint(server, tagname)`
  - `point.RecordedValues(timeRange, AFBoundaryType.Inside, null, false, 0)`, with args `(timeRange, boundaryType, filterExpression, includeFilteredValues, maxCount)`

  [S:dev2-gh-gewebber-afsdk] (read) [S:dev2-gh-seeq-pitools] (read)
- PIPointList bulk call: `points.RecordedValues(timeRange, boundaryType, filterExpression, includeFilteredValues, pagingConfig, maxCount)` with `new PIPagingConfiguration(PIPageType.TagCount, pageSize)`. Results are enumerated per point as `AFValues`. [S:dev2-gh-lewiston-afsdk] (read)
- Data pipe types:
  - Snapshot events may never reach the archive because of compression, but suit live trends.
  - Archive pipes report values late.
  - TimeSeries suits future data and RangeDelete notifications.

  [S:dev2-pisquare-datapipe-types] (read)
- Per a PI Square post quoting the docs, AFDataPipe and AFDataCache read PI-point-backed attributes "using a TimeSeries" pipe. AFDataPipeType selection is only available on PIDataPipe. [S:dev2-pisquare-afdatapipe-dups] (read)

**Terms**
- PISystems / PISystem: AF SDK collection of known AF servers / one AF server [S:dev2-gh-afsdk-ex3]
- PIServers / PIServer: AF SDK collection of PI Data Archives / one Data Archive [S:dev2-gh-afsdk-course-ex5]
- PIPagingConfiguration: paging setting for bulk list calls (e.g. `PIPageType.TagCount`, 100) [S:dev2-gh-afsdk-ex3]
- PIDataPipe: sign-up mechanism for snapshot/archive/time-series update events on PI points [S:dev2-gh-afsdk-course-ex5]
- CheckIn: commits pending AF object changes to the AF server [S:dev2-gh-afsdk-ex4]
- AFSearch query string: token syntax like `Template:'Pump' Name:'P*'` used by AFElementSearch/AFEventFrameSearch/AFAttributeSearch [S:dev2-gh-lonnie-afsearch]

**Worked-example material**
```csharp
var db = new PISystems().DefaultPISystem.Databases["Green Power Company"];
using (var q = new AFElementSearch(db, "Meters", "Template:MeterBasic")) {
    q.CacheTimeout = TimeSpan.FromMinutes(5);
    foreach (AFElement m in q.FindObjects()) { /* ... */ }
}
var tr = new AFTimeRange(new AFTime("*-30s"), new AFTime("*"));
AFValues v = attr.Data.RecordedValues(tr, AFBoundaryType.Inside, null, null, false);
```
Reconstructed from [S:dev2-gh-afsdk-ex3] and [S:dev2-gh-afsdk-ex5] (inferred; the argument order follows the named arguments in the sample).

**Common mistakes / pitfalls**
- Braces in C# interpolated query strings must be doubled: `$"Element:{{Name:'{elemName}'}}"`. [S:dev2-pisquare-afsearch-nested] (read)
- A user writing about AF SDK 2.9.x said AFSearch had no OR operator ("I know that I cannot use an OR operation"). [S:dev2-pisquare-afsearch-nested] (read)
- The sample's value swap is "not safe against failure". Persist data before running delete-then-insert operations. [S:dev2-gh-afsdk-ex3] (read)
- Forgetting `CheckIn()` leaves changes local and uncommitted. [S:dev2-gh-afsdk-ex4] (inferred)
- AFDataPipe users have reported duplicate events with the same timestamp and value. The question was unanswered. [S:dev2-pisquare-afdatapipe-dups] (read)

**Open questions**
- `PIPoint.CurrentValue()`, `PIPoint.InterpolatedValues(timeRange, interval, filterExpression, includeFilteredValues)` exact overloads are not read in an official sample (verify).
- `GetObserverEvents` (IObserver pattern) and `AFDataPipeAction` values (Add, Update, Delete, ...) are not read.
- PIPagingConfiguration `.Error` property and `OperationTimeoutOverride` are not read.

---

### dev2.scripting: PIconnect (Python) and PowerShell Tools for the PI System

**Facts**
- PIconnect is "A python connector to the OSISoft PI and PI-AF databases" that "allows access to the OSISoft PI System through their proprietary SDK". It is MIT-licensed. The latest release seen was v0.12.4 (24 Mar 2025). [S:dev2-gh-piconnect] (read)
- Install with `conda install PIconnect` (preferred) or `pip install PIconnect`. [S:dev2-piconnect-install] (read)
- Connect with `import PIconnect as PI` and `with PI.PIServer() as server:`. By default it connects "to the default server, as reported by the SDK". [S:dev2-piconnect-piserver] (read)
- `PI.PIServer.servers` lists known servers. If a named server is not found, "a warning is raised" and the default server is returned. [S:dev2-piconnect-piserver] (read)
- `server.search('*')` returns PI points. `points[0].recorded_values('*-48h', '*')` returns "essentially a decorated version of a pandas.Series". [S:dev2-piconnect-piserver] (read)
- API signatures:
  - `PIServer(server=None, username=None, password=None, domain=None, authentication_mode=AuthenticationMode.PI_USER_AUTHENTICATION, timeout=None)`
  - `PIPoint.recorded_values(start_time, end_time, boundary_type='inside', filter_expression='')`
  - `PIPoint.interpolated_values(start_time, end_time, interval, filter_expression='')`
  - `PIPoint.summary(start_time, end_time, summary_types, calculation_basis=CalculationBasis.TIME_WEIGHTED, time_type=TimestampCalculation.AUTO)`
  - `PIPoint.summaries(start_time, end_time, interval, summary_types, ...)`
  - `PIPoint.update_value(value, time=None, update_mode=UpdateMode.NO_REPLACE, buffer_mode=BufferMode.BUFFER_IF_POSSIBLE)`
  - property `current_value`

  [S:dev2-piconnect-api-pi] (read)
- PIconnect's time arguments are parsed with AF SDK time parsing (AFTime, AFTimeRange, AFTimeSpan.Parse). [S:dev2-piconnect-api-pi] (read)
- recorded_values options:
  - `boundary_type` accepts `BoundaryType.OUTSIDE` or `BoundaryType.INTERPOLATED`; the default returns "only the data strictly between the start_time and end_time"
  - `filter_expression="'%tag%' > 100 and '%tag%' < 115"`, where `%tag%` is replaced with the tag name

  [S:dev2-piconnect-recorded] (read)
- `point.recorded_value('-5m', retrieval_mode=RetrievalMode.AT_OR_BEFORE)` returns a single recorded value. [S:dev2-piconnect-recorded] (read)
- In the develop docs, AF access is `with PI.AFDatabase(server="ServerName", database="DatabaseName") as database:`. `database.descendant(r"Plant1\Outlet")` navigates the hierarchy with single backslashes. [S:dev2-piconnect-af] (read)
- `update_value` wraps the AF SDK UpdateValue. Example: `point.update_value(1.0, datetime.now(), UpdateMode.NO_REPLACE, BufferMode.BUFFER_IF_POSSIBLE)`. [S:dev2-piconnect-update] (read)
- PowerShell Tools for the PI System:
  - shipped with PI System Management Tools 2015 (3.5.1.7)
  - require Windows PowerShell 4.0
  - module `OSIsoft.PowerShell` under `%pihome%\OSIsoft.PowerShell`
  - auto-imported on first use (no `Add-PSSnapin` needed)

  [S:dev2-pisquare-pstools-blog] (read)
- List cmdlets with `Get-Command -Module OSIsoft.PowerShell`. `Get-Command -Noun *value* -Module OSIsoft.PowerShell` returns Add-PIValue, Get-PIValue and Remove-PIValue. [S:dev2-pisquare-pstools-blog] (read)
- `$myPI = Connect-PIDataArchive -PIDataArchiveMachineName DNG-PI2012`. `$myPI.Connected` should be true. [S:dev2-pisquare-pstools-blog] (read)
- Other Connect-PIDataArchive forms seen:
  - `-AuthenticationMethod Windows`
  - `-WindowsCredential $Credential -OperationTimeout ...`
  - `-PIDataArchiveConnectionConfiguration (Get-PIDataArchiveConnectionConfiguration -Name $PIServerName)`

  [S:dev2-gh-aveva-ps-verify] (read) [S:dev2-gh-ps-movearchives] (read)
- Get-PIValue usage:
  - `Get-PIValue -PointName sinusoid -Connection $myPI -Time ([DateTime]::Now)`
  - `Get-PIValue -PointName sinusoid -Connection $myPI -StartTime "19-Jul-2015 8:00:00" -EndTime "19-Jul-2015 17:00:00"`
  - Timestamps display in UTC.

  [S:dev2-pisquare-pstools-blog] (read)
- `Add-PIValue -PointName TestTag -Value 10 -Connection $myPI` appends by default unless `-WriteMode` is given. [S:dev2-pisquare-pstools-blog] (read)
- As of Aug 2015, PI relative times such as `*` could not be used, and Add-PIValue writes could not be buffered. [S:dev2-pisquare-pstools-blog] (read)
- AF cmdlets were not in the first (SMT 2015) release. AF Server support came in SMT 2015 R2. [S:dev2-pisquare-pstools-blog] (read)
- Get-PIPoint usage:
  - `Get-PIPoint -Name $TagName -Connection $con`
  - `Get-PIPoint -Connection $con -Name "*" -Attributes $AttribList`
  - `Get-PIPoint -ID $PointId -Attributes pointtype -Connection $Con`
  - `Get-PIPoint -Name $point -AllAttributes -Connection $con`

  [S:dev2-gh-aveva-ps-verify] (read) [S:dev2-gh-castagne-ps] (snippet)
- `Get-PIValue -PointId $PointId -Connection $Con -StartTime ... -Count n` reads a count of values from a start time. [S:dev2-gh-aveva-ps-verify] (read)
- Set-PIPoint example: `Set-PIPoint -Name TestTag -Connection $myPI -Attributes @{ptsecurity="piadmin: A(r,w) | piadmins: A(r,w)"}`. [S:dev2-pisquare-pstools-blog] (read)
- Archive management cmdlets:
  - `Get-PIArchiveFileInfo -Connection $connection [-ArchiveSet 0]`
  - `Unregister-PIArchive -Name <path> -Connection $connection`
  - `Register-PIArchive -Name <path> -Connection $connection`

  [S:dev2-gh-ps-movearchives] (read)
- Get-PIArchiveFileInfo returns properties including Index, StartTime, EndTime, PercentFull, IsCorrupt, Path, LastBackupTime, ArchiveSet, TotalEvents, Type, State, IsWriteable and IsShiftable. [S:dev2-gh-wolfvictor-upgradeinfo] (snippet)
- The backup cmdlet in OSIsoft samples is `Start-PIBackup -BackupLocation $BackupDirectory -Connection $connection`, not "Backup-PIDataArchive". Progress is polled with `Get-PIBackupState`, using `$state.IsInProgress` and `$state.BackupProgress.OverallPercentComplete`. [S:dev2-gh-ps-backup] (read)
- Start-PIBackup supports `-Exclude`, e.g. `-Exclude pimsgss, SettingsAndTimeoutParameters` in the collective-manager sample. [S:dev2-gh-ps-collective] (snippet)
- The docs list cmdlet classes `StartPIBackup`, `NewPIBackupRestoreFile`, `GetPIBackupReport`, `GetPILicenseReport` and `AddPIValue` in PowerShell Tools 2.2.3/3.1.1 help. [S:dev2-docs-ps-startpibackup] (snippet)

**Terms**
- PIconnect: open-source Python wrapper over AF SDK returning pandas Series [S:dev2-gh-piconnect]
- OSIsoft.PowerShell: module of PowerShell Tools for the PI System cmdlets [S:dev2-pisquare-pstools-blog]
- Connect-PIDataArchive: cmdlet that opens a connection object used by other cmdlets via `-Connection` [S:dev2-pisquare-pstools-blog]

**Worked-example material**
```python
import PIconnect as PI
with PI.PIServer() as server:
    point = server.search('sinusoid')[0]
    data = point.interpolated_values('*-1h', '*', '5m')
```
Adapted from [S:dev2-piconnect-interp] (read).
```powershell
$con = Connect-PIDataArchive -PIDataArchiveMachineName PISRV01
Add-PIValue -PointName Sinusoid,SinusoidU,CDT158 -Time "1-Apr-2017 20:00:00","3-May-2017 8:00:00","5-Jun-2017 12:00:00" -Value 100,200,300 -WriteMode ReplaceX -Connection $con
```
Add-PIValue line from [S:dev2-pisquare-manual-update] (read).

**Common mistakes / pitfalls**
- Write AF paths as raw strings (`r"Plant1\Outlet"`) or escape backslashes in Python. [S:dev2-piconnect-af] (read)
- "Attributes on root elements within the database might not have meaningful summaries." [S:dev2-piconnect-af] (read)
- PowerShell Tools show timestamps in UTC. [S:dev2-pisquare-pstools-blog] (read)
- In a sample, OSIsoft used `-Count` rather than an end time "to avoid differences due to snapshot data". [S:dev2-gh-aveva-ps-verify] (read)

**Open questions**
- Whether PIconnect needs pythonnet and the PI AF Client installed. Inferred because it wraps the AF SDK; not read in a source.
- Older PIconnect class name `PIAFDatabase` vs newer `AFDatabase` (version boundary not confirmed).
- "Backup-PIDataArchive" does not appear in any source seen. `Start-PIBackup` is the documented cmdlet (verify).
- Full `-WriteMode` value list for Add-PIValue (Append, Replace, ReplaceX, ...) not read.

---

### dev2.piconfig: piconfig, pidiag, piartool command-line utilities

**Facts**
- piconfig scripts name a table (`@table`/`@tabl`), a mode (`@mode`), input or output structure (`@istr`/`@ostr`), a selection (`@select`/`@sele`), optional `@output`/`@input` files, then `@ends` to end the command set. `@exit` or `@bye` ends the session. [S:dev2-pisquare-piconfig-pointid] (read)
- Listing script: `@table pipoint` / `@ostr pointid,tag` / `@select tag=*` / `@output output.txt` / `@ends` / `@exit`. [S:dev2-pisquare-piconfig-pointid] (read)
- Multiple selections can follow one structure, each closed by `@ends`. Example: `@sele tag=*,pointid=1` `@ends` `@sele tag=*,pointid=2` `@ends` `@bye`. [S:dev2-pisquare-piconfig-pointid] (read)
- Archive edit script replacing values from a file: `@tabl piarc` / `@mode edit` / `@istructure tag,time` / `@modi value=bad, mode=replace` / `@input OutofOrderData.csv` / `@ends`. [S:dev2-pisquare-manual-update] (read)
- "piconfig cannot filter an archive query for a particular value." Alternatives for bulk edits: DataLink, PI OLEDB Provider, SMT Archive Editor, or an AF SDK utility. [S:dev2-pisquare-manual-update] (read)
- Point-creation scripts use `@table pipoint`, `@ptclass classic`, `@mode create, t` (or `@mode edit, t`), optional `@delimiter ;`, and `@istr tag,instrumenttag,descriptor,pointsource,pointtype,compressing,location1,...` followed by data rows. [S:dev2-gh-terraform-piconfig] (read)
- Deletion scripts use `@tabl pipoint,classic` / `@mode delete` / `@istr tag` followed by tag names. [S:dev2-gh-dat2csv-piconfig] (snippet)
- `piartool -lic usage` checks licensing from the command line, run from `%PISERVER%\adm` (default `C:\Program Files\PI\adm`). [S:dev2-pisquare-check-license] (read)
- PI License Manager (`pilicmgr`) "provides license services for PI programs". PI Archive Subsystem registers with it, and `piartool -lic usage` tests pilicmgr. [S:dev2-pisquare-check-license] (read)
- With pilicmgr down, `piartool -lic usage` returned "Failed to register with license manager: [-10727] PINET RPC is non-existant". [S:dev2-pisquare-license-grace] (read)
- An expired or mismatched license keeps working while the server runs. If offline longer than the grace period ("about 30 days"), the server cannot start until a new license is installed. [S:dev2-pisquare-license-grace] (read)
- `pisrvstart.bat` runs `piartool -block pisnapss -verbose`, which waits for the snapshot subsystem. A hang there pointed to a corrupt snapshot table. [S:dev2-pisquare-check-license] (read)
- `piartool -ss`, `-qs` and `-as` print snapshot, event queue and archive statistics "every 5 seconds" (Ctrl+C to exit). [S:dev2-pi-sys-admin-pdf] (read)
- In `piartool -qs`, Total Event Reads and Writes should rise together. More than one event queue file suggests a problem. [S:dev2-pi-sys-admin-pdf] (read)
- Archiving Flag values in `piartool -as`:

  | Value | Meaning |
  |---|---|
  | 0 | no archiving |
  | 1 | historic only |
  | 2 | future only |
  | 3 | both |

  1 is healthy on Data Archive 2012 and earlier; 3 on 2015 and later. [S:dev2-pi-sys-admin-pdf] (read)
- Restore commands from a 2014 blog:
  - `pidiag -ahd <archive path>` dumps an archive header; the primary archive has End Time "Current Time"
  - `pidiag -ar` registers the primary archive
  - `piartool -ar <path>` registers further archives

  [S:dev2-blog-restore-pi] (read)
- A community answer gives `piartool -backup -query` to query backup status. [S:dev2-manualzz-da-3-4-390] (read)

**Terms**
- piconfig: PI Data Archive command-line table utility for bulk point, archive and table configuration via scripts [S:dev2-pisquare-piconfig-pointid]
- @ends: piconfig directive that ends a command block (executes the selection) [S:dev2-pisquare-piconfig-pointid]
- pilicmgr: PI License Manager subsystem [S:dev2-pisquare-check-license]
- pidiag: low-level Data Archive diagnostic utility (archive headers, archive registration) [S:dev2-blog-restore-pi]

**Worked-example material**
```
@table pipoint
@mode list
@ostr tag,pointid
@output e:\Pointid.txt
@sele tag=*,pointid=1
@ends
@bye
```
[S:dev2-pisquare-piconfig-pointid]
```
@table pipoint
@ptclass classic
@mode create, t
@istr tag,instrumenttag,descriptor,pointsource,pointtype,compressing,location1,location2,location3,location4,location5
```
[S:dev2-gh-terraform-piconfig]
- Batch-register archives: `for %f in (piarch.???) do c:\pi\adm\piartool.exe -ar %f` [S:dev2-blog-restore-pi]

**Common mistakes / pitfalls**
- piconfig cannot select archive events by value. Use other tools to find bad values first. [S:dev2-pisquare-manual-update] (read)
- Error -10005 ("value too small or subscript out of range") during archiving indicated a point-type mismatch. The fix was an archive shift and reprocessing. [S:dev2-pisquare-piconfig-pointid] (read)

**Open questions**
- Meaning of the `, t` suffix in `@mode create, t` / `@mode edit, t` (believed to make piconfig tolerant of existing points) (verify).
- `piartool -fs`: no source found; meaning unconfirmed.
- `piartool -lic` sub-options other than `usage` not read.
- Full pidiag option list not read (only `-ahd`, `-ar`).
- Official piconfig reference text (docs.aveva.com) not readable. Command abbreviation rules (first 4 characters, e.g. `@tabl`, `@sele`, `@modi`) inferred from examples.

---
