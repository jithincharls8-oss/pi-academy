# COVERAGE.md: master coverage checklist

This file drives the in-app coverage dashboard. `npm run coverage` recounts the Lessons, Questions
and Terms columns from `/content` (every content item lists the coverage ids it covers). The Status
column is maintained by hand and by the content subagents.

Status values:
- `not started`: no content yet
- `drafted`: lessons/questions/terms written from sources, not independently re-checked
- `reviewed`: re-checked against the cited sources by a second pass
- `verified`: every claim traced to a readable primary source, no open `verify` flags

Targets per item: at least 1 lesson, 8 questions and 4 glossary terms (more for large items).

<!-- coverage:start -->
## 1. Foundations (`foundations`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| fnd.history | OSIsoft to AVEVA history | drafted | 1 | 11 | 5 |
| fnd.historian | The historian concept | drafted | 1 | 9 | 5 |
| fnd.timeseries | Time-series basics | drafted | 1 | 13 | 5 |
| fnd.architecture | PI System architecture | drafted | 1 | 13 | 8 |
| fnd.licensing | Licensing and editions | drafted | 1 | 15 | 8 |
| fnd.connect | PI System vs AVEVA CONNECT | drafted | 1 | 11 | 4 |

## 2. PI Data Archive (`data-archive`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| da.points | Points and point classes | drafted | 1 | 11 | 9 |
| da.point-attributes | Point attributes (pointtype, pointsource, compressing, compdev, compmax, compmin, excdev, excmax, excmin, scan, span, zero, step, location1-5, instrumenttag, ...) | drafted | 1 | 18 | 23 |
| da.digital-sets | Digital state sets and system states | drafted | 1 | 11 | 5 |
| da.exception-compression | Exception and compression | drafted | 1 | 13 | 11 |
| da.snapshot-archive | Snapshot vs archive and the event queue | drafted | 1 | 14 | 9 |
| da.archive-files | Archive files, shifts and management | drafted | 1 | 15 | 5 |
| da.backfill | Backfilling, out-of-order and future data | drafted | 1 | 14 | 5 |
| da.annotations | Annotations | drafted | 1 | 8 | 1 |
| da.batch-msglog | PI Batch and the message log | drafted | 1 | 12 | 3 |
| da.security | Identities, mappings, trusts and database security | drafted | 1 | 16 | 5 |
| da.subsystems | Subsystems (Base, Snapshot, Archive, Update Manager, Message, Network Manager, Totalizer, PE, Alarm) | drafted | 1 | 12 | 9 |
| da.tools | PI SMT, piconfig, piartool and pidiag | drafted | 1 | 22 | 4 |
| da.collectives | Collectives and high availability | drafted | 1 | 13 | 3 |
| da.backup | Backup and restore | drafted | 1 | 12 | 4 |
| da.tuning | Tuning parameters and performance | drafted | 1 | 18 | 10 |

## 3. PI Asset Framework (`asset-framework`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| af.server-databases | AF Server, databases and the SQL backend | drafted | 1 | 12 | 6 |
| af.elements-templates | Elements and element templates | drafted | 1 | 12 | 9 |
| af.attributes | Attributes, attribute templates and traits | drafted | 1 | 11 | 10 |
| af.data-references | Data references (PI Point, Formula, Table Lookup, String Builder, Analysis) | drafted | 1 | 12 | 11 |
| af.categories-enums | Categories and enumeration sets | drafted | 1 | 9 | 3 |
| af.tables-uom | Tables and units of measure | drafted | 1 | 10 | 6 |
| af.event-frames | Event frames | drafted | 1 | 12 | 11 |
| af.notifications | Notifications | drafted | 1 | 11 | 8 |
| af.analyses | Analyses (expression, rollup, event frame generation, SQC) | drafted | 1 | 12 | 10 |
| af.scheduling | Analysis scheduling and backfill/recalculation | drafted | 1 | 13 | 11 |
| af.sdk | AF SDK basics | drafted | 1 | 12 | 6 |
| af.pse | PI System Explorer | drafted | 1 | 11 | 5 |
| af.collectives-security | AF collectives, HA and security | drafted | 1 | 9 | 5 |
| af.library-versioning | Library, versioning and change management | drafted | 1 | 8 | 2 |

## 4. Data collection (`data-collection`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| dc.uniint | PI Interfaces and UniInt | drafted | 1 | 14 | 8 |
| dc.failover | Interface failover | drafted | 1 | 16 | 8 |
| dc.buffering | PI Buffer Subsystem (PIBufss) and buffering | drafted | 1 | 13 | 4 |
| dc.opc | OPC DA and OPC UA collection | drafted | 1 | 11 | 8 |
| dc.other-connectors | Modbus, MQTT, RDBMS, UFL, CygNet and other connectors | drafted | 1 | 12 | 6 |
| dc.relay-dcm | PI Connector Relay and Data Collection Manager | drafted | 1 | 9 | 4 |
| dc.pi-to-pi | PI to PI | drafted | 1 | 10 | 3 |
| dc.adapters-eds | AVEVA Adapters and Edge Data Store | drafted | 1 | 13 | 10 |
| dc.cloud | AVEVA Data Hub / CONNECT data services ingestion | drafted | 1 | 11 | 7 |

