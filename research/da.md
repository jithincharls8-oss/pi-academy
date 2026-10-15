# Research notes: group `da` (Foundations + PI Data Archive)

## Summary
- Fact counts (by line tag): about 419 lines tagged (read), 22 tagged (inferred), 0 tagged (snippet). Some lines carry more than one source. Snippet-level facts were not usable because in this session WebSearch returned only titles and URLs, with no snippet text. Every docs.aveva.com page returned only the JavaScript shell, so those pages are listed in the sources with `readable: false` and are never cited as the only support for a fact.
- The main readable sources were OSIsoft/AVEVA training workbooks on cdn.osisoft.com: "PI System Administration for IT Professionals" 2017 R2 (English, plus the French 2016 R2 edition), "PI System Architecture, Planning and Implementation", and "Building PI System Assets". Also used: PI World / UC presentation PDFs (2023 exception/compression, 2023 data archive performance, 2023 security best practices, 2010 tuning, 2011 Tips from the Trenches, the 2012 Dell high-speed white paper), PI Square threads on community.aveva.com, AVEVA feedback-portal ideas, AVEVA and ARC news pages, and Wikipedia.
- Biggest gaps (all flagged in Open questions):
  1. Default values for most point attributes. Only ExcDevPercent 0.1, ExcMax 600, CompDevPercent 0.2, CompMax 28800, Span 100, Zero 0, ExcMin 0 and CompMin 0 are sourced. TypicalValue, Shutdown, DisplayDigits, PointSource, Archiving and Step defaults are not.
  2. Definitions of the legacy classic attributes (convers, filtercode, squareroot, totalcode, srcptid, userint/userreal). Their names are confirmed; their meanings are not read.
  3. The full SYSTEM digital state set and its state codes. Only Shutdown, Intf Shut and I/O Timeout are sourced.
  4. Full piartool, piconfig and pisnap.bat syntax. A fair amount is sourced, but `-backup` options beyond `-numarch` and `-archives`, plus `-fs` and `-lic`, are not.
  5. Collective replication details: which tables are and are not replicated, and n-way buffering.
  6. Subsystems beyond the core eight (pitotal, pipeschd, pialarm, piaflink, pisqlss, pirecalc).
  7. Annotations and PI Batch internals.
  8. Exact tuning-parameter defaults other than ArcMaxCollect (1.5 million), Archive_MaxQueryExecutionSec (260 s), Archive_SecondsBetweenFlush (5 min) and MessageLog_DayLimit (35 days).

---

### fnd.history: History of OSIsoft, the AVEVA acquisition and product renames
**Facts**
- OSIsoft was founded in 1980 by Dr. J. Patrick (Pat) Kennedy. [S:da-wiki-osisoft] (read) [S:da-osisoft-kennedy-welcome] (read)
- Kennedy founded the company as Oil Systems Inc.; it was later renamed OSIsoft LLC. [S:da-lns-2020] (read)
- OSIsoft was headquartered in San Leandro, California, USA. [S:da-wiki-osisoft] (read)
- The PI System was introduced in 1985 and became the most widely used industry-standard historian in the process industries. [S:da-lns-2020] (read)
- Before founding the company, Kennedy was a research engineer at Shell Development Company and an applications consultant at Taylor Instrument Company. He holds a B.S. and a Ph.D. in Chemical Engineering from the University of Kansas. [S:da-osisoft-kennedy-welcome] (read)
- In January 2011, Technology Crossover Ventures and Kleiner Perkins Caufield & Byers made a USD 135 million minority investment in OSIsoft (announced 5 Jan 2011). [S:da-wiki-osisoft] (read)
- OSIsoft had more than 1,300 employees in 2016. [S:da-wiki-osisoft] (read)
- AVEVA announced its intent to acquire OSIsoft on 25 August 2020, for USD 5 billion. [S:da-automationworld-2020] (read) [S:da-lns-2020] (read)
- The deal was USD 4.4 billion in cash plus USD 0.6 billion in AVEVA shares. The cash came from a USD 3.5 billion rights issue plus USD 0.9 billion of balance-sheet cash and new debt. [S:da-schnitger-2020] (read) [S:da-lns-2020] (read)
- In the twelve months to 30 June 2020, OSIsoft revenue was USD 488.5 million. [S:da-schnitger-2020] (read)
- SoftBank was one of the OSIsoft investors selling in the deal. [S:da-lns-2020] (read)
- At the time of the deal, Schneider Electric owned about 60% of AVEVA. LNS expected the deal to dilute that stake to about 57%. [S:da-schnitger-2020] (read) [S:da-lns-2020] (read)
- The acquisition was completed on 19 March 2021, for a final consideration of GBP 3,831.4 million. [S:da-wiki-osisoft] (read) [S:da-arc-completion-2021] (read)
- At completion, Estudillo Holdings LLC (majority owned by Kennedy and his family) received 13,655,570 AVEVA shares, a 4.5% stake in AVEVA. [S:da-arc-completion-2021] (read)
- After the deal, Kennedy took a newly created role as Chairman Emeritus. [S:da-automationworld-2020] (read) [S:da-lns-2020] (read)
- At announcement, the PI System was used at about 14,000 sites in 127 countries. Users included more than 1,000 power and utility companies and 38 of the Global Fortune Top 40 oil and gas companies. [S:da-automationworld-2020] (read)
- Schneider Electric merged most of its industrial software into AVEVA in 2018 through a reverse takeover, which gave Schneider a 60% stake. [S:da-arc-avevaworld-2025] (read)
- On 18 January 2023, AVEVA announced that Schneider Electric had completed its acquisition and that AVEVA was now wholly owned by and part of Schneider Electric. [S:da-aveva-schneider-2023] (read)
- OSIsoft Cloud Services (OCS) was a multitenant SaaS data platform for operational data. [S:da-aveva-ocs-2021] (read)
- AVEVA Data Hub was announced at AVEVA PI World on 19 October 2021 as AVEVA's first SaaS offering combining key PI System features, delivered on the AVEVA Connect cloud platform. General availability was planned for early 2022. [S:da-arc-datahub-2021] (read)
- "As of 09 Feb 2022, AVEVA Data Hub is the official name for the product formerly known as OSIsoft Cloud Services (OCS)." [S:da-aveva-ocs-2021] (read) [S:da-aveva-roadmap-2021] (read)
- In a July 2024 blog post, AVEVA announced that AVEVA Data Hub is becoming "CONNECT data services", part of CONNECT, its industrial intelligence platform. [S:da-aveva-cds-blog-2024] (read)
- CONNECT data services was previously named AVEVA Data Hub or OSIsoft Cloud Services, and it integrates with Databricks via Delta Sharing. [S:da-arc-avevaworld-2025] (read)
- AVEVA product pages now use the names "AVEVA PI System", "AVEVA PI Server", "AVEVA PI Vision" and "AVEVA PI DataLink". [S:da-aveva-pi-system-page] (read) [S:da-aveva-roadmap-2021] (read)
- Earlier OSIsoft product names included PI ProcessBook, PI DataLink, PI Coresight (the predecessor of PI Vision), PI WebParts and PI Cloud Connect. [S:da-pi101-2017-basics] (read) [S:da-wiki-osisoft] (read)
- A 2017 OSIsoft deck listed the cloud components as PI Cloud Connect, PI Cloud Services and PI Integrator for Business Analytics. [S:da-pi101-2017-basics] (read)
- Windows Integrated Security for the PI Server arrived in version 3.4.380.36 (2009). [S:da-rs2011-arch-best-practices] (read)
- PI Server 2012 had version number 3.4.390.15 (RC3). [S:da-dell-wp-2012] (read)
- The PI Data Archive "DeLorean" CTP1 build that introduced future data was 3.4.395.05, published on vCampus on 14 May 2014. [S:da-emea14-future-data] (read)
- PI Server 2018 SP3 is the feature-stable branch that receives fixes as patches; "2018 SP3 Patch 5" was current in 2023. [S:da-uc23-security] (read)
- PI Server 2023 was the first "hybrid" release, integrating with AVEVA Data Hub, and added OIDC claims-based authentication. [S:da-uc23-security] (read) [S:da-arch-workbook] (read)
- AVEVA PI Server 2024 is reported to make out-of-order inserts up to 40% faster for numeric types and up to 90% faster for strings and blobs. [S:da-uc23-da-performance] (read)

**Terms**
- OSIsoft: the company (originally Oil Systems Inc.), founded in 1980, that created the PI System; acquired by AVEVA in March 2021. [S:da-lns-2020]
- AVEVA Data Hub: the cloud-native SaaS successor to OSIsoft Cloud Services, named on 9 Feb 2022. [S:da-aveva-ocs-2021]
- CONNECT data services: the current (2024+) name of AVEVA Data Hub, the data-management layer of AVEVA's CONNECT platform. [S:da-aveva-cds-blog-2024]
- Chairman Emeritus: the role Pat Kennedy took at AVEVA after the acquisition. [S:da-automationworld-2020]

**Worked-example material**
- Timeline for a lesson:
  - 1980: Oil Systems Inc. founded.
  - 1985: PI System introduced.
  - 2009: Windows Integrated Security (PI Server 3.4.380.36).
  - 2012: PI Server 2012 (3.4.390).
  - 2015: Data Archive future data.
  - 25 Aug 2020: acquisition announced.
  - 19 Mar 2021: acquisition completed.
  - 19 Oct 2021: AVEVA Data Hub announced.
  - 9 Feb 2022: OCS renamed AVEVA Data Hub.
  - 18 Jan 2023: Schneider Electric owns 100% of AVEVA.
  - Jul 2024: AVEVA Data Hub becomes CONNECT data services.

**Common mistakes / pitfalls**
- Schneider Electric did not buy OSIsoft directly. AVEVA bought OSIsoft (2020-2021) while Schneider was AVEVA's majority (about 60%) shareholder, and Schneider later bought the rest of AVEVA (January 2023). [S:da-schnitger-2020] [S:da-aveva-schneider-2023] (inferred)
- The "USD 5 billion" figure is an enterprise value. The final consideration reported on completion was GBP 3,831.4 million. [S:da-wiki-osisoft] (read)

**Open questions**
- The exact date AVEVA began calling the product "AVEVA PI Server" instead of "PI Server". No source found. (verify)
- Whether the move to "CONNECT data services" is complete and on what date. The 2024 blog says "is becoming". (verify)

---

### fnd.historian: What a process historian is
**Facts**
- The PI System is a software suite that collects, stores and enhances data from a plant or process and makes it available to users. [S:da-admin-workbook-2017r2] (read)
- OSIsoft described the PI System as a data infrastructure suite, "primarily build for industrial use cases", that collects, stores, organizes, calculates on and delivers sensor data. [S:da-pi101-2017-academic] (read)
- The PI System is "just software", running on servers and computers on a network. [S:da-admin-workbook-2017r2] (read)
- The PI Data Archive is the PI System component responsible for storing time-series data. [S:da-admin-workbook-2017r2] (read)
- The PI Data Archive is a proprietary database optimized for time-series data, often called the "Historian". [S:da-pi101-2017-basics] (read)
- PI Vision training calls the PI Data Archive "the heart of the PI System". [S:da-visualizing-workbook] (read)
- The PI Server stores values indefinitely ("stores the values forever") and keeps data online for decades. [S:da-rs2011-pisystem2010] (read)
- AVEVA lists the core of the PI Data Infrastructure offering as AVEVA PI Server, AVEVA Edge Data Store, CONNECT, and connectivity products (PI Interfaces, PI Connectors, AVEVA Adapters). [S:da-aveva-pi-system-page] (read)
- AVEVA lists AVEVA PI Vision, PI DataLink, PI Integrator for Business Analytics, RtReports, PI Manual Logger and developer technologies as optional add-ons. [S:da-aveva-pi-system-page] (read)
- AVEVA marketing claims include: 1,000+ power utilities use PI; 9 of the top 10 mining companies use it; 75% of the world's crude oil, natural gas and liquids are produced with PI. [S:da-aveva-pi-system-page] (read)
- In 2010 OSIsoft said the PI System connects to "more than 450 different systems". [S:da-rs2011-pisystem2010] (read)
- In 2017 OSIsoft cited "hundreds" of data sources: named connectors and interfaces plus about 300 more. [S:da-pi101-2017-basics] (read)
- A PI Interface reads from the source, timestamps the value, formats it, applies exception filtering and sends it to the Data Archive. OSIsoft compares an interface to "a translator". [S:da-admin-workbook-2017r2] (read)

