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
| fnd.history | OSIsoft to AVEVA history | not started | 0 | 0 | 0 |
| fnd.historian | The historian concept | not started | 0 | 0 | 0 |
| fnd.timeseries | Time-series basics | not started | 0 | 0 | 0 |
| fnd.architecture | PI System architecture | not started | 0 | 0 | 0 |
| fnd.licensing | Licensing and editions | not started | 0 | 0 | 0 |
| fnd.connect | PI System vs AVEVA CONNECT | not started | 0 | 0 | 0 |

## 2. PI Data Archive (`data-archive`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| da.points | Points and point classes | not started | 0 | 0 | 0 |
| da.point-attributes | Point attributes (pointtype, pointsource, compressing, compdev, compmax, compmin, excdev, excmax, excmin, scan, span, zero, step, location1-5, instrumenttag, ...) | not started | 0 | 0 | 0 |
| da.digital-sets | Digital state sets and system states | not started | 0 | 0 | 0 |
| da.exception-compression | Exception and compression | not started | 0 | 0 | 0 |
| da.snapshot-archive | Snapshot vs archive and the event queue | not started | 0 | 0 | 0 |
| da.archive-files | Archive files, shifts and management | not started | 0 | 0 | 0 |
| da.backfill | Backfilling, out-of-order and future data | not started | 0 | 0 | 0 |
| da.annotations | Annotations | not started | 0 | 0 | 0 |
| da.batch-msglog | PI Batch and the message log | not started | 0 | 0 | 0 |
| da.security | Identities, mappings, trusts and database security | not started | 0 | 0 | 0 |
| da.subsystems | Subsystems (Base, Snapshot, Archive, Update Manager, Message, Network Manager, Totalizer, PE, Alarm) | not started | 0 | 0 | 0 |
| da.tools | PI SMT, piconfig, piartool and pidiag | not started | 0 | 0 | 0 |
| da.collectives | Collectives and high availability | not started | 0 | 0 | 0 |
| da.backup | Backup and restore | not started | 0 | 0 | 0 |
| da.tuning | Tuning parameters and performance | not started | 0 | 0 | 0 |

## 3. PI Asset Framework (`asset-framework`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| af.server-databases | AF Server, databases and the SQL backend | not started | 0 | 0 | 0 |
| af.elements-templates | Elements and element templates | not started | 0 | 0 | 0 |
| af.attributes | Attributes, attribute templates and traits | not started | 0 | 0 | 0 |
| af.data-references | Data references (PI Point, Formula, Table Lookup, String Builder, Analysis) | not started | 0 | 0 | 0 |
| af.categories-enums | Categories and enumeration sets | not started | 0 | 0 | 0 |
| af.tables-uom | Tables and units of measure | not started | 0 | 0 | 0 |
| af.event-frames | Event frames | not started | 0 | 0 | 0 |
| af.notifications | Notifications | not started | 0 | 0 | 0 |
| af.analyses | Analyses (expression, rollup, event frame generation, SQC) | not started | 0 | 0 | 0 |
| af.scheduling | Analysis scheduling and backfill/recalculation | not started | 0 | 0 | 0 |
| af.sdk | AF SDK basics | not started | 0 | 0 | 0 |
| af.pse | PI System Explorer | not started | 0 | 0 | 0 |
| af.collectives-security | AF collectives, HA and security | not started | 0 | 0 | 0 |
| af.library-versioning | Library, versioning and change management | not started | 0 | 0 | 0 |

## 4. Data collection (`data-collection`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| dc.uniint | PI Interfaces and UniInt | not started | 0 | 0 | 0 |
| dc.failover | Interface failover | not started | 0 | 0 | 0 |
| dc.buffering | PI Buffer Subsystem (PIBufss) and buffering | not started | 0 | 0 | 0 |
| dc.opc | OPC DA and OPC UA collection | not started | 0 | 0 | 0 |
| dc.other-connectors | Modbus, MQTT, RDBMS, UFL, CygNet and other connectors | not started | 0 | 0 | 0 |
| dc.relay-dcm | PI Connector Relay and Data Collection Manager | not started | 0 | 0 | 0 |
| dc.pi-to-pi | PI to PI | not started | 0 | 0 | 0 |
| dc.adapters-eds | AVEVA Adapters and Edge Data Store | not started | 0 | 0 | 0 |
| dc.cloud | AVEVA Data Hub / CONNECT data services ingestion | not started | 0 | 0 | 0 |