## 5. Visualisation (`visualisation`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| vis.vision-basics | PI Vision displays and symbols | drafted | 1 | 15 | 12 |
| vis.vision-advanced | Collections, asset-relative displays, events and BatchView | drafted | 1 | 11 | 8 |
| vis.vision-admin | PI Vision administration and security | drafted | 2 | 23 | 13 |
| vis.processbook | ProcessBook (legacy) | drafted | 1 | 9 | 4 |
| vis.datalink | PI DataLink | drafted | 1 | 10 | 6 |
| vis.legacy-web | Coresight, WebParts and Manual Logger | drafted | 1 | 9 | 3 |
| vis.bi | Power BI and BI tools | drafted | 1 | 10 | 4 |
| vis.connect | CONNECT visualisation experiences | drafted | 1 | 9 | 5 |

## 6. Analytics (`analytics`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| an.pe-syntax | Performance Equation syntax | drafted | 1 | 12 | 8 |
| an.pe-functions | Performance Equation functions | drafted | 1 | 12 | 15 |
| an.af-functions | AF analysis expression functions | drafted | 1 | 11 | 8 |
| an.weighting | Time-weighted vs event-weighted | drafted | 1 | 10 | 3 |
| an.interpolation | Interpolation, step and stepped data | drafted | 1 | 9 | 5 |
| an.rollups-summaries | Rollups and summaries | drafted | 1 | 10 | 3 |
| an.filtering-units | Filtering and units | drafted | 1 | 8 | 2 |

## 7. Integration and developer (`integration`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| int.webapi-basics | PI Web API basics, WebID and controllers | drafted | 1 | 16 | 19 |
| int.webapi-advanced | Indexed search, batch, channels, stream updates and auth | drafted | 1 | 15 | 13 |
| int.afsdk-dev | AF SDK (.NET) development | drafted | 1 | 14 | 11 |
| int.sql | PI SQL Client, RTQP, OLEDB Enterprise, ODBC and JDBC | drafted | 1 | 14 | 12 |
| int.integrator | PI Integrator for Business Analytics | drafted | 1 | 11 | 8 |
| int.scripting | Python, PowerShell and REST examples | drafted | 1 | 13 | 4 |
| int.adh-apis | AVEVA Data Hub / CONNECT data services APIs | drafted | 1 | 14 | 13 |

## 8. Administration and operations (`administration`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| adm.install-upgrade | Install and upgrade | drafted | 1 | 12 | 10 |
| adm.sizing | Sizing | drafted | 1 | 12 | 11 |
| adm.naming | Naming conventions | drafted | 1 | 11 | 5 |
| adm.af-patterns | AF patterns and anti-patterns | drafted | 1 | 12 | 9 |
| adm.hardening | Hardening and Kerberos | drafted | 1 | 12 | 28 |
| adm.monitoring | Monitoring and health | drafted | 1 | 11 | 12 |
| adm.troubleshooting | Troubleshooting, logs and error codes | drafted | 1 | 12 | 18 |
| adm.dr-migration | Disaster recovery and migrations | drafted | 1 | 12 | 11 |
| adm.cloud | Cloud deployment | drafted | 1 | 11 | 3 |
| adm.deployment-patterns | Deployment patterns by company size (small, mid, enterprise) | drafted | 1 | 11 | 8 |

## 9. Industries (`industries`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| ind.oil-gas | Oil & Gas | drafted | 16 | 12 | 9 |
| ind.power | Power & Utilities | drafted | 16 | 12 | 6 |
| ind.water | Water | drafted | 11 | 11 | 8 |
| ind.chemicals | Chemicals | drafted | 6 | 10 | 5 |
| ind.pharma | Pharma / Life Sciences (GxP, 21 CFR Part 11) | drafted | 12 | 14 | 16 |
| ind.mining | Mining & Metals | drafted | 10 | 10 | 6 |
| ind.food-bev | Food & Beverage | drafted | 10 | 10 | 5 |
| ind.data-centres | Data Centres | drafted | 8 | 11 | 8 |
| ind.pulp-paper | Pulp & Paper | drafted | 5 | 8 | 2 |
| ind.buildings | Smart Buildings | drafted | 4 | 8 | 2 |
| ind.manufacturing | Manufacturing | drafted | 4 | 9 | 2 |
| ind.marine-transport | Marine / Transport | drafted | 5 | 9 | 4 |

## 10. Case studies (`case-studies`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| cs.library | 30+ real, sourced case studies | drafted | 85 | 95 | 2 |

## 11. Cybersecurity and compliance (`security`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| sec.iec62443 | IEC 62443 | drafted | 1 | 11 | 7 |
| sec.nerc-cip | NERC CIP | drafted | 1 | 11 | 5 |
| sec.architecture | DMZ, data diodes and PI to PI across zones | drafted | 1 | 10 | 8 |
| sec.certificates | Certificates and transport security | drafted | 1 | 12 | 8 |

## 12. Glossary (`glossary`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| glo.terms | 500+ glossary terms | drafted | 0 | 0 | 623 |
<!-- coverage:end -->