**Terms**
- Historian: a database optimized to store and serve time-stamped process data; in the PI System this is the PI Data Archive. [S:da-pi101-2017-basics]
- PI Interface: software that collects data from a source, timestamps it, applies exception and sends it to the Data Archive. [S:da-admin-workbook-2017r2]

**Worked-example material**
- Three-layer model (OSIsoft PI 101): Collect (interfaces and connectors), then Manage/Enhance (PI Server: Data Archive + AF), then Deliver (PI Vision, DataLink, ProcessBook, Notifications). [S:da-pi101-2017-academic] (read)

**Common mistakes / pitfalls**
- Learners often think the PI System is an appliance. It is Windows software. [S:da-admin-workbook-2017r2] (read)

**Open questions**
- None critical.

---

### fnd.timeseries: Time-series data concepts in PI
**Facts**
- A real-time reading is stored as a PI Tag event with a timestamp, a value and a status (for example "GOOD"). [S:da-pi101-2017-basics] (read)
- Time-indexed sensor data suits uneven spacing, different start times and out-of-range values better than a table index. [S:da-pi101-2017-academic] (read)
- PI Points, also called PI Tags, define the data streams stored in the Data Archive. [S:da-admin-workbook-2017r2] (read)
- A PI Point is "a unique storage point for a stream of data in the PI Data Archive", also called a PI Tag or PI data stream. [S:da-pi-programming-pdf] (read)
- The Data Archive stores timestamps in UTC, so every stored day has 24 hours. Clients apply time zone and DST adjustments. [S:da-pi-programming-pdf] (read) [S:da-assets-workbook] (read)
- Raw data is stored in UTC seconds, so time zone changes do not alter it; it is converted to the requested time zone, including DST offsets, when returned to clients. [S:da-uc2011-tips-trenches] (read)
- After DST rule changes, OS patches and an updated localhost.tz are required. `pidiag -tz` (run from the pipc\adm directory) verifies localhost.tz. [S:da-uc2011-tips-trenches] (read)
- Each event can carry a timestamp, value, quality, substitution and change flags, and annotations. [S:da-rs2011-pisystem2010] (read)
- PI time expressions use `*` (now), `t` (today) and `y` (yesterday) plus offsets such as `-1d` or `+3h`. The training gives one offset per expression. [S:da-pi-programming-pdf] (read)
- Future timestamps use the same syntax, for example `*+1h` for one hour from now. [S:da-assets-workbook] (read)
- Historical (measured) data is streaming, arrives in time order, is steady over time and is usually denser. Future (predictive) data may arrive out of order, may be sporadic, and is usually less dense. [S:da-rs2015-future-data] (read)
- Retrieval modes differ:
  - Sampled and Timed Data functions in DataLink interpolate.
  - Archived Value with "previous" retrieval returns stored values.
  - Compressed data returns only archived events. [S:da-ps-interp-thread] (read)
- The Step attribute controls interpolation. With Step off, values between archived events are interpolated linearly. With Step on, a value is held until the next archived value. [S:da-rockwell-studio5000-params] (read)
- In the AF SDK, `PIPoint.RecordedValues(AFTimeRange, AFBoundaryType.Inside, "", false)` returns archived (recorded) values, and `PIPoint.InterpolatedValues(AFTimeRange, AFTimeSpan, "", false)` returns interpolated values. [S:da-pi-programming-pdf] (read)
- The AF SDK calls a Data Archive a `PIServer` and an AF Server a `PISystem`, for backward compatibility. [S:da-pi-programming-pdf] (read)

**Terms**
- Event: one timestamp-value-status record of a PI point. [S:da-pi101-2017-basics]
- Snapshot: the most recent event for a point. [S:da-admin-workbook-2017r2]
- Recorded (compressed) values: the events actually stored in the archive. [S:da-ps-interp-thread]
- Interpolated value: a value calculated between two archived events. [S:da-ps-interp-thread]
- Stepped point: a point whose value is held constant between archived events (Step=1). [S:da-rockwell-studio5000-params]

**Worked-example material**
- Solar MW tag that sits at 0 overnight with CompMax 28800 s: a sampled DataLink report interpolates a false ramp between the last archived 0 and the first morning value. Fixes from the thread:
  - Use compressed data.
  - Set CompMax to 3600 so a zero is stored hourly.
  - Use an AF analysis threshold. [S:da-ps-step-thread] (read)
- OPC UA pump example: a pump idle for a year that starts at 10 l/s appears as a slow ramp rather than a step, because the connector stores only changes. [S:da-ps-opcua-integrity-thread] (read)

**Common mistakes / pitfalls**
- Users see "unexpected linear interpolations" when the client uses interpolated or sampled retrieval on non-stepped tags with sparse archived data. [S:da-ps-interp-thread] (read)

**Open questions**
- Precise semantics of the substituted and annotated flags as exposed in current clients. (verify)

---

### fnd.architecture: PI System and PI Server architecture
**Facts**
- PI Server = PI Data Archive + PI Asset Framework (AF). [S:da-arch-workbook] (read) [S:da-pi101-2017-academic] (read)
- A minimal PI System has a collector (PI Interface or PI Connector), a PI Server (Data Archive and AF) and a visualization tool. [S:da-admin-workbook-2017r2] (read)
- PI AF needs a Microsoft SQL Server instance at installation time. SQL Server Express is acceptable for small to medium systems. [S:da-arch-workbook] (read)
- Since the PI Server 2018 unified installer, PI AF is no longer a required prerequisite for installing the PI Data Archive. [S:da-arch-workbook] (read)
- AVEVA recommends installing SQL Server on a separate computer from the PI Server, for performance and security. [S:da-arch-workbook] (read)
- SQL Express on the same node is limited to a single physical CPU and 1 GB of RAM. [S:da-arch-workbook] (read)
- AF and the Data Archive should be on separate computers if AF serves multiple PI Servers or uses high availability. [S:da-arch-workbook] (read)
- Supported production OS (per the current workbook): Windows Server 2022 (recommended), 2019 and 2016. Windows 10 is allowed for test systems. [S:da-arch-workbook] (read)
- The PI Buffer Subsystem (pibufss) is installed with every PI Interface, runs as a Windows service, and holds data when the Data Archive or the network is unavailable. [S:da-admin-workbook-2017r2] (read)
- OSIsoft's analogy for the PI Buffer Subsystem is a reservoir. [S:da-admin-workbook-2017r2] (read)
- PI Buffer Subsystem files:
  - pibufmem_<GUID>.dat (snapshot table)
  - pibufq_<GUID>.dat (buffer queue)
  - APIBUF_<Data Archive name>.dat (shared-memory overflow). [S:da-admin-workbook-2017r2] (read)
- The PI Buffer Subsystem queue file defaults to 32 MB; more queue files are created as each one fills. [S:da-admin-workbook-2017r2] (read) [S:da-admin-workbook-fr] (read)
- The legacy API Buffer Server (bufserv) should only be used if the receiving PI Server is older than 3.4.375 and the interface runs on a non-Windows platform. [S:da-admin-workbook-fr] (read)
- Buffering Manager is available in PI Buffer Subsystem 4.3 and later. [S:da-admin-workbook-2017r2] (read)
- Buffering Manager accepts a gMSA from PI Buffer Subsystem 4.9.0.37 onward. [S:da-arch-workbook] (read)
- PI Interfaces apply exception. PI Connectors do not test exception. AVEVA Adapters can filter by deadband but ignore the tag's exception settings. [S:da-uc23-exc-comp] (read)
- PI Connectors ignore the PointSource attribute, unlike interfaces. [S:da-ps-pointsource-thread] (read)
- Connector-created points are base-class points without instrument tags. [S:da-ps-pointsource-thread] (read)
- Connector-created point names follow `<PIPointPrefix>.<DataSourceName>.<NameSpaceIndex>.<Identifier>` (OPC UA connector). [S:da-ps-pointsource-thread] (read)
- There is no failover support for PI Connector (2nd gen) or PI Connector Relay. [S:da-arch-workbook] (read)
- PI Interface failover runs redundant interface copies on separate computers. Disconnected startup is recommended for production interfaces. [S:da-arch-workbook] (read)
- Failover types: Hot (no data loss), Warm (minimal or possible data loss), Cold (some data loss). [S:da-rs2010-rome-arch] (read) [S:da-rs2011-arch-best-practices] (read)
- Disconnected startup builds a local tag cache, so an interface can start without a PI Server connection. [S:da-rs2011-arch-best-practices] (read)
- The Data Archive client port is TCP 5450. [S:da-admin-workbook-2017r2] (read) [S:da-uc23-security] (read)
- AF server inbound ports: TCP 5457 (AF SDK), 5459 (PI SQL for AF), 5463 (PI Analysis Service), 5468 (PI Notifications Service). [S:da-uc23-security] (read)
- Data Archive outbound TCP 5457 is used for MDB-to-AF synchronization. [S:da-uc23-security] (read)
- Published performance figures (2017 OSIsoft deck):
  - Maximum tag count: over 20 million.
  - Startup: under 30 s per million tags.
  - Snapshot input: over 1 million events/s.
  - Archive input: over 500,000 events/s.
  - Archive output: over 10 million events/s. [S:da-pi101-2017-basics] (read)
- In a 2012 Dell benchmark, PI Server 2012 archived more than 500K events/s and processed up to 20M events/s for historical reads on a two-node collective. [S:da-dell-wp-2012] (read)
- PI Cloud Connect connects a corporate site with production sites and partners, each running its own Data Archive and AF. [S:da-pi101-2017-basics] (read)
- Since AF Client 2018, client connections are balanced across all available collective members, and failback returns connections to the original member after a failover. [S:da-uc23-da-performance] (read)

**Terms**
- PI Server: the server product made of the PI Data Archive and PI AF Server. [S:da-arch-workbook]
- PI Buffer Subsystem (pibufss): the Windows service on interface nodes that buffers data to the Data Archive. [S:da-admin-workbook-2017r2]
- Disconnected startup: an interface feature that uses a local point cache so the interface can start without the server. [S:da-rs2011-arch-best-practices]
- PI ICU: PI Interface Configuration Utility, a GUI for creating and configuring interface batch files and services. [S:da-admin-workbook-2017r2]

**Worked-example material**
- Training lab topology:
  - PISRV01: Data Archive and AF.
  - PIINT01: OPC DA interface (PI OPC interface 2.6.3.5).
  - PIINT02: interface node.
  - Versions: Data Archive 2017 R2, AF 2017 R2, SMT 2016. [S:da-admin-workbook-2017r2] (read)
- Dell 2012 storage layout:
  - C: (RAID1) binaries and .dat files.
  - E: (RAID0) recent archives and event queues.
  - SAN: older archives (20 TB). [S:da-dell-wp-2012] (read)

**Common mistakes / pitfalls**
- Expecting connectors to honour ExcDev or ExcMax: "Exception settings actually do not apply at all for connectors." [S:da-ps-opcua-integrity-thread] (read)
- Do not put a network load balancer in front of the PI Data Archive; use collective connection preferences instead. [S:da-uc2011-tips-trenches] (read)

**Open questions**
- Current maximum supported point count for the latest PI Server release. (verify)

---