## 5. Visualisation (`visualisation`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| vis.vision-basics | PI Vision displays and symbols | not started | 0 | 0 | 0 |
| vis.vision-advanced | Collections, asset-relative displays, events and BatchView | not started | 0 | 0 | 0 |
| vis.vision-admin | PI Vision administration and security | not started | 0 | 0 | 0 |
| vis.processbook | ProcessBook (legacy) | not started | 0 | 0 | 0 |
| vis.datalink | PI DataLink | not started | 0 | 0 | 0 |
| vis.legacy-web | Coresight, WebParts and Manual Logger | not started | 0 | 0 | 0 |
| vis.bi | Power BI and BI tools | not started | 0 | 0 | 0 |
| vis.connect | CONNECT visualisation experiences | not started | 0 | 0 | 0 |

## 6. Analytics (`analytics`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| an.pe-syntax | Performance Equation syntax | not started | 0 | 0 | 0 |
| an.pe-functions | Performance Equation functions | not started | 0 | 0 | 0 |
| an.af-functions | AF analysis expression functions | not started | 0 | 0 | 0 |
| an.weighting | Time-weighted vs event-weighted | not started | 0 | 0 | 0 |
| an.interpolation | Interpolation, step and stepped data | not started | 0 | 0 | 0 |
| an.rollups-summaries | Rollups and summaries | not started | 0 | 0 | 0 |
| an.filtering-units | Filtering and units | not started | 0 | 0 | 0 |

## 7. Integration and developer (`integration`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| int.webapi-basics | PI Web API basics, WebID and controllers | not started | 0 | 0 | 0 |
| int.webapi-advanced | Indexed search, batch, channels, stream updates and auth | not started | 0 | 0 | 0 |
| int.afsdk-dev | AF SDK (.NET) development | not started | 0 | 0 | 0 |
| int.sql | PI SQL Client, RTQP, OLEDB Enterprise, ODBC and JDBC | not started | 0 | 0 | 0 |
| int.integrator | PI Integrator for Business Analytics | not started | 0 | 0 | 0 |
| int.scripting | Python, PowerShell and REST examples | not started | 0 | 0 | 0 |
| int.adh-apis | AVEVA Data Hub / CONNECT data services APIs | not started | 0 | 0 | 0 |

## 8. Administration and operations (`administration`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| adm.install-upgrade | Install and upgrade | not started | 0 | 0 | 0 |
| adm.sizing | Sizing | not started | 0 | 0 | 0 |
| adm.naming | Naming conventions | not started | 0 | 0 | 0 |
| adm.af-patterns | AF patterns and anti-patterns | not started | 0 | 0 | 0 |
| adm.hardening | Hardening and Kerberos | not started | 0 | 0 | 0 |
| adm.monitoring | Monitoring and health | not started | 0 | 0 | 0 |
| adm.troubleshooting | Troubleshooting, logs and error codes | not started | 0 | 0 | 0 |
| adm.dr-migration | Disaster recovery and migrations | not started | 0 | 0 | 0 |
| adm.cloud | Cloud deployment | not started | 0 | 0 | 0 |
| adm.deployment-patterns | Deployment patterns by company size (small, mid, enterprise) | not started | 0 | 0 | 0 |

## 9. Industries (`industries`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| ind.oil-gas | Oil & Gas | not started | 0 | 0 | 0 |
| ind.power | Power & Utilities | not started | 0 | 0 | 0 |
| ind.water | Water | not started | 0 | 0 | 0 |
| ind.chemicals | Chemicals | not started | 0 | 0 | 0 |
| ind.pharma | Pharma / Life Sciences (GxP, 21 CFR Part 11) | not started | 0 | 0 | 0 |
| ind.mining | Mining & Metals | not started | 0 | 0 | 0 |
| ind.food-bev | Food & Beverage | not started | 0 | 0 | 0 |
| ind.data-centres | Data Centres | not started | 0 | 0 | 0 |
| ind.pulp-paper | Pulp & Paper | not started | 0 | 0 | 0 |
| ind.buildings | Smart Buildings | not started | 0 | 0 | 0 |
| ind.manufacturing | Manufacturing | not started | 0 | 0 | 0 |
| ind.marine-transport | Marine / Transport | not started | 0 | 0 | 0 |

## 10. Case studies (`case-studies`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| cs.library | 30+ real, sourced case studies | not started | 0 | 0 | 0 |

## 11. Cybersecurity and compliance (`security`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| sec.iec62443 | IEC 62443 | not started | 0 | 0 | 0 |
| sec.nerc-cip | NERC CIP | not started | 0 | 0 | 0 |
| sec.architecture | DMZ, data diodes and PI to PI across zones | not started | 0 | 0 | 0 |
| sec.certificates | Certificates and transport security | not started | 0 | 0 | 0 |

## 12. Glossary (`glossary`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| glo.terms | 500+ glossary terms | not started | 0 | 0 | 0 |
<!-- coverage:end -->