### fnd.licensing: Licensing models
**Facts**
- The PI Data Archive license file must be generated (in the Customer Portal) before the Data Archive is installed. [S:da-arch-workbook] (read)
- Generating the license needs a Machine Signature File, created by the install kit on the target server or VM. A file generated on another machine will not work. [S:da-arch-workbook] (read)
- The license controls which applications can run on the Data Archive server, and shows parameters such as the point count limit. [S:da-arch-workbook] (read)
- Setup copies the license file to %PISERVER%\dat. [S:da-arch-workbook] (read)
- The PI License Manager subsystem maintains license information for the Data Archive and connected applications. [S:da-admin-workbook-2017r2] (read)
- AVEVA says it is moving the PI System to a subscription-based commercial model, and subscriptions can include both on-premises and cloud components. [S:da-aveva-pi-system-page] (read)
- AVEVA Flex is a subscription program giving "flexible access to any amount and any mix of AVEVA software". The steps are: subscribe, buy AVEVA Flex Credits for an AVEVA Connect account, then consume software against "AVEVA Flex Product Rate Plans". [S:da-flex-pdf] (read)
- Flex credits are consumed at daily, monthly or annual "burn down rates". Metrics include monthly active users, daily active users, concurrent users, terabytes, data streams and diagrams. [S:da-flex-pdf] (read)
- AVEVA Data Hub was available through the AVEVA Flex subscription program. [S:da-arc-datahub-2021] (read)
- PI Server 2023 was made available to AVEVA Flex customers. [S:da-uc23-security] (read)
- Third-party claims (not official AVEVA figures):
  - About 20 Flex credits per day for a PI Server and 1 per day for a PI Vision user.
  - Traditional PI licensing is tag-based.
  - The City of Lakeland bought a 3-year Flex subscription (PI Server, PI Vision, interfaces) worth USD 325,710. [S:da-flow-software-2025] (read)

**Terms**
- AVEVA Flex: AVEVA's credit-based subscription program for consuming any mix of AVEVA software. [S:da-flex-pdf]
- Machine Signature File: a file generated on the target server, used to create a PI Data Archive license file bound to that machine. [S:da-arch-workbook]

**Worked-example material**
- Licensing install steps:
  1. Run the install kit's machine-signature generator on the server.
  2. Upload the file to the Customer Portal.
  3. Download the license file.
  4. Install; setup copies the license to %PISERVER%\dat. [S:da-arch-workbook] (read)

**Common mistakes / pitfalls**
- Generating the machine signature on a different machine (for example the admin's laptop) produces an unusable license. [S:da-arch-workbook] (read)

**Open questions**
- Official PI Server edition names and tiers. No readable source found. (verify)
- The license file's name (pilicense.dat?) and the `piartool -lic` output format. (verify)
- Official Flex rate-plan figures for PI Server. Only a third-party estimate was found. (verify)

---

### fnd.connect: AVEVA CONNECT vs on-premises PI
**Facts**
- CONNECT is AVEVA's "industrial intelligence platform". CONNECT data services (formerly AVEVA Data Hub) is its data-management foundation. [S:da-aveva-cds-blog-2024] (read)
- CONNECT data services is cloud-native and handles aggregation, storage, enrichment, access, analysis and secure sharing of real-time industrial data. [S:da-aveva-cds-blog-2024] (read)
- AVEVA Data Hub integrates natively with PI System products, including PI Server and Edge Data Store. [S:da-arc-datahub-2021] (read)
- AVEVA Data Hub is self-service in a browser, with no software to install; AVEVA manages updates and infrastructure. [S:da-arc-datahub-2021] (read)
- AVEVA Data Hub was designed to handle operations data that arrives late or out of order. [S:da-arc-datahub-2021] (read)
- The PI Server is described as "the on-premises home for operational data". [S:da-aveva-pi-server-2022] (read)
- PI AF provides the contextualization that CONNECT builds on before sharing data. [S:da-arc-avevaworld-2025] (read)
- AVEVA lists CONNECT as a core component of the PI Data Infrastructure offering. [S:da-aveva-pi-system-page] (read)
- OCS's highlighted use cases were remote monitoring, enterprise-wide data science and cross-enterprise data sharing. [S:da-aveva-ocs-2021] (read)
- Edge Data Store transfers data to the PI Server and to OCS. [S:da-flex-pdf] (read)
- Comparison for lessons:
  - On-premises PI Server is customer-installed Windows software that the customer licenses and administers.
  - CONNECT data services is multitenant SaaS that AVEVA manages and that is bought with Flex credits. [S:da-aveva-ocs-2021] [S:da-arc-datahub-2021] [S:da-flex-pdf] (inferred)

**Terms**
- CONNECT: AVEVA's cloud industrial intelligence platform. [S:da-aveva-cds-blog-2024]
- Hybrid (PI Server 2023): the first PI Server release that integrates with AVEVA Data Hub. [S:da-uc23-security]

**Open questions**
- Which mechanism sends PI Server data to CONNECT (for example a "PI to Data Hub" agent) and how it is configured. Not read in any source. (verify)

---

### da.points: PI points
**Facts**
- PI Points (PI Tags) define the data streams stored in the Data Archive. A point's name must be unique within the Data Archive. [S:da-admin-workbook-2017r2] (read)
- A PI tag and a PI point are the same thing. [S:da-assets-workbook] (read)
- Point types listed by OSIsoft training: int16, int32, float16, float32, float64, digital, string, BLOB, timestamp. [S:da-assets-workbook] (read) [S:da-tibco-tagdef] (read)
- Float32 is easier to administer but has no under/over-range check unless the interface supports one, and roughly doubles archive I/O compared with Float16. [S:da-uc2003-system-mgmt] (read)
- Float16 requires a well-defined zero and span. It suits systems over 50,000 points, sub-second collection and high-density applications. [S:da-uc2003-system-mgmt] (read)
- Rockwell's PI-based historian adds that Span must be positive for Float16 points. [S:da-rockwell-ftme-general] (read)
- Digital points are preferred over string tags for discrete states. [S:da-uc2003-system-mgmt] (read)
- Ways to create points:
  - SMT: Points > Point Builder.
  - PI Builder (Excel add-in) for bulk creation and editing.
  - The PI OPC Client Tool generates a CSV for bulk creation, with a maximum of 500 OPC items per bulk addition. [S:da-admin-workbook-2017r2] (read)
- In PI Builder, the ObjectType value for PI tags is PIPoint. [S:da-pse-builder-tips-pdf] (read)
- Point creation and deletion update three files: the PI Point Table, the PI Snapshot Table and the primary archive file. This needs a global lock, so bulk creation or deletion should run off-hours. [S:da-uc23-da-performance] (read)
- Point creation is logged in the message log under pibasess (message ID 6079). [S:da-uc23-da-performance] (read)
- AF templates can create PI points through substitution. The default tag-name pattern is `%Element%.%Attribute%.%ID%`; for example, `%Element%LI.PV` on element Tank02 creates Tank02LI.PV. [S:da-assets-workbook] (read)
- PI Web API (2017 R2) creates points with `POST {server}/piwebapi/dataservers/{webId}/points`. The body takes Name, Descriptor, PointClass, PointType, EngineeringUnits, Step and Future. Other attributes are rejected at creation and must be set afterwards. [S:da-ps-webapi-create-thread] (read)
- Attribute names differ by API: PI Web API GET returns `ptclassname` and `pointtype`, while POST uses `PointClass` and `PointType`. [S:da-ps-webapi-create-thread] (read)
- A piarch (archive) file stores PointIDs, not tag names. The tag-to-PointID map is in the PIPOINT table. [S:da-ps-piarch-thread] (read)
- Stale tags slow interpolated queries and snapshot deletion, because the system must search many archives. [S:da-uc23-da-performance] (read)
- Avoid points with more than about 10 index records (2010 tuning guidance). [S:da-vcampus-2010-tuning] (read)

**Terms**
- PI Point / PI Tag: a named time-series data stream in the Data Archive. [S:da-admin-workbook-2017r2]
- Point Builder: the SMT plug-in (Points > Point Builder) for creating and editing points. [S:da-admin-workbook-2017r2]
- PI Builder: the Excel add-in for bulk creation and editing of PI points and AF objects. [S:da-pse-builder-tips-pdf]
- PointID: the internal numeric identifier of a point, used in archive files. [S:da-ps-piarch-thread]

**Worked-example material**
- Export tag-to-PointID map:
  ```
  piconfig
  @tabl pipoint
  @ostr tag,pointid
  @ends
  ```
  [S:da-ps-piarch-thread] (read)
- PI Web API create body: `{"Name":"...","Descriptor":"...","PointClass":"classic","PointType":"Float32","EngineeringUnits":"","Step":false,"Future":false}`. [S:da-ps-webapi-create-thread] (read)

**Common mistakes / pitfalls**
- Trying to set exdesc, pointsource, archiving or location1 in the PI Web API create call causes a "not allowed" error. [S:da-ps-webapi-create-thread] (read)
- Bulk point deletion during production hours causes global-lock delays. [S:da-uc23-da-performance] (read)

**Open questions**
- Precise numeric ranges of Int16 (0 to 32767?) and Int32 PI types, and the String and Blob size limits. A feedback idea suggests Int16 is a "15-bit unsigned integer (0 to 32767)". [S:da-fb-pida-439] (read, needs official confirmation - verify)
- Tag-name rules (allowed characters, maximum length). Rockwell's PI-based ME edition says a name must start with a letter, a number or %. [S:da-rockwell-ftme-general] (read, verify for PI)

---

### da.point-attributes: Point attributes
**Facts**
- Full attribute list as exposed by a PI-based API (FactoryTalk Historian SE, an OEM PI Data Archive): tag, pointtype, pointid, step, future, descriptor, exdesc, typicalvalue, engunits, zero, span, pointsource, scan, excmin, excmax, excdev, shutdown, archiving, compressing, compmin, compmax, compdev, creationdate, creator, changedate, changer, displaydigits, location1-location5, filtercode, squareroot, totalcode, convers, srcptid, instrumenttag, userint1, userint2, userreal1, userreal2, ptowner, ptgroup, ptaccess, ptsecurity, dataowner, datagroup, dataaccess, datasecurity, recno, ptclassname, ptclassid, ptclassrev, sourcetag, digitalset, compdevpercent, excdevpercent. [S:da-rockwell-ftse-attrs] (read)
- Tag (Name): the point name. It must be unique within the Data Archive. [S:da-admin-workbook-2017r2] (read)
- Descriptor: optional free text describing the point, often used as a search criterion. [S:da-admin-workbook-2017r2] (read) [S:da-assets-workbook] (read)
- PointType: the data type of stored values (Digital, Timestamp, Float64, Float32, Float16, Int32, Int16, String, Blob). [S:da-tibco-tagdef] (read)
- PointSource: usually identifies the PI Interface that collects the point's data. [S:da-admin-workbook-2017r2] (read)
- PointSource plus the interface ID in Location1 links a point to a specific interface instance. [S:da-admin-workbook-2017r2] (read)
- PointClass (ptclassname): the point class. The common classes are "base" and "classic". [S:da-ps-pointclass-thread] (read) [S:da-pse-builder-tips-pdf] (read)
- Connector-created points use the base class. [S:da-ps-pointsource-thread] (read)
- ExDesc (extended descriptor): an optional extended description. Some interfaces use it for configuration, for example trigger expressions. [S:da-tibco-tagdef] (read) [S:da-rockwell-ftme-general] (read)
- EngUnits: the engineering units string of the point. [S:da-tibco-tagdef] (read)
- Zero: the lowest possible value of the point (default 0). [S:da-tibco-tagdef] (read) [S:da-admin-workbook-2017r2] (read)
- Span: the range between maximum and minimum values (Zero + Span = highest value), default 100. [S:da-tibco-tagdef] (read) [S:da-admin-workbook-2017r2] (read)
- TypicalValue: a reasonable value for the point. For numeric points it lies between Zero and Zero+Span. [S:da-rockwell-ftme-general] (read)
- DigitalSet: the digital state set name, used only when pointtype is Digital. [S:da-tibco-tagdef] (read)
- Step: off means linear interpolation between archived values; on means values are held until the next archived value. Step also affects the compression calculation. [S:da-rockwell-studio5000-params] (read)
- Shutdown: when enabled, a Shutdown event is written when the server shuts down. OSIsoft training names Shutdown and "Intf Shut" among the factory system states. [S:da-uc2003-system-mgmt] (read; attribute semantics inferred - verify)
- Archiving: enables or disables archiving (0 or 1). [S:da-tibco-tagdef] (read)
- Compressing: whether snapshot events go through compression on the way to the archive (0 or 1). Compressing=0 is not the same as Compressing=1 with CompDev=0. [S:da-tibco-tagdef] (read) [S:da-uc23-exc-comp] (read)
- CompDev / CompDevPercent: the compression deviation in engineering units, or as a percentage of Span. Setting one recalculates the other: CompDev = CompDevPercent x Span / 100. [S:da-tibco-tagdef] (read) [S:da-uc23-exc-comp] (read)
- If CompDev and CompDevPercent are both sent in the same edit, CompDevPercent overrides CompDev. [S:da-uc23-exc-comp] (read)
- CompMin / CompMax: the minimum and maximum time in seconds between archived events. CompMin defaults to 0. CompMax defaults to 28800 s (8 hours). [S:da-admin-workbook-2017r2] (read) [S:da-ps-compmin-thread] (read)
- ExcDev / ExcDevPercent: the exception deadband in engineering units, or as a percentage of Span. The default ExcDevPercent is 0.1 (% of span). [S:da-admin-workbook-2017r2] (read) [S:da-tibco-tagdef] (read)
- ExcDevPercent and CompDevPercent are ignored (shown as zero) for digital, string and Blob tags. [S:da-rockwell-studio5000-params] (read)
- ExcMin: the minimum time in seconds between reported values (default 0). [S:da-ps-compmin-thread] (read)
- ExcMax: the maximum time in seconds between reported values (default 600 s, 10 minutes). [S:da-admin-workbook-2017r2] (read)
- The default CompDevPercent is 0.2 (% of span). [S:da-admin-workbook-2017r2] (read)
- Units: ExcMin, ExcMax, CompMin and CompMax are in seconds. ExcDev and CompDev are in engineering units. The *Percent variants are a percentage of span. [S:da-ps-compdev-standard-thread] (read)
- Scan: on/off switch for interface scanning (0 or 1). OSIsoft training says Scan "should always be ON". [S:da-tibco-tagdef] (read) [S:da-admin-workbook-2017r2] (read)
- InstrumentTag: the address in the source system, for example the OPC ItemID. It must match the source exactly and is often case-sensitive. [S:da-admin-workbook-2017r2] (read)
- Location1 is typically the interface instance ID. [S:da-admin-workbook-2017r2] (read)
- Location3 for the OPC DA interface: 0 = polled or event, 1 = advise, 2 = output. [S:da-admin-workbook-2017r2] (read)
- Location4 is typically the scan class number. [S:da-admin-workbook-2017r2] (read)
- OPC interface scan-class rules: only Advise points can go into scan class 1, and points of different types cannot share a scan class. [S:da-admin-workbook-2017r2] (read)
- SourceTag: another PI point whose data feeds this point, for example output points. [S:da-tibco-tagdef] (read)
- DisplayDigits: the display precision for the point's values. [S:da-tibco-tagdef] (read)
- Future: marks a future-data point. Future points store data in future archives. [S:da-emea14-future-data] (read) [S:da-admin-workbook-2017r2] (read)
- CreationDate, Creator, ChangeDate and Changer record when and by whom the point was created and last changed. [S:da-tibco-tagdef] (read) [S:da-rockwell-ftse-attrs] (read)
- PtSecurity controls viewing and editing of the point's configuration. DataSecurity controls reading and writing of its values. [S:da-uc23-security] (read)
- Object-level security is a single access-control-list string, for example `pi_users:A(r,w) | bob:A(r,w) | PIWorld:A(r)`. [S:da-rs2010-rome-arch] (read)
- ptowner, ptgroup, ptaccess, dataowner, datagroup and dataaccess are legacy owner/group/world security attributes, still listed alongside ptsecurity and datasecurity. [S:da-rockwell-ftse-attrs] (read) [S:da-uc2003-system-mgmt] (read)
- Older guidance used ptaccess "o: g: w:" (no access) as an alternative to deleting a point. [S:da-uc2003-system-mgmt] (read)
- The archive record header stores the digital state set ID. Changing a tag's DigitalSet does not change how existing archived values are interpreted until archives are reprocessed. [S:da-fb-pisrv-1351] (read)
- An option for offline reprocessing to honour archived digital state values was delivered in PI Server 2018 SP3 Patch 3. [S:da-fb-pida-1142] (read)
- Point class can be changed by editing ptclassname in piconfig (edit mode on PIPOINT), even though older admin guides said class and type could not be changed. [S:da-ps-pointclass-thread] (read)
- The OPC UA connector manages only Tagname, Description and EngUnit. It overwrites manual edits to Description and EngUnit, but other attributes can be edited freely. [S:da-ps-pointsource-thread] (read)
- Connector-created points can be changed from Base to Classic class without affecting the connector. [S:da-ps-pointsource-thread] (read)

**Terms**
- Base class: the point class holding the core attributes; connector-created points use it. [S:da-ps-pointsource-thread]
- Classic class: the point class that adds interface-specific attributes (Location1-5, InstrumentTag, UserInt/UserReal and others). [S:da-ps-pointclass-thread] (inferred)
- Span: the range of a numeric point; Zero+Span is the top of the range. [S:da-tibco-tagdef]
- TypicalValue: a reasonable value within Zero to Zero+Span. [S:da-rockwell-ftme-general]
- InstrumentTag: the source-system address of the data, for example the OPC ItemID. [S:da-admin-workbook-2017r2]

**Worked-example material**
- Default-value card (sourced only):

  | Attribute | Default | Source |
  |---|---|---|
  | ExcDevPercent | 0.1 | [S:da-admin-workbook-2017r2] |
  | ExcMax | 600 s | [S:da-admin-workbook-2017r2] |
  | ExcMin | 0 | [S:da-ps-compmin-thread] |
  | CompDevPercent | 0.2 | [S:da-admin-workbook-2017r2] |
  | CompMax | 28800 s | [S:da-admin-workbook-2017r2] |
  | CompMin | 0 | [S:da-ps-compmin-thread] |
  | Span | 100 | [S:da-admin-workbook-2017r2] |
  | Zero | 0 | [S:da-admin-workbook-2017r2] |

- Temperature RTD (±1 °C) example settings: CompDev 1, CompMax 28800, ExcDev 0.5, ExcMax 600, scan class 10 s. [S:da-uc23-exc-comp] (read)
- Change point class with piconfig (structure from the thread; the exact script is not shown there):
  ```
  @tabl pipoint
  @mode edit
  @istr tag,ptclassname
  MyTag,classic
  ```
  [S:da-ps-pointclass-thread] (inferred - verify syntax)

**Common mistakes / pitfalls**
- Assigning the wrong digital set and then "fixing" it does not fix history, because the set ID is stored in archive record headers; offline reprocessing is needed. [S:da-fb-pisrv-1351] (read)
- To change a digital set safely, only append new states. Never reassign an existing integer, for example 1 from "OPEN" to "CLOSED". [S:da-fb-pida-1142] (read)
- InstrumentTag mismatches are case-sensitive and cause points to receive no data. [S:da-admin-workbook-2017r2] (read)
- Expecting connectors to read PointSource or Location attributes. Connectors ignore PointSource. [S:da-ps-pointsource-thread] (read)

**Open questions** (sources found name these attributes but do not define them or give their defaults; verify all)
- Defaults for TypicalValue, Shutdown, Step, Archiving, Compressing, Scan, DisplayDigits, PointSource, DigitalSet and Location1-5.
- Meanings of Convers, FilterCode, SquareRoot, TotalCode, SrcPtID and UserInt1/2 / UserReal1/2 (legacy classic attributes).
- RecNo semantics (the record number in the point database).
- Whether ptclassid and ptclassrev are user-editable.

---

### da.digital-sets: Digital state sets and system states
**Facts**
- Digital points store values limited to a few discrete states. Each digital point references a digital state set through its DigitalSet attribute. [S:da-tibco-tagdef] (read) [S:da-rockwell-ftme-glossary] (read)
- The PI Base Subsystem maintains the Digital State Table. [S:da-admin-workbook-2017r2] (read)
- The system digital state set is global and applies to all points. Its factory defaults include "Shutdown", "Intf Shut" and "I/O Timeout". [S:da-uc2003-system-mgmt] (read)
- Rockwell's PI-based ME edition lists digital sets including SYSTEM, BatchAct, Phases, Modes and RABoolean. [S:da-rockwell-ftme-general] (read)
- Default DBSecurity restricts write access to PIDS (digital sets) and to PIModules and PIHeadingSets (Module Database). [S:da-uc2003-system-mgmt] (read)
- OSIsoft guidance: create dedicated state sets, include placeholders for sets that change often, and standardize sets across the enterprise, especially with PI-to-PI. [S:da-uc2003-system-mgmt] (read)
- AF enumeration sets are analogous to Data Archive digital state sets. [S:da-assets-workbook] (read)
- PI Builder can turn Data Archive digital states into AF enumeration sets by changing ObjectType DigitalStateSet to EnumerationSet and DigitalState to EnumerationValue. [S:da-pse-builder-tips-pdf] (read)
- Each archive record header stores the digital state set ID. [S:da-fb-pisrv-1351] (read)
- Reprocessing an archive uses the digital state set in the archive file's header. [S:da-fb-pida-1142] (read)
- Values can be shown in clients "as a number, time stamp, string, or digital state". System states are digital states written into numeric tags. [S:da-visualizing-workbook] (read; second sentence inferred)
- For status (0/1) tags, the 2023 talk used no exception, a 1-second scan and CompMax 8 h. Over 48 hours that stored 15 events instead of 172,800. [S:da-uc23-exc-comp] (read)
- For digital points, CompDev and ExcDev have no effect. Many users turn compression off and adjust only ExcMax. [S:da-ps-compdev-standard-thread] (read)

**Terms**
- Digital state set: a named, ordered list of state strings that a digital point's integer values map to. [S:da-tibco-tagdef] (inferred)
- System digital state set (SYSTEM): the global set of states such as Shutdown, Intf Shut and I/O Timeout, usable by any point. [S:da-uc2003-system-mgmt]

**Worked-example material**
- Valve set: 0 = CLOSED, 1 = OPEN. To add TRAVEL, append it as 2; never renumber. [S:da-fb-pida-1142] (read, example values illustrative)

**Common mistakes / pitfalls**
- Renumbering existing states corrupts the meaning of history. [S:da-fb-pida-1142] (read)

**Open questions**
- Full SYSTEM set membership and codes, for example Pt Created, No Data, Bad Input, Calc Failed, Comm Fail, Over Range, Under Range, Future Data Unsupported. Not read in any source. (verify)
- Rules on digital set size limits and state string length. (verify)

---

### da.exception-compression: Exception reporting and swinging-door compression
**Facts**
- Exception is a simple deadband filter applied only by PI Interfaces, before data is sent to the Data Archive snapshot. It reduces events sent and saves network bandwidth. [S:da-uc23-exc-comp] (read) [S:da-admin-workbook-2017r2] (read)
- Compression is applied by the Snapshot Subsystem when a value reaches the Data Archive. Since PI Buffer Subsystem 4.x it can also run as compression marking in the buffer. [S:da-uc23-exc-comp] (read) [S:da-admin-workbook-2017r2] (read)
- Compression uses the swinging door algorithm. It represents the signal as straight lines, with the reconstruction's maximum error within the compression deviation. [S:da-rockwell-ftme-glossary] (read) [S:da-ps-compression-formula-thread] (read)
- Swinging-door compression removes data that can be safely recreated by interpolation, keeping significant changes and filtering instrument and process noise. [S:da-uc23-exc-comp] (read)
- Previous-value rule for exception: when a new value passes the exception test, the interface sends both the passing value and the previous value (the last value that did not pass). [S:da-uc23-exc-comp] (read)
- Compression likewise "preserves the value just before a change in data to maintain the data fidelity". [S:da-ps-interp-thread] (read)
- ExcDev: a new value must differ from the last sent value by more than ExcDev (in engineering units) to be sent. [S:da-admin-workbook-2017r2] (read) [S:da-rockwell-ftme-glossary] (read)
- ExcMax: the longest the interface can go without reporting. After ExcMax, the next value passes the exception test even if it is inside the ExcDev deadband. [S:da-admin-workbook-2017r2] (read) [S:da-ps-compmin-thread] (read)
- ExcMin: values arriving sooner than ExcMin after the last reported value are not sent. ExcMin never forces a value to be sent, and is typically 0. [S:da-ps-compmin-thread] (read)
- CompDev: the deviation from the swinging-door line, in engineering units, that makes an event significant for archiving. [S:da-admin-workbook-2017r2] (read) [S:da-ps-help-compdev-thread] (read)
- CompMax: after CompMax seconds since the last archived event, the next event is archived regardless of deviation. [S:da-rockwell-ftme-glossary] (read)
- CompMin: the minimum time before a value can be archived. Usually 0, especially with interfaces that already do exception reporting. [S:da-rockwell-studio5000-params] (read) [S:da-ps-compmin-thread] (read)
- Defaults: ExcDevPercent 0.1, ExcMax 600 s, CompDevPercent 0.2, CompMax 28800 s; default values are not zero. [S:da-admin-workbook-2017r2] (read) [S:da-uc23-exc-comp] (read)
- Out-of-order data bypasses compression. [S:da-uc23-exc-comp] (read)
- Data backfilled before the current snapshot bypasses compression. [S:da-ps-help-compdev-thread] (read)
- Compressing = 0 means every snapshot event is archived. CompDev = 0 with compression on still drops flat-lined (identical) values. [S:da-uc23-exc-comp] (read) [S:da-ps-historize-constant-thread] (read)
- To disable exception, set ExcDev, ExcDevPercent, ExcMin and ExcMax to 0. [S:da-ps-compdev-standard-thread] (read)
- AVEVA rule of thumb: ExcDev = ½ CompDev, with CompDev ≤ instrument precision. [S:da-uc23-exc-comp] (read) [S:da-ps-compdev-standard-thread] (read)
- Method:
  1. Match instrument precision to the tag's units.
  2. Set CompDev ≤ that precision.
  3. Set ExcDev to half of CompDev.
  4. Set CompMax, ExcMax and scan class from update-frequency needs. [S:da-uc23-exc-comp] (read)
- Minimum recommended settings for non-critical tags: Compressing = 1 with CompDev = 0, and ExcDev = 0 with ExcMax greater than the scan period. [S:da-uc23-exc-comp] (read)
- Common starting points from PI Square: about 1% of span for exception and 2% for compression. [S:da-ps-help-compdev-thread] (read)
- Older guidance: ideally set compression from the process specification, usually under 1% deviation; otherwise use rated instrument precision. [S:da-uc2003-system-mgmt] (read)
- Training example: an instrument accurate to ±0.5 that reads 1.5, 1.7, 1.6 and 1.5 stores only 1.5. Some historic data can be reduced by 90% or more. [S:da-admin-workbook-2017r2] (read)
- Case results:
  - Offshore oil and gas: exception alone cut data sent by about 70%; exception plus compression cut onshore archive storage by about 94%. [S:da-uc23-exc-comp] (read)
  - Downstream oil and gas: a psig tag went from 3,157,788 to 145,938 events (95%). Half the tags met the suggested 3:1 minimum compression ratio. [S:da-uc23-exc-comp] (read)
- Benefits of good settings: faster archive queries, better cache use, less load on Update Manager, less storage and bandwidth. [S:da-uc23-exc-comp] (read)
- Problems from excess data: hitting ArcMaxCollect, slow PI Vision, longer analysis backfills. [S:da-uc23-exc-comp] (read)
- PI Buffer Subsystem marks events as "Snapshot Only" or "To Be Archived". A Snapshot Only event is removed when a new event arrives; a To Be Archived event is stored. [S:da-admin-workbook-fr] (read)
- On a stepped point, the value before a change is not archived, because it can be inferred from the last stored value. On a non-stepped point it is needed for correct interpolation. [S:da-ps-step-thread] (read)
- If Step is on and CompDev is not 0, interpolated results can be wrong. [S:da-ps-step-thread] (read)

**Terms**
- Exception reporting: interface-side deadband filtering that decides which values are sent to the snapshot. [S:da-rockwell-ftme-glossary]
- Compression: Snapshot Subsystem filtering (swinging door) that decides which snapshot events are archived. [S:da-rockwell-ftme-glossary]
- Swinging door: the compression algorithm that keeps the events needed to reconstruct the signal by straight lines within CompDev. [S:da-rockwell-ftme-glossary]
- Compression marking: compression decisions made in the PI Buffer Subsystem rather than in the snapshot. [S:da-uc23-exc-comp]

**Worked-example material**
- Thread example: ExcDev 70 and CompDev 140 units.
  - A new value is sent if it differs from the last sent value by 70, or after 10 minutes (ExcMax 600).
  - A value is archived if it deviates from the swinging-door line by 140, or after 8 hours (CompMax 28800). [S:da-ps-help-compdev-thread] (read)
- Status tag over 48 h at a 1 s scan: 172,800 events without compression, 15 events with minimal compression. [S:da-uc23-exc-comp] (read)
- Constant totalizer case: to store a value every 60 s even when unchanged, set CompMax 60, or turn compression off and set ExcMax and ExcMin appropriately. [S:da-ps-historize-constant-thread] (read)

**Common mistakes / pitfalls**
- Believing CompDev = 0 stores everything. It still drops repeated identical values; use Compressing = 0 to store every event. [S:da-ps-historize-constant-thread] (read)
- Believing ExcMin forces values to be sent. It only blocks values. [S:da-ps-compmin-thread] (read)
- Expecting connectors to honour exception settings. [S:da-ps-opcua-integrity-thread] (read)
- Setting deviations too wide filters meaningful changes; setting them too narrow keeps noise. [S:da-admin-workbook-2017r2] (read)
- Seeing writes below the deadband, which are explained by the ExcMax and CompMax time triggers. [S:da-ps-help-compdev-thread] (read)

**Open questions**
- Exact swinging-door formula (OSIsoft KB00699). Not reproduced in any readable source. (verify)
- Minimum PI Buffer Subsystem version for compression marking. (verify)

---

### da.snapshot-archive: Snapshot, event queue, archive cache
**Facts**
- The Snapshot Subsystem stores the most recent event for each point, applies compression and sends data to the event queue. [S:da-admin-workbook-2017r2] (read)
- The snapshot table file is piarcmem.dat. [S:da-admin-workbook-2017r2] (read)
- The event queue file is pimq0000.dat. [S:da-admin-workbook-2017r2] (read)
- The event queue is a "tank" between snapshot and archive; data builds up there if the archive subsystem falls behind. [S:da-admin-workbook-2017r2] (read)
- The Archive Subsystem stores and serves data after it comes out of the snapshot subsystem. [S:da-admin-workbook-2017r2] (read)
- The archive subsystem first writes incoming data to a memory write cache, which is flushed to disk every 5 minutes by default (tuning parameter Archive_SecondsBetweenFlush). [S:da-admin-workbook-2017r2] (read)
- Clients asking for snapshot data read the snapshot table before compression is applied, so real-time displays can show values that are later not archived. [S:da-admin-workbook-2017r2] (read)
- The archive subsystem has its own read cache, separate from the Windows file system cache. The read cache helps most for repeated summary calculations on the same point. [S:da-uc23-da-performance] (read)
- The Windows file system cache holds 256 KB sections of archive files after they are read from disk. [S:da-uc23-da-performance] (read)
- Out-of-order (OOO) data is caused mainly by analysis recalculation and history recovery (PI to PI, RDBMS, UFL). [S:da-uc23-da-performance] (read)
- OOO symptoms: high CPU or memory and slow archive operations. The telltale sign is message ID 2016, "Inserting overflow record". [S:da-uc23-da-performance] (read)
- OOO mitigations: reduce OOO writes, shorten archive duration, and order OOO writes within each archive file. Avoid excessive string and blob tags, Float64, sub-second timestamps and annotations. [S:da-uc23-da-performance] (read)
- The Dell 2012 benchmark used the default event-queue file size of 64 MB and page size of 64 KB. [S:da-dell-wp-2012] (read)
- Performance counters for data flow: Snapshots/sec, OutOfOrderSnapshots/sec, Queued Events/sec, Events in Overflow Queues, Archived Events/sec, Total Unflushed Events, Cache Flush Operations/sec, Events Read/sec, Current Cache Record Pool. [S:da-vcampus-2010-tuning] (read)
- `piartool -ss` shows snapshot statistics, `piartool -qs` event-queue statistics and `piartool -as` archive statistics. Each refreshes every 5 seconds. [S:da-admin-workbook-2017r2] (read)
- In SMT, Operation > Snapshot and Archive Statistics has a radio button to show snapshot-only or archive-only statistics. [S:da-admin-workbook-2017r2] (read)
- The archive "Archiving" flag in `piartool -as` output: 0 = not archiving, 1 = historic only, 2 = future only, 3 = historic and future. Healthy is 1 for Data Archive 2012 and earlier, and 3 for 2015 and later. [S:da-admin-workbook-2017r2] (read)

**Terms**
- Snapshot table (piarcmem.dat): holds the current value of every point. [S:da-admin-workbook-2017r2]
- Event queue (pimq0000.dat): the buffer between the Snapshot and Archive subsystems. [S:da-admin-workbook-2017r2]
- Archive write cache: memory cache flushed to archive files every Archive_SecondsBetweenFlush. [S:da-admin-workbook-2017r2]
- Out-of-order event: an event older than the snapshot, inserted directly into the archive. [S:da-uc23-da-performance] (inferred)
- Overflow record: an archive record created when a point's record fills, typically from OOO inserts. [S:da-uc23-da-performance] (inferred)

**Worked-example material**
- Data path for a lesson animation: Interface (exception), then pibufss, then TCP 5450, then pinetmgr, then Snapshot Subsystem (piarcmem.dat, compression), then event queue (pimq0000.dat), then Archive Subsystem write cache (flush every 5 min), then .arc file. [S:da-admin-workbook-2017r2] (inferred from read facts)

**Common mistakes / pitfalls**
- A queue growing in `piartool -qs` means the archive subsystem is not keeping up, or no primary archive covers the time. Data is not lost while it is queued. [S:da-admin-workbook-2017r2] (inferred)

**Open questions**
- Default Snapshot_EventQueueSize and EventQueuePageSize in current releases. Dell used 64 MB / 64 KB as "default" in 2012. (verify)

---

### da.archive-files: Archive files and archive shifts
**Facts**
- Archive files have the .arc extension, each with a matching .ann annotation file. [S:da-admin-workbook-2017r2] (read)
- Historic archives hold data for non-future points. Future archives hold data for future points; only they accept data more than 10 minutes ahead. The two are never mixed. [S:da-admin-workbook-2017r2] (read)
- Historic archives are fixed-size by default, with space allocated at creation. Dynamic archives grow as they fill and are meant for troubleshooting, reprocessing and backfilling. [S:da-admin-workbook-2017r2] (read) [S:da-vcampus-2010-tuning] (read)
- Fixed-size archives are required for automatic archive creation. [S:da-vcampus-2010-tuning] (read)
- Future archives are created on demand by calendar month. A new future archive is a 1 MB file spanning one month, which grows dynamically. [S:da-rs2015-future-data] (read) [S:da-admin-workbook-2017r2] (read)
- The Data Archive can only read registered archives. Registered archives can be on any drive the Data Archive can reach. [S:da-admin-workbook-2017r2] (read)
- The primary archive receives current data. It cannot be unregistered and has no end time ("current time"). [S:da-admin-workbook-2017r2] (read)
- Historic archives are sequential and do not overlap. A new archive is initialized when the primary is about 98% full. Initializing a new primary archive is called "shifting". [S:da-admin-workbook-2017r2] (read)
- If auto-archive creation is disabled, a shift promotes an empty historic archive, or overwrites the oldest archive if none is empty. [S:da-admin-workbook-2017r2] (read)
- OSIsoft recommends keeping 2 empty historic archive files. [S:da-admin-workbook-2017r2] (read)
- `piartool -al` (run from the adm folder) lists archives and shows shift progress. [S:da-admin-workbook-2017r2] (read)
- Archive file sizing guideline: (physical memory in MB) ÷ 3, or 3 × (licensed point count) / 1024 MB, whichever is smaller. Round down to a power of 2, with a minimum of 256 MB and a maximum of 10,240 MB. [S:da-admin-workbook-2017r2] (read)
- Architecture-course sizing table (licensed points to default archive MB):
  - 0-87,381: 256
  - 87,382-174,762: 512
  - 174,763-349,525: 1,024
  - 349,526-699,050: 2,048
  - 699,051-1,398,101: 4,096
  - 1,398,102-2,796,202: 8,192
  - 2,796,203 or more: 10,240 (cap) [S:da-arch-workbook] (read)
- 2023 guidance: archive file size should be no more than one third of system RAM, so that three archives fit in memory. [S:da-uc23-da-performance] (read)
- Archive_AutoArchiveFileSize sets the size of the next auto-created primary archive. [S:da-admin-workbook-2017r2] (read) [S:da-uc23-da-performance] (read)
- Archive_AutoArchiveFileRoot sets the location and name root of auto-created historic archives; clearing it disables auto-creation. Archive_FutureAutoArchiveFileRoot is the future equivalent. [S:da-admin-workbook-2017r2] (read)
- Archive_AutoArchiveFileExt and Archive_AutoArchiveFileFormat control naming of auto-created archives. [S:da-admin-workbook-2017r2] (read)
- Archives and the event queue should be on separate local volumes, so reads and writes can run at the same time. Archives go on the largest drive and event queues on the second largest. [S:da-admin-workbook-2017r2] (read) [S:da-arch-workbook] (read)
- Disk estimates:
  - Archives: 10 MB per 1,000 points.
  - Event queue: 5 MB per 1,000 points.
  - Databases: 11 MB per 1,000 points + 1 MB.
  - Message logs: 10 MB. [S:da-arch-workbook] (read)
- SMT Operation > Archives has "Historic" and "Future" tabs, used to view properties, register and unregister, create archives and force an archive shift. [S:da-admin-workbook-2017r2] (read)
- `pidiag -archk <file>` checks an archive file and shows its storage map, including the PointIDs it contains. [S:da-vcampus-2010-tuning] (read) [S:da-ps-piarch-thread] (read)
- Reprocessing archives (piarchss offline, or the Offline Archive Utility) repairs errors, rearranges records for faster reads and makes space for new tags. [S:da-vcampus-2010-tuning] (read) [S:da-uc2011-tips-trenches] (read)
- Archive_ReprocessThreadCount should be 1 for PI Data Archive 2018 SP2 and later (2023 guidance). [S:da-uc23-da-performance] (read)
- In the Dell benchmark, 8 GB archives for about 14K points shifted about every 45 minutes, and each shift took 10 s on average. [S:da-dell-wp-2012] (read)

**Terms**
- Primary archive: the archive receiving current data, with no end time. [S:da-admin-workbook-2017r2]
- Archive shift: initializing a new primary archive when the current one is about 98% full. [S:da-admin-workbook-2017r2]
- Fixed archive: an archive whose full size is allocated at creation. [S:da-admin-workbook-2017r2]
- Dynamic archive: an archive that grows as it fills; used for reprocessing and backfill. [S:da-admin-workbook-2017r2]
- Registered archive: an archive the Data Archive knows and can read. [S:da-admin-workbook-2017r2]
- Future archive: a monthly archive for future points. [S:da-rs2015-future-data]

**Worked-example material**
- Sizing exercise: a server with 16 GB RAM (16,384 MB) and 200,000 licensed points.
  - RAM ÷ 3 = 5,461 MB.
  - 3 × 200,000 / 1024 = 586 MB.
  - The smaller is 586 MB, rounded down to a power of 2 = 512 MB.
  - The table also gives 512 MB for 174,763-349,525 points. [S:da-admin-workbook-2017r2] [S:da-arch-workbook] (inferred calculation)

**Common mistakes / pitfalls**
- Clearing Archive_AutoArchiveFileRoot without keeping empty archives causes the oldest archive to be overwritten at the next shift. [S:da-admin-workbook-2017r2] (read)
- Using dynamic archives for normal operation. They are meant only for backfill jobs. [S:da-vcampus-2010-tuning] (read)
- Reading archive files directly is unsupported. Restore a backup on a licensed server, or export the data. [S:da-ps-piarch-thread] (read)

**Open questions**
- piarcreate syntax (for example `piarcreate <path> <sizeMB>` plus a dynamic flag). Not read. (verify)
- `piartool -ar` / `-au` (register and unregister) syntax. (verify)

---

### da.backfill: Backfilling, out-of-order data and future data
**Facts**
- Future data was introduced in PI Data Archive 2015. It can store data from January 1970 through January 2038. [S:da-admin-workbook-2017r2] (read) [S:da-assets-workbook] (read)
- A point's Future attribute determines which archive set it uses: Future = true uses the Future Archive Set, Future = false uses the Historical Archive Set. [S:da-emea14-future-data] (read)
- Future archives are created on demand by calendar month, sized dynamically and suited to sparse data. Separate storage allows different retention policies. [S:da-rs2015-future-data] (read)
- Before 2015, users stored future data through workarounds. [S:da-wwwtest-future-page] (read)
- Out-of-order data (backfill) bypasses compression. [S:da-uc23-exc-comp] (read) [S:da-ps-help-compdev-thread] (read)
- Dynamic archives should be kept for backfilling jobs only (KB 2998OSI8). [S:da-vcampus-2010-tuning] (read)
- Backfill sources include analysis recalculation and history recovery through PI to PI, RDBMS and UFL. Heavy OOO writes cause overflow records (message 2016). [S:da-uc23-da-performance] (read)
- Even 11% compression cut an analysis backfill (about one month) by about 20% in one case study. [S:da-uc23-exc-comp] (read)
- In the Dell test, after a simulated outage, buffered data recovery raised rates more than 32% above nominal, with a snapshot peak of 799K events/s. [S:da-dell-wp-2012] (read)
- PI-to-PI writing through pibufss locks points. Non-buffered writes to buffered points can return error -11414 (KB00093 covers clearing buffer ownership). [S:da-ps-pointsource-thread] (read)

**Terms**
- Backfilling: writing historical (older than snapshot) data into the archive. [S:da-uc23-da-performance] (inferred)
- Future point: a point with Future = true, storing data in future archives. [S:da-emea14-future-data]

**Worked-example material**
- Forecast tag: a Future=true point receives hourly forecasts timestamped `*+1h` to `*+48h`, stored in monthly future archives. [S:da-assets-workbook] [S:da-rs2015-future-data] (inferred)

**Common mistakes / pitfalls**
- Writing future timestamps (more than 10 minutes ahead) to a non-future point is rejected, because only future archives accept them. [S:da-admin-workbook-2017r2] (read)
- The Future attribute must be set at creation. [S:da-ps-webapi-create-thread] (inferred - verify that it cannot be changed later)

**Open questions**
- Whether the Future attribute can be changed after creation. (verify)
- The exact error or state returned when writing future data to a historical point (for example "Future Data Unsupported"). (verify)

---

### da.annotations: Annotations
**Facts**
- Each archive (.arc) file has a matching annotation file (.ann). [S:da-admin-workbook-2017r2] (read)
- PI Server stores events with optional annotations, alongside quality, substitution and change flags. [S:da-rs2011-pisystem2010] (read)
- In 2010, archive storage was described as "Archive and Annotation Files". [S:da-rs2011-pisystem2010] (read)
- Heavy use of annotations is listed among the things to avoid or limit for archive performance. [S:da-uc23-da-performance] (read)

**Terms**
- Annotation: a note or object attached to an individual archived event, stored in the .ann file. [S:da-admin-workbook-2017r2] (inferred)

**Open questions**
- Annotation size limits, how annotations are created in clients (PI DataLink / PI Vision / AF SDK), and how they are backed up. (verify)

---

### da.batch-msglog: PI Batch (legacy) and the PI Message Log
**Facts**
- Older PI Servers had a PI BatchDB and a PI ModuleDB as configuration databases. [S:da-uc2002-251] (read)
- PI Server 2015 added migration of the batch database to Event Frames. [S:da-uc2015-roadmap-hughes] (read)
- RtReports 4.0 added a batch-to-Event-Frames migration process. [S:da-uc2015-roadmap-hughes] (read)
- The PI Message Subsystem records status and error messages in a log file. [S:da-admin-workbook-2017r2] (read)
- PI message log files are named pimsg_YYMMDD-style .dat files; the example pimsg_1120731.dat is 31 Jul 2012. They are binary, live in PI\log on servers (PIPC\log on clients) and are locked by the Message Subsystem. [S:da-ps-msglog-blog] (read)
- If the Message Subsystem is down, messages go to the Windows Application Event Log. They are copied into the PI log when it comes back. [S:da-ps-msglog-blog] (read)
- Message logs expire after 35 days, controlled by the MessageLog_DayLimit tuning parameter (introduced with PI SDK 1.4.0.416 / PI Server 3.4.380 SP1). [S:da-ps-msglog-blog] (read)
- pigetmsg syntax:
  - `pigetmsg -f`: follow / continuous view.
  - `pigetmsg -st *-2h -et *`: time window.
  - `-of <file>`: output file.
  - Severity filters `-si`, `-sw`, `-se`, `-sc` (default minimum is Debug).
  - Formats `-fc` (CSV), `-ft` (two-line), `-fw` (one-line), `-fx` (XML).
  - `-oa`: all fields.
  - `-src` / `-pr`: filter by source or program.
  - `-msg "*text*"`: message-text filter with `*` and `?` wildcards.
  - `-top pr` / `-top pid`: summary counts. [S:da-ps-msglog-blog] (read)
- Default pigetmsg output fields: MessageSeverity, MessageTime, ProcessHost, ProcessName, Source1-3, Message, MessageID. [S:da-ps-msglog-blog] (read)
- SMT Operation > Message Logs shows the PI Message Log with start and end time, severity, source and text filters, and exports to CSV, XML, text or RTF. [S:da-ps-msglog-blog] (read)
- `pidiag -e <code>` translates error codes, for example `pidiag -e -11057`. [S:da-ps-msglog-blog] (read)
- PowerShell `Get-PIMessage -Connection $con -SeverityType Error -StartTime ... -EndTime ...` (OSIsoft.PowerShell module). [S:da-ps-msglog-blog] (read)
- Message examples:
  - [-11091] Event collection exceeded the maximum allowed.
  - [-11140] Archive query exceeded maximum execution time.
  - [-10767] Client exceeded maximum concurrent queries.
  - 2016 Inserting overflow record.
  - 6079 point creation (pibasess). [S:da-uc23-da-performance] (read)
- Legacy pipc.log was a plain-text log used by older PI API apps. `Migratelog=1` in pipc.ini forwards it to the PI Message Log. [S:da-ps-msglog-blog] (read)

**Terms**
- PI Message Log: the binary log of Data Archive and PI SDK messages, read with pigetmsg or SMT. [S:da-ps-msglog-blog]
- pigetmsg: the command-line utility for reading the PI Message Log. [S:da-ps-msglog-blog]
- PI Batch Database (legacy): the Data Archive store for batch records, superseded by AF Event Frames. [S:da-uc2015-roadmap-hughes] (inferred)

**Worked-example material**
- `pigetmsg -sw -st *-2h -et * -msg *[-11091]* -of C:\Temp\arcmax.txt` finds ArcMaxCollect hits in the last 2 hours, warnings and above. [S:da-ps-msglog-blog] [S:da-uc23-da-performance] (inferred combination)

**Common mistakes / pitfalls**
- Users without read permission on the message log cannot troubleshoot write failures. [S:da-ps-string-thread] (read)

**Open questions**
- PI Batch subsystem details (pibatch, the PIUnitBatch tables) and when it was removed. (verify)

---

### da.security: Data Archive security
**Facts**
- Authentication options in preference order (2023):
  1. OpenID Connect (PI Server 2023+).
  2. Windows Integrated Security (Kerberos or NTLM).
  3. PI Trusts.
  4. Explicit logins (PI Users). [S:da-uc23-security] (read)
- Windows Integrated Security is the recommended model. PI Connectors must use it. PI Interfaces can use PI Trust or WIS (with PI API for WIS). [S:da-arch-workbook] (read)
- PI Identities define permission sets. PI Mappings associate Windows users or groups (AD) with PI Identities. PI Users and PI Groups are legacy and not recommended. [S:da-uc23-security] (read)
- PI Identities have no password, cannot be used for explicit login and cannot contain PI Users. [S:da-rs2010-rome-arch] (read)
- Example role identities: PIOperators, PIEngineers, PISupervisors. [S:da-rs2010-rome-arch] (read)
- Kerberos requires the PI Server to be a domain member. One-way domain trusts are supported, with the server domain trusting the client domain. NTLM with local accounts requires matching passwords. [S:da-rs2010-rome-arch] (read)
- A PI Trust matches on application name, client IP address and netmask, FQDN and short hostname. A trust specifying only the server name is "open" and a major vulnerability. Use at least two identifiers. [S:da-uc23-security] (read)
- "It is not safe practice to map trusts to the piadmin user." [S:da-arch-workbook] (read)
- Older PI API connections are identified by an application name made of the first four letters of the interface name plus "E", for example OPCpE. [S:da-arch-workbook] (read)
- Do not use the default piadmin account; use the piadmins group (identity) instead, and verify piadmin has a password. [S:da-uc23-security] (read)
- Disable explicit logins after mappings replace them. The tools have settings to disable explicit login, disable explicit login for piadmin and disable blank passwords, followed by a restart of the PI Base Subsystem. [S:da-uc23-security] (read)
- Explicit logins are disabled by default and are the least secure option. [S:da-uc23-security] (read)
- Hardening checklist (2010): use the Security Tool, protect or disable PIADMIN, disable explicit logins, force login for piconfig, retire SDK-based trusts, configure the server firewall, disable the PIWorld identity. [S:da-rs2010-rome-arch] (read)
- piadmins has write access to the PI Module Database by default, which is why PI ICU runs under that identity. [S:da-arch-workbook] (read)
- Database security is assigned per table in SMT Security > Database Security; for example, an interface identity gets Read/Write on PIPOINT. [S:da-admin-workbook-2017r2] (read) [S:da-arch-workbook] (read)
- Mappings and trusts are created in SMT Security > Mappings & Trusts. Identities are created in Security > Identities, Users, & Groups. [S:da-admin-workbook-2017r2] (read)
- Access levels are read-only, write-only (special cases), read-write and no access. [S:da-uc23-security] (read)
- PtSecurity controls viewing and editing point configuration. DataSecurity controls viewing, editing or writing values and timestamps. [S:da-uc23-security] (read)
- Permissions for an interface with PI Buffer (no outputs):
  - Interface: read on PIPoint, DBSecurity, PtSecurity, DataSecurity.
  - PI Buffer: write on DataSecurity. [S:da-uc23-security] (read)
- PI Buffer Subsystem supports WIS natively from 3.4.380.79. [S:da-uc23-security] (read)
- PI API for WIS 2.0.1.35+ extends WIS to interfaces. Configure mappings before upgrading, because PI Trust authentication is disabled by default after the upgrade. [S:da-uc23-security] (read)
- PI Server 2023 added OIDC authentication through AVEVA Identity Manager (AIM). TLS certificates are optional but required for OIDC. [S:da-uc23-security] (read)
- Training lab example: identity "PI Interfaces" mapped to gMSA PISCHOOL\SVC-PIINT$, and "PI Buffer" mapped to PISCHOOL\SVC-PIBUFFER$. gMSA is the preferred service account type. [S:da-arch-workbook] (read)
- Sample message-log line: "Identity List: PIOperators | PIWorld". [S:da-uc23-security] (read)
- Older guidance: use a dedicated PI user for custom applications and assign a DataOwner on output points. [S:da-uc2003-system-mgmt] (read)
- Kerberos troubleshooting:
  - Set LogLevel=1 under `HKLM\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters`.
  - Run `klist purge`.
  - Check SPNs with `setspn -l` and `setspn -q PIServer/<hostname>`. [S:da-uc23-security] (read)
- Anti-virus: exclude archive, queue and log folders. On Server Core use WDAC; elsewhere use AppLocker, tested in audit mode first. [S:da-uc23-security] (read)

**Terms**
- PI Identity: a Data Archive security principal (role) that permissions are granted to. [S:da-uc23-security]
- PI Mapping: a link from a Windows user or AD group to a PI Identity. [S:da-uc23-security]
- PI Trust: a legacy rule authenticating a connection by application name, IP or hostname. [S:da-uc23-security]
- piadmin: the built-in superuser account; do not use it day to day. [S:da-uc23-security]
- piadmins: the built-in administrators identity to map admin AD groups to. [S:da-uc23-security]
- PIWorld: the built-in identity representing all users (often given read access). [S:da-rs2010-rome-arch]
- Explicit login: username/password login with PI User accounts; least secure. [S:da-uc23-security]
- Database security (DBSecurity): per-table access control on Data Archive configuration tables. [S:da-uc23-security]

**Worked-example material**
- ACL string format: `piadmins: A(r,w) | PIOperators: A(r) | PIWorld: A(r)`. The format is from `pi_users:A(r,w) | bob:A(r,w) | PIWorld:A(r)`. [S:da-rs2010-rome-arch] (read; identity names adapted)
- Mapping exercise: map DOMAIN\PI-Admins (AD group) to piadmins in Security > Mappings & Trusts. [S:da-arch-workbook] (read; group name illustrative)

**Common mistakes / pitfalls**
- Open trusts (server name only), and trusts or mappings to piadmin. [S:da-uc23-security] (read) [S:da-arch-workbook] (read)
- Upgrading the PI API for WIS before creating mappings, which breaks interfaces because trusts are disabled after the upgrade. [S:da-uc23-security] (read)

**Open questions**
- Full list of DBSecurity table names (PIPOINT, PIDS, PIModules, PIHeadingSets, PIBatch, PIARCADMIN, PIARCDATA, PIMSGSS, PITUNING, PIUSER, PIBACKUP, ...). Only some are read. (verify)
- Whether PIWorld is disabled by default on new installs. (verify)

---

### da.subsystems: Data Archive subsystems
**Facts**
- OSIsoft training's core subsystems (all Windows services, visible in SMT Operation > PI Services and in services.msc as services starting with "PI"):
  - PI Network Manager
  - PI Message Subsystem
  - PI License Manager
  - PI Update Manager
  - PI Base Subsystem
  - PI Snapshot Subsystem
  - PI Archive Subsystem
  - PI Backup Subsystem [S:da-admin-workbook-2017r2] (read)
- PI Base Subsystem: maintains the Point Database, Digital State Table, authentication configuration databases and PI Module Database. [S:da-admin-workbook-2017r2] (read)
- PI Snapshot Subsystem: keeps the latest event per point, applies compression and feeds the event queue. [S:da-admin-workbook-2017r2] (read)
- PI Archive Subsystem: stores and serves data after the snapshot. [S:da-admin-workbook-2017r2] (read)
- PI Message Subsystem: writes status and error messages to the log. [S:da-admin-workbook-2017r2] (read)
- PI License Manager: maintains license information for the Data Archive and connected applications. [S:da-admin-workbook-2017r2] (read)
- PI Network Manager: manages communication between subsystems, interfaces and clients, and validates clients on connection. [S:da-admin-workbook-2017r2] (read)
- PI Update Manager: queues notifications of changes to values, point attributes and modules for subscribed clients. [S:da-admin-workbook-2017r2] (read)
- PI Backup Subsystem: manages Data Archive backups. [S:da-admin-workbook-2017r2] (read)
- Process names seen in message-log sources: pibasess, pinetmgr, pilicmgr, piarchss, pisnapss. [S:da-ps-msglog-blog] (read)
- Thread-count tuning parameters: piarchss_ThreadCount (archive reader threads) and pisnapss_ThreadCount (snapshot writer threads); the Dell test used 64 and 16. [S:da-dell-wp-2012] (read)
- piarchss_ThreadCount controls how many RPC requests run at once. Suggested values: number of cores minus 1 for standard use, 2x cores for large-query systems without real-time users. [S:da-uc23-da-performance] (read)
- `piartool -thread piarchss -info` dumps archive-subsystem RPC threads with duration and client connection ID. Durations over 1000 ms are long. [S:da-uc23-da-performance] (read)
- Stop all services with pisrvstop.bat and start with pisrvstart.bat (as administrator). Never edit pisrvstop.bat; put custom commands in pisrvsitestop.bat. [S:da-admin-workbook-2017r2] (read)
- Subsystem performance counters: RPC Request in Queue, RPC Thread Active, Transaction Completed/sec, Messages Sent/Received per second. [S:da-vcampus-2010-tuning] (read)
- The PI Totalizer (PE Totalizer), PI ACE and Performance Equations were part of the 2010 analytics set. [S:da-rs2011-pisystem2010] (read)

**Terms**
- pibasess: PI Base Subsystem process. [S:da-ps-msglog-blog]
- pisnapss: PI Snapshot Subsystem process. [S:da-ps-msglog-blog]
- piarchss: PI Archive Subsystem process. [S:da-ps-msglog-blog]
- pinetmgr: PI Network Manager process. [S:da-ps-msglog-blog]
- pilicmgr: PI License Manager process. [S:da-ps-msglog-blog]

**Worked-example material**
- PI Services screen mockup rows (Name / Status): PI Network Manager, PI Message Subsystem, PI License Manager, PI Update Manager, PI Base Subsystem, PI Snapshot Subsystem, PI Archive Subsystem, PI Backup Subsystem. [S:da-admin-workbook-2017r2] (read)

**Common mistakes / pitfalls**
- Editing pisrvstop.bat directly; it is overwritten on upgrade. Use pisrvsitestop.bat. [S:da-admin-workbook-2017r2] (read; overwrite reason inferred)

**Open questions**
- Executable names piupdmgr, pimsgss and pibackup, and the optional subsystems pitotal, pipeschd (Performance Equation Scheduler), pialarm, piaflink, pisqlss, pirecalc and pibatch. Not read in any source. (verify)
- Start/stop order of the subsystems. (verify)

---

### da.tools: Command-line tools and SMT
**Facts**
- SMT (System Management Tools) plug-in paths used in OSIsoft training:
  - Points > Point Builder
  - Operation > PI Services
  - Operation > Network Manager Statistics
  - Operation > Snapshot and Archive Statistics
  - Operation > Archives
  - Operation > Tuning Parameters (Archive tab)
  - Operation > Message Logs
  - Security > Database Security
  - Security > Mappings & Trusts
  - Security > Identities, Users, & Groups
  - Data > Current Values
  [S:da-admin-workbook-2017r2] (read) [S:da-ps-msglog-blog] (read)
- SMT's Archive Editor can view and edit archived values. [S:da-ps-string-thread] (read)
- piartool commands (run from %piserver%adm):
  - `-ss` snapshot statistics, `-qs` event-queue statistics, `-as` archive statistics (each every 5 s).
  - `-al` list archives and shift progress.
  - `-thread piarchss -info` thread dump. [S:da-admin-workbook-2017r2] (read) [S:da-uc23-da-performance] (read)
- `piartool -backup` can back up a number of archives counted back from now (`-numarch`) or a list of archive numbers (`-archives`). It cannot take a range of older archives. [S:da-fb-pida-1092] (read)
- piconfig is the Data Archive command-line configuration utility. Commands start with `@` (the default command character), comments with `*`, and the default field delimiter is a comma. [S:da-livelibrary-piconfig] (read)
- piconfig commands include:
  - `?`, `?atr` (attributes of current table), `?tbl` (tables)
  - `@case`, `@cd`, `@clear`
  - `@echo` (Data, Commands, All, Verbose, None; default Data)
  - `@endsection` (`@ends`), `@endrecord`, `@exit` / `@quit` / `@bye`
  - `@input`, `@istructure` (`@istr`), `@istype` (F, D, K; default D)
  - `@line` [S:da-livelibrary-piconfig] (read)
- Standard piconfig pattern: `@tabl <table>`, `@mode <mode>`, `@istr` / `@ostr <attribute list>`, data lines, `@ends`. [S:da-ps-piarch-thread] (read)
- Read archive values with piconfig:
  ```
  @table piarc
  @ostr tag,value,timestamp
  @istr tag,starttime,endtime
  sinusoid,*-2h,*
  ```
  [S:da-ps-piarch-thread] (read)
- `pidiag -archk <archive file>` checks an archive. `pidiag -tz` checks localhost.tz. `pidiag -e <code>` translates error codes. [S:da-vcampus-2010-tuning] (read) [S:da-uc2011-tips-trenches] (read) [S:da-ps-msglog-blog] (read)
- apisnap is a PI API tool listed in training for checking snapshots from interface nodes. [S:da-admin-workbook-2017r2] (read)
- PI PowerShell (OSIsoft.PowerShell): Connect-PIDataArchive, Get-PIDataArchiveConnectionConfiguration, Get-PIMessage. [S:da-ps-msglog-blog] (read)
- In 2002, the SMT install kit (March 2002) installed PI-SDK 1.1. Older tools included PI-Tag Configurator (Excel bulk build) and PI-HealthCheck. [S:da-uc2002-251] (read)

**Terms**
- SMT: PI System Management Tools, the MMC-style admin console with plug-ins. [S:da-admin-workbook-2017r2]
- piconfig: a scriptable command-line tool for reading and editing Data Archive tables. [S:da-livelibrary-piconfig]
- piartool: a command-line tool for archive, snapshot, queue and backup operations. [S:da-admin-workbook-2017r2]
- pidiag: a diagnostic command-line tool (archive check, time zone, error lookup). [S:da-vcampus-2010-tuning]

**Worked-example material**
- piconfig create-point script, using the standard pattern; the attribute list is from the sourced attribute names:
  ```
  @tabl pipoint
  @mode create,t
  @istr tag,pointsource,pointtype,descriptor,engunits,location1,location4,instrumenttag
  TANK01.LEVEL,OPC,Float32,Tank 1 level,m,1,2,Channel1.Device1.Level
  @ends
  ```
  The structure is sourced; the `create,t` mode token is NOT verified. [S:da-ps-piarch-thread] [S:da-rockwell-ftse-attrs] (inferred - verify)
- SMT mockup screens and fields:
  - Point Builder General tab: Name, Server, Descriptor, Point Source, Point Type, Point Class, Eng Units, Display Digits, Digital Set, Instrument Tag, ExDesc, Location1-5, Scan.
  - Point Builder Archive tab: Archiving, Step, Compressing, CompDev / CompDevPercent, CompMin, CompMax, ExcDev / ExcDevPercent, ExcMin, ExcMax, Zero, Span, Typical Value, Shutdown.
  - Point Builder Security tab: PtSecurity, DataSecurity.
  - Point Builder classic tab: UserInt/UserReal, SquareRoot, TotalCode, Convers, FilterCode, SrcPtID.
  - Archives screen: File, Start, End, Size, % Used, Type (Fixed/Dynamic), Registered, with Historic/Future tabs.
  - [S:da-admin-workbook-2017r2] [S:da-ps-historize-constant-thread] [S:da-rockwell-ftse-attrs] (inferred grouping - verify tab names)

**Common mistakes / pitfalls**
- piconfig in non-interactive mode stops after a number of errors set by `@line`. Check output for errors after bulk imports. [S:da-livelibrary-piconfig] (read, default value unclear - verify)

**Open questions**
- `@mode` values (list, create, edit, delete) and the `,t` flag. `@select` / `@sele` syntax and wildcards. (verify)
- pilistupd, pisnap.bat, `piartool -fs` / `-lic` syntax. Not read in any source. (verify)

---

### da.collectives: PI Data Archive collectives
**Facts**
- A PI Data Archive collective is a set of servers acting as one to maximize client data access. Members hold identical time-series data. [S:da-rs2011-arch-best-practices] (read)
- Replication synchronizes configuration across servers (points, point configuration, security), creating alternate data sources. Time-series data is not replicated; interfaces send it to every member. [S:da-arch-workbook] (read) [S:da-uc2011-tips-trenches] (read) [S:da-uc23-da-performance] (read)
- Interfaces can buffer data to multiple servers that share the same point configuration (n-way buffering). [S:da-arch-workbook] (read; "n-way" label inferred)
- During a member's downtime, data is buffered in the PI Buffer Subsystem, and configuration resynchronizes when the member returns. [S:da-uc2011-tips-trenches] (read)
- PI Collective Manager is the tool to create a collective, view the status of collectives and members and edit their properties. [S:da-arch-workbook] (read)
- Collective benefits: rolling upgrades, no single point of failure, geographic distribution, availability during maintenance, and removing the "fear of a bad backup". [S:da-uc2011-tips-trenches] (read) [S:da-rs2010-rome-arch] (read)
- Keep members identical in hardware and installed PI software. [S:da-uc2011-tips-trenches] (read)
- Client connection preferences (PI SDK): PreferPrimary, RequirePrimary, Any (default Any). ProcessBook used a ProcBook.ini [Collective Preference] section. [S:da-uc2011-tips-trenches] (read)
- Since AF Client 2018, connections are balanced across all available members. [S:da-uc23-da-performance] (read)
- Point expensive clients at the secondary member. [S:da-uc23-da-performance] (read)
- The 2012 Dell benchmark used nine interface nodes feeding a two-node PI collective. [S:da-dell-wp-2012] (read)
- For collectives with virtualization, each member must run on a different host. [S:da-vcampus-2010-tuning] (read)
- AF high availability is separate: SQL Server clustering, mirroring or AF collective (replication) in older releases. [S:da-rs2010-rome-arch] (read)

**Terms**
- Collective: a set of PI Data Archive servers (one primary, one or more secondaries) acting as one. [S:da-rs2011-arch-best-practices]
- Primary member: the member where configuration changes are made and replicated from. [S:da-arch-workbook] (inferred)
- Secondary member: a copy of the primary's configuration that receives the same time-series data. [S:da-uc23-da-performance]
- N-way buffering: the PI Buffer Subsystem sending the same data to every collective member. [S:da-arch-workbook] (inferred)

**Worked-example material**
- Lab: PISRV01 is the primary and PISRV02 the secondary, created with PI Collective Manager. [S:da-arch-workbook] (read)

**Common mistakes / pitfalls**
- Putting a load balancer in front of the Data Archive instead of using collective preferences. [S:da-uc2011-tips-trenches] (read)
- Expecting secondaries to receive data by replication; they only get configuration. [S:da-uc2011-tips-trenches] (read)

**Open questions**
- Exactly which tables are and are not replicated (for example, are tuning parameters and the message log per member?). (verify)
- Whether secondaries accept configuration edits. Believed read-only for configuration. (verify)

---

### da.backup: Backups
**Facts**
- The PI Backup Subsystem manages Data Archive backups. [S:da-admin-workbook-2017r2] (read)
- What needs backing up:
  - Subsystems (Windows services).
  - Data files: snapshot, event queues, archives.
  - Configuration: PI point configuration, tuning parameters.
  - The hardware underneath. [S:da-admin-workbook-2017r2] (read)
- `piartool -backup` supports `-numarch <n>` (the latest n archives) and `-archives <list>` (specific archive numbers). [S:da-fb-pida-1092] (read)
- VSS (Volume Shadow Copy Service) support enables PI backups. [S:da-rs2010-rome-arch] (read)
- PIBackup.bat calls AFBackup.bat for AF. The AF SQL backup runs the stored procedure dbo.usp_backup on the PIFD database, for example `sqlcmd -S <instance> -d PIFD -Q "EXEC dbo.usp_backup @outpath = N'<path>';" -E`. [S:da-fb-pida-84] (read)
- Recommendation: daily incremental backups off-peak with Windows Task Scheduler, using a two-phase strategy (local backup first, then copy to a separate server). [S:da-uc23-security] (read)
- A rollback backup during upgrades needs space equal to the databases plus the primary archive. [S:da-arch-workbook] (read)
- Workaround for copying older archives to another server: unregister them, copy, register the copies, then re-register the originals. [S:da-fb-pida-1092] (read)
- PowerShell has a Start-PIBackup cmdlet (OSIsoft.PowerShell). [S:da-pshell-startpibackup] (title only - readable:false)

**Terms**
- PI Backup Subsystem: the service that coordinates Data Archive backups. [S:da-admin-workbook-2017r2]
- VSS: Windows Volume Shadow Copy Service, used by PI backups. [S:da-rs2010-rome-arch]

**Common mistakes / pitfalls**
- Keeping backups only on the same server. Copy them to a separate server. [S:da-uc23-security] (read)
- AF backup naming is not customisable without editing scripts. [S:da-fb-pida-84] (read)

**Open questions**
- Exact pibackup.bat syntax (for example `pibackup <path> <numarch> <cutoff>` and `-install`), and the default backup folder. (verify)
- Full and incremental backup semantics. (verify)

---

### da.tuning: Tuning parameters
**Facts**
- Archive_SecondsBetweenFlush: archive write-cache flush interval, default 5 minutes. [S:da-admin-workbook-2017r2] (read)
- ArcMaxCollect: the maximum compressed events one query can return, default 1.5 million. Hitting it logs [-11091]. [S:da-uc23-da-performance] (read)
- Archive_MaxQueryExecutionSec: the maximum archive query run time, default 260 s; exceeding it logs [-11140]. [S:da-uc23-da-performance] (read)
- piarchss_ThreadCount: the number of concurrent archive RPC threads (see subsystems). [S:da-uc23-da-performance] (read)
- Archive_ReprocessThreadCount: set to 1 for 2018 SP2 and later. [S:da-uc23-da-performance] (read)
- Archive_CacheRecordsPerPoint relates to the archive read cache. [S:da-uc23-da-performance] (read)
- Archive_CacheRecordPool is named as an archive tuning parameter. [S:da-vcampus-2010-tuning] (read)
- Archive_AutoArchiveFileRoot, Archive_FutureAutoArchiveFileRoot, Archive_AutoArchiveFileSize, Archive_AutoArchiveFileExt and Archive_AutoArchiveFileFormat control automatic archive creation. Archive_LowDiskSpaceMB is a low-disk threshold. [S:da-admin-workbook-2017r2] (read)
- Snapshot_EventQueuePath sets where the event queue lives; Snapshot_EventQueueSize is in MB. [S:da-vcampus-2010-tuning] (read)
- MaxUpdateQueue and TotalUpdateQueue limit Update Manager queues; 2010 guidance said not to change them. [S:da-vcampus-2010-tuning] (read)
- EnableAudit turns on auditing. [S:da-admin-workbook-2017r2] (read)
- Server_AuthenticationPolicy, AutoTrustConfig (recommended 0) and MaxConnIdleTime (seconds) are basic server settings. [S:da-vcampus-2010-tuning] (read)
- MessageLog_DayLimit sets message-log retention, default 35 days. [S:da-ps-msglog-blog] (read)
- Tuning parameters are viewed and changed in SMT Operation > Tuning Parameters, which has an Archive tab. [S:da-admin-workbook-2017r2] (read)
- PI Buffer settings used in the Dell test: BUF1SIZE and BUF2SIZE 2,000,000 bytes, MAXTRANSFEROBJS 10,000, SENDRATE 10 ms. [S:da-dell-wp-2012] (read)
- Memory guidance (2010): 2 GB minimum, up to 8 KB per point. Storage estimate 5-20 bytes per event. [S:da-vcampus-2010-tuning] (read)

**Terms**
- Tuning parameter: a named Data Archive configuration setting (PITimeout table) controlling subsystem behaviour. [S:da-admin-workbook-2017r2] (inferred)
- ArcMaxCollect: the per-query event limit protecting the server from huge queries. [S:da-uc23-da-performance]

**Worked-example material**
- Troubleshooting card: a user's year-long raw-data query fails. Check pigetmsg for [-11091]. Options: page the query, or raise ArcMaxCollect from 1.5 million with care. [S:da-uc23-da-performance] [S:da-ps-piarch-thread] (inferred)

**Common mistakes / pitfalls**
- Raising piarchss_ThreadCount without clients able to use the threads. [S:da-uc23-da-performance] (read)

**Open questions**
- Snapshot_EventQueuePageSize name and default. Archive_MaxQueueSize does not appear in any source. (verify)
- Whether tuning parameters live in the PITimeout table (as the 2003 deck calls it, "timeout table"). [S:da-uc2003-system-mgmt] (read, partial - verify)
