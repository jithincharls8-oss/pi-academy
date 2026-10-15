# dcv: Data collection (dc.*) and visualisation (vis.*) research notes

## Summary

- Confidence-tag counts (some bullets carry two tags): **read = 281**, **snippet = 0**, **inferred = 5**. A few worked examples are also marked inferred inline.
- **The WebSearch budget ran out partway through.** The shared limit of 200 searches per turn was reached while researching dc.opc and dc.cloud. After that, only WebFetch of URLs already seen was possible. These ids are therefore thin or empty:
  - dc.opc: PI Connector for OPC UA and AVEVA Adapter for OPC UA specifics
  - dc.other-connectors: RDBMS, Modbus location codes, CygNet details
  - dc.cloud: PI to Data Hub agent and PI Cloud Connect
  - vis.vision-admin: IIS, SQL, Kerberos, extensibility
  - vis.processbook: EOL dates
  - vis.datalink: Excel function names and arguments
  - vis.legacy-web: Coresight rename date, WebParts, Manual Logger
  - vis.bi: Power BI connector
  - vis.connect
- **docs.aveva.com pages are JS-rendered and returned only the page shell**, and searches returned no snippets for them. All facts here come from readable PDFs (cdn.osisoft.com course workbooks and conference decks), GitHub READMEs, PI Square threads and third-party mirrors of OSIsoft interface manuals.
- **Strongest coverage:**
  - PI Vision UI: toolbar, symbols, time bar, shortcuts, multi-state, collections, asset switching, URL parameters
  - UniInt basics and Phase 2 failover parameters
  - PI Buffer Subsystem files and commands
  - OMF headers and endpoints
  - PI Vision 2017 feature history
- **Biggest gaps, all flagged under Open questions:**
  - n-way buffering mechanics beyond "one queue per collective member"
  - PI Vision admin site, IIS, SQL and Kerberos
  - PI Vision Events pane UI detail
  - PI DataLink function signatures
  - ProcessBook and WebParts end-of-life dates
  - PI Coresight to PI Vision rename date
  - AVEVA Adapter for OPC UA configuration facets
  - PI to Data Hub agent
  - CONNECT visualisation

---

### dc.uniint: PI Interfaces, UniInt framework, ICU, startup files

**Facts**
- A PI Interface connects to the data source, timestamps the data (or confirms the source did), formats it, and sends it to the PI Data Archive. [S:dcv-arch-workbook] (read)
- Data collection by an interface follows the steps read, timestamp, format, apply exception, send. [S:dcv-admin-it-2017r2] (read)
- "UniInt is short for Universal Interface. It is reusable code integrated in many of PI interfaces." It handles connections and monitors the PI Point database for changes. [S:dcv-arch-workbook] (read)
- UniInt was "developed initially in 1992" as common code for exchanging data with the PI Server. [S:dcv-zeilenga-interfaces-2009] (read)
- UniInt provides:
  - a consistent installation routine and similar configuration parameters
  - orderly startup and shutdown, and messaging
  - bad-data and comms-failure indication
  - automatic handling of PI point attribute changes
  - failover

  [S:dcv-pohl-interfaces-2008] (read)
- AVEVA states there are over 450 PI interfaces and over 20 PI Connectors. [S:dcv-arch-workbook] (read)
- An interface installation consists of:
  - the PI Interface executable
  - a PI Interface instance batch (.bat) file
  - a Windows Service running that instance

  Multiple data sources mean multiple batch files (instances). [S:dcv-simple-pi-system-2020] (read)
- Interface components install under `%PIHOME%\Interfaces` (32-bit) or `%PIHOME64%\Interfaces` (64-bit). [S:dcv-arch-workbook] (read)
- The startup batch file must be named after the service with ".bat" appended. [S:dcv-rovisys-opc90] (read)
- Common startup parameters:
  - `/PS`: "Point Source (which interface?)"
  - `/ID`: "Interface ID (which instance of the interface?)"
  - `/F`: "Frequency/Scan Class (how often to read a value?)"

  [S:dcv-arch-workbook] (read)
- `/HOST` is "the name of the PI server". `/ID` "should be an integer number". At least one `/F` scan class must be specified. [S:dcv-rovisys-opc90] (read)
- Each `/f` on the command line defines a scan class. `/f=00:01:00,00:00:05` (1-minute period, 5-second offset) is equivalent to `/f=60,5`. [S:dcv-arch-workbook] (read)
- With an offset, scans occur at reference time + n × frequency + offset. [S:dcv-arch-workbook] (read)
- "The ,L at the end of the scan class tells UniInt to use the wall clock scheduling algorithm." For example, `/f=24:00:00,00:08:00,L` keeps a daily 08:00 scan steady across DST changes. [S:dcv-arch-workbook] (read)
- Points are assigned to a scan class through the Location4 attribute: "Typically, the field is the scan class number. (/f)". [S:dcv-arch-workbook] (read)
- "Typically, the Location1 field is used for the interface instance number (/ID)." [S:dcv-simple-pi-system-2020] (read)
- The PointSource attribute "Must match the value set in the interface configuration. See the /PS parameter." [S:dcv-arch-workbook] (read)
- The Scan attribute includes the PI point in the list of points to scan and should always be ON for interface points. [S:dcv-simple-pi-system-2020] (read)
- Location-code meanings differ per interface: "ALWAYS consult the interface manual!" [S:dcv-simple-pi-system-2020] (read)
- Point read methods:
  - Polled: "the interface sends an asynchronous refresh call for the group (points of the same scan class)."
  - Advise: points "'listen' for new events."
  - Output: points "read a separate PI Point and write the value out to the data source."

  [S:dcv-arch-workbook] (read)
- "Do not mix advised points and polled points in the same group (i.e., scan class)." [S:dcv-arch-workbook] (read)
- Interfaces that can write are "published in two editions: Read Write a[nd] Read Only". The Read Only edition disables writes "due to security reasons". [S:dcv-arch-workbook] (read)
- "The PI Interface Configuration Utility (PI ICU) is simply a GUI for editing the startup batch file." It reads the PI Module Database (MDB) and writes to both the batch file and the MDB. [S:dcv-arch-workbook] (read)
- "The PI ICU can only configure PI Interfaces that run on the same computer as the PI ICU." [S:dcv-arch-workbook] (read)
- Batch file contents are written to the Module Database on the Data Archive, which allows recovery. [S:dcv-admin-it-2017r2] (read)
- Editing the batch file by hand makes PI ICU report a mismatch with the MDB the next time it opens. The user chooses which version to keep. [S:dcv-pisquare-icu-bat] (read)
- Each standard interface install creates a folder in `%pipc%\Interfaces` containing a default `.bat_new` file. Loading it into ICU "registers" the interface with the Data Archive named in `/host=`. [S:dcv-pisquare-icu-bat] (read)
- Each time ICU saves, it backs up the .BAT by commenting out the previous command line and writing the new one after it. [S:dcv-pisquare-icu-bat] (read)
- PI ICU groups these into one GUI:
  - log file management
  - buffering
  - IORATES and performance points
  - Windows service options
  - runtime options

  [S:dcv-pohl-interfaces-2008] (read)
- The ICU general section lists `/PS`, `/ID` and `/F`. The OPC-specific section lists `/OPCSTOPSTAT`, `/SERVER` and `/TS`. [S:dcv-arch-workbook] (read)
- Interactive start (Ctrl+T in ICU) is for testing only. The Windows service may lack permissions that the interactive account has. [S:dcv-arch-workbook] (read)
- PI ICU cannot create a service under a gMSA. Create it under the default NT Service account, then switch to the gMSA in Services Manager. [S:dcv-arch-workbook] (read)
- An interface whose clock is more than 30 minutes off the server clock will not run. Real-time values timestamped more than 10 minutes in the future are discarded. [S:dcv-arch-workbook] (read)
- Interfaces, Connectors and Adapters send UTC timestamps. Check DST rules with `pidiag -tz`. [S:dcv-arch-workbook] (read)
- Interfaces can connect using PI Trust or Windows Integrated Security. WIS support comes through the "PI API for WIS". [S:dcv-arch-workbook] (read)
- For older PI APIs, the connection name is the first four letters of the interface name plus "E" (example: OPCpE). [S:dcv-arch-workbook] (read)
- Trusts should follow a "2+ convention" (IP address plus executable name) and should not map to piadmin. [S:dcv-arch-workbook] (read)
- Interfaces use the older PI API protocol. Tools such as PI ICU use the PI SDK. [S:dcv-simple-pi-system-2020] (read)
- Interfaces with UniInt 4.5.0.x or later write to the PI Message Log. Interfaces with UniInt earlier than 2.5.0.x write to the PIPC log (`PIPC\dat\pipc.log`). [S:dcv-simple-pi-system-2020] (read)
- `pigetmsg -f` shows PI Message Logs continuously. [S:dcv-simple-pi-system-2020] (read)
- Recommended UniInt health points, created in PI ICU under UniInt > Health Points:
  - Heartbeat
  - Device Status
  - IO Rate
  - Scan Class Scans Skipped

  "If the value stops updating, the interface has stopped collecting data." [S:dcv-pi-sys-admin-workbook] (read)
- "Disconnected startup" lets an interface start from a local copy of its point list without a PI Data Archive connection. It is recommended for production. [S:dcv-arch-workbook] (read)
- Disconnected startup required:
  - PI Server 3.x or later
  - PI-API 1.6.1.5 (with PI-SDK 1.3.4.333)
  - UniInt 4.3.0.x or later

  The first startup must connect, after which point-cache and digital-set-cache files are created. "Outputs will not be supported while disconnected." [S:dcv-pohl-interfaces-2008] (read)
- The PI Interface Status Utility (PI ISU) alerts when an interface's data becomes stale. PI AutoPointSync keeps PI tags synchronized with the control system. [S:dcv-techsupport-tools] (read)
- On buffered nodes, make the interface service depend on the PI Buffer Subsystem. Otherwise the interface may start first and send directly to the Data Archive, bypassing the buffer. [S:dcv-arch-workbook] (read)

**Terms**
- UniInt: OSIsoft's Universal Interface framework, common code shared by many PI interfaces for startup, scanning, point updates, messaging and failover. [S:dcv-arch-workbook]
- Point source: a character or string on each PI point that must match an interface's `/PS` parameter, so the interface loads that point. [S:dcv-arch-workbook]
- Scan class: a scan period (and optional offset) defined by one `/f=` parameter. Points select it through Location4. [S:dcv-arch-workbook]
- PI ICU: the PI Interface Configuration Utility, a GUI that edits an interface's startup .bat file and stores the configuration in the Module Database. [S:dcv-arch-workbook]
- Disconnected startup: the ability of a UniInt interface to start from locally cached point definitions without connecting to the Data Archive. [S:dcv-pohl-interfaces-2008]
- Health points: PI points (Heartbeat, Device Status, IO Rate, Scans Skipped) that report interface health. [S:dcv-pi-sys-admin-workbook]

**Worked-example material**
- Example ICU-generated switches: `/PS=O /GA=Y /f=00:00:01`. [S:dcv-pisquare-icu-bat]
- Scan class examples: `/f=60,5` ≡ `/f=00:01:00,00:00:05`, and `/f=24:00:00,00:08:00,L` (daily at 08:00 local wall-clock time). [S:dcv-arch-workbook]
- OPC DA batch-file minimum: `/PS=O /ID=1 /SERVER=<node>::<progid> /HOST=<PIServer> /F=00:00:01`.
  - The pieces are from the sources: /SERVER format `<node>::<name>` [S:dcv-arch-workbook], /PS "O" typical for OPC [S:dcv-rovisys-opc90].
  - The assembled line is (inferred).

**Common mistakes / pitfalls**
- Editing the .bat by hand and then opening ICU produces an out-of-sync prompt. [S:dcv-arch-workbook]
- Mixing advise and polled points in one scan class. [S:dcv-arch-workbook]
- The interface starting before PIBufss, so data bypasses buffering. [S:dcv-arch-workbook]
- Validating only with an interactive start. Always test the service start. [S:dcv-arch-workbook]
- Clock skew of more than 30 minutes stops the interface, and future timestamps of more than 10 minutes are discarded. [S:dcv-arch-workbook]
- Using a hostname in the interface but an IP address in the buffering config (they must match). [S:dcv-arch-workbook]

**Open questions**
- Exact UniInt switches such as `/stopstat`, `/sio`, `/perf`, `/maxstoptime`, `/cachemode` and their defaults could not be read.
- The defaults for Location2, Location3 and Location5 are generic UniInt usage. These are interface-specific (verify).

---

### dc.failover: UniInt interface failover (Phase 1 / Phase 2; hot, warm, cold)

**Facts**
- "To minimize data loss during a single point of failure within a system, UniInt provides two failover schemas." [S:dcv-ftsh-h2h-uniint] (read)
- "Synchronization through the data source is Phase 1, and synchronization through a shared file is Phase 2." [S:dcv-ftsh-h2h-uniint] (read)
- Phase 1 rules:
  - Phase 1 "uses the data source itself to synchronize failover operations".
  - The data source must be able to communicate with and provide data to two interfaces simultaneously.
  - The interface must support outputs.

  [S:dcv-ftsh-h2h-uniint] (read)
- "UNIINT Failover Phase I requires the Interface to support Outputs to the DCS." [S:dcv-pohl-interfaces-2008] (read)
- Phase 2 "uses a shared file to synchronize failover operations" and "provides for hot, warm, or cold failover". [S:dcv-ftsh-h2h-uniint] (read)
- "The Phase 2 hot failover configuration provides a no data loss solution for a single point of failure similar to Phase 1." In warm and cold configurations, "you can expect a small period of data loss". [S:dcv-ftsh-h2h-uniint] (read)
- Best-practice decks summarise the types as "Hot = No data loss", "Warm = Maybe data loss", "Cold = Some data lost". [S:dcv-lonsberry-arch-2011] (read)
- The same summary appears in [S:dcv-vining-arch-2013] (read).
- Interfaces monitor each other's heartbeat and status to detect failure. [S:dcv-lonsberry-arch-2011] (read)
- Phase 2 startup parameters:

  | Parameter | Rule | Default / range |
  |---|---|---|
  | `/UFO_ID=#` | Required; positive non-zero integer that must differ between nodes | Node1 1, Node2 2 |
  | `/UFO_OtherID=#` | Required; equals the partner's /UFO_ID | — |
  | `/UFO_Sync=` | Required for Phase 2; path and optional filename of the shared file | — |
  | `/UFO_Type=` | Required; HOT, WARM or COLD | COLD |
  | `/UFO_Interval=#` | Optional heartbeat interval in ms; must be identical on both nodes | 1000 (range 50–20000) |
  | `/Host=` | Each node may point to a different collective member | — |

  [S:dcv-citect-ufo2-ininet] (read)
- The `/UFO_Sync` path "must be terminated by a slash ( / ) or backslash ( \ ) character". Without a trailing slash, the last segment is taken as the filename. Paths with spaces must be quoted. [S:dcv-bacnet-ufo2-muhaz] (read)
- The default shared filename format is `executablename_pointsource_interfaceID.dat`. [S:dcv-citect-ufo2-ininet] (read)
- If the shared file does not exist, the first interface to start creates it. Both nodes need read, write and file-creation rights on the shared directory. [S:dcv-citect-ufo2-ininet] (read)
- If an interface does not support the requested failover type, it "will shutdown and log an error to the pipc.log file". [S:dcv-citect-ufo2-ininet] (read)
- Without a collective, `/Host` must be identical on both nodes. With a collective, each node should point to a different member. [S:dcv-bacnet-ufo2-muhaz] (read)
- `/stopstat` is disabled in a UniInt failover configuration. This prevents digital states being written to points while the redundant interface is also writing. [S:dcv-bacnet-ufo2-muhaz] (read)
- Failover control points held in the shared file:
  - ActiveID: values 0 to the highest failover ID; changing it manually forces a failover, for example 1 to 2.
  - Heartbeat 1 and Heartbeat 2: values 0–31.
  - Device Status 1 and Device Status 2: values 0–99, where 0 is good and 99 is off; the node with the lower value tries to be primary.

  [S:dcv-bacnet-ufo2-muhaz] (read)
- PI tag ExDesc prefixes for failover tags (case-sensitive):
  - `[UFO2_ACTIVEID]`
  - `[UFO2_HEARTBEAT:#]`
  - `[UFO2_STATE:#]`

  The # is the owning node's failover ID. [S:dcv-bacnet-ufo2-muhaz] (read)
- On the ActiveID tag, Location5 is the COLD failover retry interval in minutes. An optional wait time sets how long the backup collects data before failing over. [S:dcv-bacnet-ufo2-muhaz] (read)
- UFO_State digital set values:

  | Value | State | Meaning |
  |---|---|---|
  | 0 | Off | Interface shut down |
  | 1 | Backup No Data Source | Running but cannot reach the data source |
  | 2 | Backup No PI Connection | Data source reachable, PI is not |
  | 3 | Backup | Collecting data, ready to take over |
  | 4 | Transition | Brief state that prevents "thrashing" |
  | 5 | Primary | Collecting data and sending it to PI |

  [S:dcv-citect-ufo2-ininet] (read)
- OSIsoft recommends hosting the shared file on a dedicated server with no other data-collection role, to avoid contention at high point counts or frequencies. [S:dcv-bacnet-ufo2-muhaz] (read)
- PI Interface for OPC DA supports UniInt Phase 1 from version 2.3.2.0 and Phase 2 from version 2.3.10.0. Microsoft Cluster failover is "Not recommended". [S:dcv-techsupport-opcda] (read)
- PI to PI supports "Source PI Data Archive-level failover" and "UniInt Phase 2 Interface Level failover, which supports cold, warm, or hot failover configurations". [S:dcv-pitopi-manualzz] (read)
- The PI Interface for Modbus Ethernet PLC 4.0.7.x lists "Phase 2 failover" as a key feature. [S:dcv-modbus-manualzz] (read)
- 2008-era Phase II interfaces included PI to PI TCPIP 3.6.1.0. The example configuration used `/UFO_TYPE=HOT` with a shared sync file. [S:dcv-pohl-interfaces-2008] (read)
- Node 1 runs `/UFO_ID=1 /UFO_OTHERID=2` and node 2 runs `/UFO_ID=2 /UFO_OTHERID=1`. [S:dcv-pohl-interfaces-2008] (read)
- PI Connectors (1st gen) handle failover differently and never need a Data Archive or AF connection to start. "There is currently NO FAILOVER support for PI Connector (2nd gen) and PI Connector Relay." [S:dcv-arch-workbook] (read)
- AVEVA Adapter failover is "Available with OPC UA and MQTT Adapters". Client and server failover modes are named Hot, Warm and Cold. [S:dcv-felts-connectivity-2023] (read)

**Terms**
- Phase 1 failover: UniInt failover synchronised through the data source; it requires output support. [S:dcv-ftsh-h2h-uniint]
- Phase 2 failover: UniInt failover synchronised through a shared file (`/UFO_Sync`); it supports hot, warm and cold. [S:dcv-ftsh-h2h-uniint]
- Hot failover: the backup interface is fully connected and collecting, so no data is lost on a single failure. [S:dcv-ftsh-h2h-uniint]
- ActiveID: the failover control value naming which interface ID is currently primary. [S:dcv-bacnet-ufo2-muhaz]

**Worked-example material**
- Node A: `/UFO_ID=1 /UFO_OtherID=2 /UFO_Type=HOT /UFO_Sync=\\fileserver\UFO\ /UFO_Interval=1000 /Host=PIDA1`
- Node B: `/UFO_ID=2 /UFO_OtherID=1 /UFO_Type=HOT /UFO_Sync=\\fileserver\UFO\ /UFO_Interval=1000 /Host=PIDA2`
- Parameter semantics are from [S:dcv-citect-ufo2-ininet]. The concrete hostnames and share path are illustrative (inferred).

**Common mistakes / pitfalls**
- A `/UFO_Sync` path missing its trailing backslash, so the folder name is treated as the filename. [S:dcv-bacnet-ufo2-muhaz]
- Different `/UFO_Interval` values on the two nodes. [S:dcv-citect-ufo2-ininet]
- A service account without rights on the share. [S:dcv-citect-ufo2-ininet]
- When moving the shared file, no copy is needed: an interface that cannot find the file creates a new one. PI to PI history recovery covers any gap. [S:dcv-pisquare-pitopi-failover-files]
- Batch interfaces in failover could over-recover history using the stale STARTUP.dat. AVEVA planned a fix in the batch framework for a Jan 2025 release. [S:dcv-feedback-emdvb]

**Open questions**
- Exact Phase 1 parameters (for example `/UFO_ID` plus output-based ActiveID and Heartbeat points on the DCS) were not read.
- Exact definitions of warm options (warm-1/2/3?) are unconfirmed (verify).

---

### dc.buffering: PI Buffer Subsystem (PIBufss) vs API Buffer Server (bufserv)

**Facts**
- "OSIsoft offers two mechanisms for buffering data to the PI Server or PI Collective": the PI Buffer Subsystem (PIbufss) and the API Buffer Server (Bufserv). [S:dcv-techsupport-bufss] (read)
- "The PI Buffer subsystem is an OSIsoft application installed with every PI Interface." It "runs as a Windows Service". [S:dcv-admin-it-2017r2] (read)
- PIBufss "can actually buffer data from any application (OSIsoft or custom-built) which is writing data to a Data Archive." [S:dcv-pi-sys-admin-workbook] (read)
- PIBufss buffers data from both API-based interfaces and SDK-based applications. It reduces PI Server load because compression runs on the data-collection node (KB00042). [S:dcv-techsupport-tools] (read)
- Bufserv is an older API-based buffering service. It runs on all platforms but only buffers data from API-based interfaces. `pibufutil` is its command-line status and shutdown utility (KB00363). [S:dcv-techsupport-tools] (read)
- "The API Buffer Server should only be used if (1) the PI Server receiving the buffered data is older than version 3.4.375" or (2) the interface runs on a non-Windows platform. [S:dcv-admin-it-2017r2] (read)
- With PI Server Platform Release 1 (PR1, 3.4.375.x), both Bufserv and the new PIBufss became available. PIBufss "is designed mainly to enhance PI Server high availability" and runs compression before data is sent. [S:dcv-pohl-interfaces-2008] (read)
- Buffering data flow:
  1. shared memory buffer
  2. snapshot table
  3. events marked for compression ("Snapshot Only" or "To Be Archived")
  4. memory-mapped buffer queue file
  5. Data Archive

  [S:dcv-admin-it-2017r2] (read)
- Buffer files:
  - When the shared-memory buffer is full, data overflows to `APIBUF_<Data Archive name>.dat`.
  - `pibufmem_<GUID>.dat` is the snapshot table holding the most recent value for each buffered point.
  - `pibufq_<GUID>.dat` is the buffer queue, "the file that acts as our 'tank'".

  [S:dcv-admin-it-2017r2] (read)
- The buffer queue file has a default size of 32 MB. Additional files are created as each fills, until the disk runs out of space. [S:dcv-pi-sys-admin-workbook] (read)
- PI SDK and AF SDK applications write directly into the PIBufss snapshot table, skipping the shared-memory step. [S:dcv-pi-sys-admin-workbook] (read)
- "It is strongly recommended to separate the buffer queue from the OS drive." The course uses `E:\OSIsoft\Buffering`. [S:dcv-admin-it-2017r2] (read)
- "The PI Buffer Subsystem must start before all the PI Interfaces on the machine." ICU adds PIBufss to the interface's service dependencies when you choose "yes". [S:dcv-simple-pi-system-2020] (read)
- Each interface must be configured individually to enable buffering, from the PI ICU General tab. [S:dcv-simple-pi-system-2020] (read)
- "Since version 4.3 of the PI Buffer Subsystem" a Buffering Manager GUI is available (PI ICU > Tools > Buffering). Health check: "total events sent" should keep increasing. [S:dcv-simple-pi-system-2020] (read)
- Buffering commands:
  - `pibufss -cfg` "will show you the overall buffering status".
  - `pibufss -qs` "will show you the statistics of the buffer queue file", stopped with Ctrl+C. "A healthy buffer queue will have reads and writes from this file."
  - `pibufss -bc stop` and `pibufss -bc start` stop and restart sending, for example to simulate a network outage.

  [S:dcv-pi-sys-admin-workbook] (read)
- Default service account:
  - The 2017 R2 workbook gives "LocalSystem" [S:dcv-admin-it-2017r2] (read).
  - The newer workbook gives "NT Service\pibufss" [S:dcv-pi-sys-admin-workbook] (read).
- The Buffering Manager accepts a gMSA starting with PIBufss 4.9.0.37. Older versions need the gMSA added to the PI Buffering Administrators group. [S:dcv-arch-workbook] (read)
- Create a dedicated PI Identity "PI Buffer" mapped to the buffering service account. [S:dcv-arch-workbook] (read)
- n-way buffering: "PI Buffer Subsystem is maintaining a separate queue for each member of a PI Collective." If one member is down, data for the others flows immediately while that member's queue grows. `pibufss -qs` prompts for which member's queue to show. [S:dcv-pisquare-nway] (read)
- Best practice: configure buffering for PI Interfaces with the PI Buffer Subsystem, and configure buffering for PI ACE and PI Notifications too. [S:dcv-vining-arch-2013] (read)
- With the older bufserv, the service had to run under an account with network access (not Local System). The OPC interface was made dependent on "bufserv". [S:dcv-rovisys-opc90] (read)
- "N-way buffering" for batch interfaces was planned after "PI 3.4.380 SP1/3.5", to fan batch data out to every server in an HA collective. [S:dcv-zeilenga-interfaces-2009] (inferred: "fan out" wording paraphrased)

**Terms**
- PIBufss: the PI Buffer Subsystem, a Windows service that queues data for a PI Data Archive or collective and pre-applies compression marking. [S:dcv-techsupport-tools]
- Bufserv: the legacy PI API Buffer Server, which buffers only PI API data and runs on non-Windows platforms. [S:dcv-techsupport-tools]
- Buffer queue file: `pibufq_<GUID>.dat`, the 32 MB on-disk queue that holds events awaiting delivery. [S:dcv-pi-sys-admin-workbook]
- N-way buffering: sending buffered data independently to every member of a PI collective, with one queue per member. [S:dcv-pisquare-nway]

**Worked-example material**
- Lab sequence:
  1. Run `pibufss -cfg` to check that the state is connected and events are being sent.
  2. Run `pibufss -bc stop` to simulate an outage.
  3. Run `pibufss -qs` to watch queue writes grow.
  4. Run `pibufss -bc start` and watch the queue drain.

  [S:dcv-admin-it-2017r2]

**Common mistakes / pitfalls**
- The interface does not depend on PIBufss. [S:dcv-arch-workbook]
- The buffer queue sits on the OS drive. [S:dcv-admin-it-2017r2]
- The buffering hostname format (IP vs name) differs from the interface `/host`. [S:dcv-arch-workbook]
- Using bufserv against a modern server. [S:dcv-admin-it-2017r2]
- PI Square topics list "BufServ not buffering" and "Error 11403 when starting PIbufss" as common errors. [S:dcv-techsupport-bufss]

**Open questions**
- Full `pibufss -cfg` output fields and the piclient.ini settings, such as `BUFFERING=1`, were not read (verify).
- "Compression marking" options are not fully documented.
- Maximum queue size and settings are not covered (verify).

---

### dc.opc: PI Interface for OPC DA, PI Connector for OPC UA, AVEVA Adapter for OPC UA

**Facts**
- The PI Interface for OPC DA transfers data between OPC servers and the PI System. Each interface instance connects to a single OPC server. [S:dcv-techsupport-opcda] (read)
- It can run on the PI home node or an interface node. An interface node is preferred because it supports buffering. [S:dcv-techsupport-opcda] (read)
- OPC DA failover support: UniInt Phase 1 (2.3.2.0+), Phase 2 (2.3.10.0+), and server-level failover. [S:dcv-techsupport-opcda] (read)
- OPC DA tools:
  - PI ICU
  - PI OPC DA Interface APS Connector
  - PIOPCTool, installed with the interface, for installing and verifying the connection
  - PI_OPCClient, a test client
  - OPC Tag Configurator, which creates PI points from OPC server tags

  [S:dcv-techsupport-opcda] (read)
- The OPC DA interface is certified by the OPC Foundation. [S:dcv-techsupport-opcda] (read)
- OPC-specific startup parameters:
  - `/SERVER=<node>::<name>`: the machine and OPC server name
  - `/OPCSTOPSTAT=IntfShut`: write a value on shutdown
  - `/TS`: timestamp source

  [S:dcv-arch-workbook] (read)
- "Write Status to Tags on Shutdown" in the UniInt tab is ignored for OPC DA and set in the OPCInt plug-in instead. [S:dcv-arch-workbook] (read)
- OPC DA point attributes:

  | Attribute | Meaning |
  |---|---|
  | Location1 | Interface ID (must match /ID) |
  | Location2 | Special handling of data types (usually 0) |
  | Location3 | 0 polled/event, 1 advise, 2 output, 3 and 4 watchdog points (for failover) |
  | Location4 | Scan class |
  | Location5 | Optional advise deadband |
  | InstrumentTag | OPC ItemID, for example `CIU-A.Import.AIL_point.OUT` |
  | PointSource | Typically "O" |

  [S:dcv-rovisys-opc90] (read)
- If advise points are in the first scan class, the interface creates OPC groups automatically as needed. [S:dcv-rovisys-opc90] (read)
- In the course lab, one machine runs the PI Interface for OPC DA, the PI Connector for OPC UA and the AVEVA Adapter for OPC UA. A second machine runs a failover OPC DA interface, the PI Connector Relay and PI Data Collection Manager. [S:dcv-arch-workbook] (read)
- PI Connector for OPC UA v1.3.x.x:
  - "Certified by OPC Foundation"
  - "Support for 'Tag Only' Mode"
  - "Support for sending Engineering Units"
  - improved handling of disconnects

  [S:dcv-saboowala-connectivity-2019] (read)
- The PI Connector for OPC UA (2016) can auto-discover endpoints and auto-create PI Points and AF Elements. It supports OPC UA DA and HA, with A&C planned. [S:dcv-iuliano-ems-2016] (read)
- AVEVA lists "Connectors: Relay, PI System, OPC UA" under "Continued Support and Investment". [S:dcv-felts-connectivity-2023] (read)
- AVEVA Adapters (2023) cover:
  - Azure Event Hubs
  - BACnet
  - DNP3
  - Modbus TCP
  - MQTT
  - OPC UA
  - RDBMS
  - Structured Data Files

  The OPC UA and MQTT adapters support failover. [S:dcv-felts-connectivity-2023] (read)
- An OPC UA Client was an initial interface in the 2009 "new framework" plans. [S:dcv-zeilenga-interfaces-2009] (read)
- 2008 versions: OPC Interface 2.3.9.0, OPC HDA 1.3.1.0, OPC Alarms and Events 1.3.3.91. [S:dcv-pohl-interfaces-2008] (read)

**Terms**
- InstrumentTag (OPC): the PI point attribute holding the OPC ItemID to read. [S:dcv-rovisys-opc90]
- Advise point: an OPC point the server pushes on change (Location3=1), rather than one that is polled. [S:dcv-rovisys-opc90]
- Watchdog point: an OPC DA point type (Location3 3 or 4) used for server-level failover health. [S:dcv-rovisys-opc90]

**Common mistakes / pitfalls**
- Polled and advise points in the same scan class. [S:dcv-rovisys-opc90]
- Expecting one instance to read from several OPC servers: it reads from one only. [S:dcv-techsupport-opcda]

**Open questions**
- PI Connector for OPC UA configuration UI (data source page, data selection, AF element creation rules, "Tag only" vs "Tags and Assets") is not read in detail.
- AVEVA Adapter for OPC UA facets (DataSource with EndpointUrl, DataSelection with NodeId, StreamId) are not read (verify).
- OPC DA ExDesc and dz options are not read.

---

### dc.other-connectors: Modbus, RDBMS, UFL, MQTT, CygNet, IEC 60870/61850, Siemens/Wonderware

**Facts**
- PI Interface for Modbus Ethernet PLC (manual 4.0.7.x):
  - It is "designed to read data from a PLC on a periodic or event basis" and sends outputs on an event basis.
  - It supports Phase 2 failover.
  - Location1 must match `/id`.

  [S:dcv-modbus-manualzz] (read)
- PI_UFL (Universal File and Stream Loader):
  - It "reads data from various ASCII stream data sources".
  - It is "a replacement for the PI Batch File interface".
  - Its data-source plug-ins are ASCII files (`asciifiles.dll`), serial port (RS-232) and POP3 e-mail.

  [S:dcv-ufl-studylib] (read)
- PI_UFL configuration file:
  - It is referenced by the mandatory `/cf=full_path` parameter.
  - Its sections are `[INTERFACE]`, `[PLUG-IN]`, `[SETTING]`, `[FIELD]` and `[MSG]`.
  - "Do not place any of the above stated sections ([INTERFACE],[PLUG-IN],[SETTING]) after the [FIELD] section!"

  [S:dcv-ufl-studylib] (read)
- PI_UFL point attributes:
  - Location4 is the scan class.
  - Location5 specifies whether exception reporting is used.
  - InstrumentTag is the tag-name alias.
  - Convers is a multiplier.

  [S:dcv-ufl-studylib] (read)
- PI Connector for UFL 1.2 (2017) added "Native JSON parsing support", a ForEach construct and multi-parameter REST client calls. [S:dcv-coen-connectivity-2017] (read)
- The UFL connector supports file and REST input, secure REST endpoints, and user-defined templates and Event Frames. [S:dcv-iuliano-ems-2016] (read)
- PI Connectors available in 2017:
  - BACnet Facilities
  - CygNet (Upstream Oil and Gas)
  - DC Systems RTscada
  - EtherNet/IP
  - HART-IP
  - IEC 60870-5-104
  - IPMI
  - NOV WITSML
  - OPC UA
  - Ping
  - PI System Health
  - Siemens SIMATIC PCS 7
  - UFL
  - Wonderware Historian

  [S:dcv-coen-connectivity-2017] (read)
- PI Connectors in development in 2017:
  - PI System Connector
  - Redfish
  - Modbus for Cisco IOx
  - IEC 61850
  - GE Fanuc Focas
  - Siemens Sinumerik
  - MTConnect
  - MQTT Sparkplug (alpha)

  [S:dcv-coen-connectivity-2017] (read)
- The IEC 61850 connector targets substation IEDs and also supports IEC 61400-25 for wind. Its release was planned for 4Q 2017. [S:dcv-coen-connectivity-2017] (read)
- Stedin's IEC 61850 deployment:
  - The connector collects asset information and real-time measurements from the station bus.
  - It allows "flexible adding/removal of IEDs and reports".
  - It is architected with a "PI Data Relay".

  [S:dcv-stedin-61850-2017] (read)
- 2016 count: 13 PI Connectors were generally available, IEC 60870-5-104 among them. DNP3 for embedded systems was in development. [S:dcv-iuliano-ems-2016] (read)
- Connector features:
  - auto-discover the data source
  - build a reference model
  - auto-create AF elements and linked PI points
  - store events in Event Frames
  - update with source changes

  [S:dcv-iuliano-ems-2016] (read)
- Points created by PI Connectors use the Base point class. [S:dcv-simple-pi-system-2020] (read)
- PI Interfaces have "Exclusive connectivity to PI Data Archive" for OPC DA, OPC HDA, UFL, RDBMS and PI-To-PI. [S:dcv-felts-connectivity-2023] (read)
- The AVEVA Adapter for MQTT (Sparkplug B component type "MQTTSparkplugB") runs with EDS on Linux. [S:dcv-uc23-mqtt-eds-workshop] (read)
- Connectors in development in 2019:
  - GE e-terra
  - Honeywell PHD
  - Modbus for Cisco IOx
  - MQTT Sparkplug
  - Siemens Spectrum 7
  - Tridium
  - WITSML PASON
  - 61850 with Relay

  [S:dcv-saboowala-connectivity-2019] (read)
- The 2019 Wonderware connector update added "Improved logic for handling Store and Forward events". [S:dcv-saboowala-connectivity-2019] (read)
- Embedded example: a Modbus PI Connector running on a Cisco 829 industrial router. [S:dcv-maytum-iiot-2017] (read)

**Terms**
- PI_UFL: the Universal File and Stream Loader interface, which parses ASCII files, serial streams or e-mail into PI using an INI of field and message rules. [S:dcv-ufl-studylib]
- Sparkplug B: an MQTT payload specification that the AVEVA Adapter for MQTT can consume. [S:dcv-uc23-mqtt-eds-workshop]

**Worked-example material**
- UFL INI fragment:

  ```
  PLUG-IN = asciifiles.dll
  IFM = "C:\PIPC\Interfaces\PI_UFL\Data\*.txt"
  MSGINERROR = c:\pipc\interfaces\PI_UFL\logs\errors.out
  OUTPUT = c:\pipc\interfaces\ufl\logs\pi_ufl.out
  LOCALE = de-de
  ```

  [S:dcv-ufl-studylib]

**Open questions**
- RDBMS interface details are not read: query placeholders (`?` with `P1=TS`), distribution strategies, `/SQL` files and Location3 meanings (verify).
- Modbus Location codes are not read.
- CygNet connector details are not read.
- Wonderware and Siemens connector retirement status is not read.

---

### dc.relay-dcm: PI Connector Relay and PI Data Collection Manager

**Facts**
- PI Connector (1st gen) sends data straight to the PI Data Archive (auto point creation) and the source structure to AF. [S:dcv-arch-workbook] (read)
- PI Connector (2nd gen) sends data through the PI Connector Relay, which forwards it to the PI Data Archive and AF. Configuration is managed through PI Data Collection Manager. [S:dcv-arch-workbook] (read)
- "There is currently NO FAILOVER support for PI Connector (2nd gen) and PI Connector Relay." [S:dcv-arch-workbook] (read)
- To use a gMSA with Connectors, Relay or DCM, add the gMSA to the PI Connector Administrators or PI Trusted Installers group. [S:dcv-arch-workbook] (read)
- PI Connectors and PI Connector Relay send events with UTC timestamps. [S:dcv-arch-workbook-2020] (read)
- Relay supports "Secure & Flexible Architectures", sending data across networks to multiple destinations, with "Certificates: Authentication and Encryption". [S:dcv-coen-connectivity-2017] (read)
- Data Collection Manager provides a "Unified Admin Experience". Relay and DCM betas were slated for 3Q–4Q 2017 and release in 4Q 2017. [S:dcv-coen-connectivity-2017] (read)
- The Relay sits in the DMZ between edge and enterprise PI Server. Traditional connections use X.509 certificates, and remote devices or OMF apps use SAS tokens. [S:dcv-maytum-iiot-2017] (read)
- A beta of "PI Server ingress through PI Connector Relay" for OMF was targeted for Q4 2017. [S:dcv-felts-edge-2017] (read)
- A third-party OMF client states that OSIsoft has discontinued the PI Connector Relay as an OMF endpoint and that PI Web API replaced it. Relay configuration used a Producer Token and Relay Ingress URL from Data Collection Manager. [S:dcv-foglamp-omf] (read)
- The AVEVA OMF samples list PI Connector Relay as "not tested" and recommend the PI Web API OMF endpoint for PI. [S:dcv-github-osi-samples-omf] (read)
- AVEVA's 2023 roadmap still lists the Relay under "Continued Support and Investment". Administration is described as "Reliable configuration with ICU and DCM". [S:dcv-felts-connectivity-2023] (read)

**Terms**
- PI Connector Relay: a service that receives data from 2nd-generation connectors (and early OMF apps) and forwards it to PI Data Archive and AF. [S:dcv-arch-workbook]
- PI Data Collection Manager (DCM): the central web tool for registering and configuring connectors, relays and destinations. [S:dcv-coen-connectivity-2017]

**Common mistakes / pitfalls**
- Assuming Relay has failover: it does not. [S:dcv-arch-workbook]
- Building new OMF apps against Relay instead of the PI Web API OMF endpoint. [S:dcv-foglamp-omf]

**Open questions**
- Relay default port (often quoted as 5460) is unconfirmed (verify).
- DCM default port is unconfirmed (verify).
- Relay end-of-life status is unconfirmed (verify).

---

### dc.pi-to-pi: PI to PI interface and history recovery

**Facts**
- The PI to PI interface "copies PI point data from one PI Data Archive to another", one way from source to target. [S:dcv-pitopi-manualzz] (read)
- Uses include isolating users from the source for security and load distribution, backups, test copies and aggregation. A common case is plant-level to corporate Data Archive. [S:dcv-pitopi-manualzz] (read)
- The same use case is described in [S:dcv-admin-it-2017r2] (read).
- History recovery "recover[s] archive data for time periods when the interface was not running". It runs at startup and after a lost connection is restored. [S:dcv-pitopi-manualzz] (read)
- "Exception data has only passed exception testing". It is faster to read (from memory) but not compressed, unlike archive data. [S:dcv-pitopi-manualzz] (read)
- PI to PI point attributes (manual TOC):

  | Attribute | Purpose |
  |---|---|
  | Location1 | Interface instance |
  | Location2 | Timestamp adjustment |
  | Location3 | Interface status events |
  | Location4 | Scan class |
  | Location5 | Write mode |
  | InstrumentTag | Source point name |
  | UserInt1 | Source point ID |

  [S:dcv-pitopi-manualzz] (read)
- PI to PI supports source-Data-Archive-level failover and UniInt Phase 2 interface-level failover (cold, warm or hot). [S:dcv-pitopi-manualzz] (read)
- PI to PI "is not a true data replication tool". It does not support annotations or batch data. [S:dcv-pitopi-manualzz] (read)
- It can run on a separate node from both source and target. [S:dcv-pitopi-manualzz] (read)
- Best-practice NERC CIP diagrams show a business-domain PI Server fed by PI to PI from a protected-domain PI Server. [S:dcv-lonsberry-arch-2011] (read)
- AVEVA's 2023 roadmap places Batch, PItoPI, OPC DA and OPC A&E interfaces under a "PI System Connector" migration path. [S:dcv-felts-connectivity-2023] (read)
- The PI System Connector (2016) supported secure cross-domain transfer, archive replication and backfilling. [S:dcv-iuliano-ems-2016] (read)

**Terms**
- History recovery: the PI to PI startup and reconnect step that reads archive data from the source for the outage window and writes it to the target. [S:dcv-pitopi-manualzz]

**Open questions**
- Exact startup switches (`/SRC_HOST`, history recovery hours `/RH` or `/OH`, `/DB`, `/ost`) and their defaults could not be read (verify all).

---

### dc.adapters-eds: AVEVA Adapters, Edge Data Store, OMF

**Facts**
- An AVEVA Adapter collects time-series data and metadata and sends it to OMF endpoints such as PI Web API and CONNECT data services. [S:dcv-arch-workbook] (read)
- Adapters are described as "Ready off-the-shelf, lightweight footprint, flexible end-points". The protocols listed in 2023 are:
  - Azure Event Hubs
  - BACnet
  - DNP3
  - Modbus TCP
  - MQTT
  - OPC UA
  - RDBMS
  - Structured Data Files

  [S:dcv-felts-connectivity-2023] (read)
- Adapter destinations include AVEVA PI Servers, AVEVA Data Hub and Edge Data Store. [S:dcv-felts-connectivity-2023] (read)
- "Edge Data Store (EDS) is a lightweight data collection and storage application." It complements the PI System and OCS and is not a replacement for them. [S:dcv-eds-docs-github] (read)
- EDS components:
  - Modbus TCP adapter
  - OPC UA adapter
  - Data Storage
  - Data egress (to PI Server or OCS)
  - Health

  Local interfaces are OMF REST, SDS REST APIs, and configuration through REST or EdgeCmd. [S:dcv-eds-docs-github] (read)
- The EDS REST API port is 5590 by default and is configurable. [S:dcv-eds-docs-github] (read)
- In the AVEVA World 2023 workshop, EDS ran on port 5590 and the MQTT adapter component on 5591. [S:dcv-uc23-mqtt-eds-workshop] (read)
- Install on Linux with `sudo apt install`. Verify with `edgecmd get system`. Stream data is visible at `/api/v1/tenants/default/namespaces/default/streams/`. [S:dcv-uc23-mqtt-eds-workshop] (read)
- EdgeCmd is a command-line tool that translates commands into REST calls. It is a separate install kit for Linux or Windows. [S:dcv-uc23-mqtt-eds-workshop] (read)
- Adapter configuration facets:
  - Configurable: Components, Logging, Buffering, HealthEndpoints, DataSource, DataEndpoints, DataFilters, DataSelection
  - Read-only: Version, General, Diagnostics, Application, FailoverState, ClientSettings

  [S:dcv-uc23-mqtt-eds-workshop] (read)
- EDS runs on Linux and Windows, "hardware agnostic", including single-board computers such as Raspberry Pi. It "uses a proprietary sequential data store". [S:dcv-eds-datasheet-2022] (read)
- The 2017 Edge DS hardware target was:
  - 1 GB RAM
  - ARM or x64 1.2 GHz quad-core
  - Ubuntu 16.04, or Windows IoT Core / Windows 10
  - Docker support

  It used 100 ns timestamps and was "not a PI Data Archive Replacement". [S:dcv-felts-edge-2017] (read)
- OMF "Defines a set of message bodies and headers" for data acquisition apps. It is "currently limited to data ingress". [S:dcv-felts-edge-2017] (read)
- OMF message types:
  - Type: the schema, defined with JSON Schema
  - Container: groups readings of a single Type
  - Data: readings conforming to the Type

  [S:dcv-felts-edge-2017] (read)
- OMF transport is not tied to a protocol (HTTP, AMQP or Kafka). In each message all objects "must be of the same message type". Bulking and compression are recommended. [S:dcv-devtech-workbook-2020] (read)
- OMF headers (2017):
  - ProducerToken
  - MessageType (Type, Container or Data)
  - MessageFormat (JSON)
  - Compression (GZip, optional)
  - Action (Create, Update or Delete)

  [S:dcv-chudnovskiy-ocs-2017] (read)
- OMF ingress headers on Data Hub:
  - MessageType: `type`, `container` or `data`
  - MessageFormat: `json` only
  - OmfVersion: `1.0`, `1.1` or `1.2`
  - Action: `create` (default), `update` or `delete`
  - Compression: `gzip` only

  [S:dcv-github-datahub-omf-ingress] (read)
- OMF limitations from the AVEVA samples:
  - PI accepts only DateTime as the index.
  - PI supports only one index.
  - ADH accepts only the Dynamic classification.
  - ADH does not accept Link type data.

  [S:dcv-github-osi-samples-omf] (read)
- The OMF basic sample (v2.2.0) references OMF 1.2. It sends OMF-Types.json, OMF-Containers.json and OMF-Data.json. Endpoint types are CDS, EDS (`http://localhost:5590`) and PI (PI Web API URL plus DataArchiveName). [S:dcv-github-omf-basic-python] (read)
- The PI Web API OMF endpoint requires the OMF option to be selected at PI Server install. It is recommended for all new deployments. [S:dcv-foglamp-omf] (read)
- AVEVA's 2023 roadmap lists "OMF Endpoint Updates" covering assets, events, 1D data and relationships. [S:dcv-felts-connectivity-2023] (read)

**Terms**
- OMF: the OSIsoft (Open) Message Format, a JSON-over-HTTPS specification of type, container and data messages for ingesting data to PI Web API, EDS or Data Hub. [S:dcv-felts-edge-2017]
- Container (OMF): an OMF object, identified by `id`, that references a `typeid`. It becomes a PI point or SDS stream. [S:dcv-chudnovskiy-ocs-2017]
- EdgeCmd: the command-line utility for configuring EDS and adapters through their REST APIs. [S:dcv-uc23-mqtt-eds-workshop]
- Facet: a named section of an adapter's or EDS's configuration (DataSource, DataSelection, Buffering and so on). [S:dcv-uc23-mqtt-eds-workshop]

**Worked-example material**
- The 2017 OMF example, reconstructed from the deck's description:
  - Type: `[{"id":"SensorReading","version":"1.0.0.0","type":"object","classification":"dynamic","properties":{"Time":{"type":"string","format":"date-time","isindex":true},"Reading":{"type":"number"}}}]`
  - Container: `[{"id":"Sensor1Readings","typeid":"SensorReading","typeversion":"1.0.0.0"}]`
  - Data: `[{"containerid":"Sensor1Readings","values":[{"Time":"...","Reading":14.0},{"Time":"...","Reading":15.1}]}]`

  [S:dcv-chudnovskiy-ocs-2017] (inferred: the JSON is reconstructed from the deck's field-level description)
- EDS sample config: `{"Selected": true, "EndpointType": "EDS", "Resource": "http://localhost:5590", "ApiVersion": "v1", "UseCompression": false}` [S:dcv-github-omf-basic-python]

**Open questions**
- PI Web API OMF path (`/piwebapi/omf`) and its required `x-requested-with` header: seen only as search titles, not read (verify).
- OMF 1.2 static types and `__Link` are not read.
- Adapter lists for DNP3, BACnet and SDF are confirmed. Per-adapter configuration was not read.

---

### dc.cloud: AVEVA Data Hub / CONNECT data services ingestion

**Facts**
- Data Hub OMF ingress endpoint: `POST /api/v1/tenants/{tenantId}/namespaces/{namespaceId}/omf`. [S:dcv-github-datahub-omf-ingress] (read)
- A 202 response returns an `Operation-Id`. Errors include 400, 401, 403, 404, 408, 413 (payload too large), 415, 500, 503 and 504. [S:dcv-github-datahub-omf-ingress] (read)
- Error bodies contain OperationId, Error, Reason, Resolution and Parameters. [S:dcv-github-datahub-omf-ingress] (read)
- Data Hub regional base URLs are `https://uswe.datahub.connect.aveva.com` (North America) and `https://euno.datahub.connect.aveva.com` (EMEA). [S:dcv-github-omf-basic-python] (read)
- Data Hub OMF authentication uses a client-credentials client ID and secret scoped to a tenant and namespace. [S:dcv-github-omf-basic-python] (read)
- An OMF connection in Data Hub maps device client IDs. "ClientIds may be mapped to at most one connection per namespace." [S:dcv-github-adh-omf-ingress] (read)
- The OMF connection is created with a Name, Description and ClientIds and must reach State "Active" before use. [S:dcv-github-adh-omf-ingress] (read)
- The resource URL is "the base address, NOT the OMF endpoint". [S:dcv-github-adh-omf-ingress] (read)
- In Data Hub, a container message creates an SDS stream. Types and containers are removed by sending the same messages with Action delete. [S:dcv-github-adh-omf-ingress] (read)
- AVEVA's 2023 roadmap lists "PI to Data Hub" as "Available today" and "Data Hub to PI" as "In Development". [S:dcv-felts-connectivity-2023] (read)
- 2019: EDS stored data "is transferred to OCS using configurable egress rules". [S:dcv-saboowala-connectivity-2019] (read)
- 2016: "PI Cloud Services" offered a multi-tenant design, REST API access and lossless compression. [S:dcv-kwan-roadmap-2016] (read)
- OCS (OSIsoft Cloud Services) is the predecessor name of AVEVA Data Hub. This is suggested by the samples' "CDS" endpoint type and the datahub.connect.aveva.com URLs (inferred).

**Terms**
- Namespace (Data Hub): a logical data container within a tenant. OMF ingress and streams are scoped to it. [S:dcv-github-datahub-omf-ingress]
- OMF connection: a Data Hub object linking client-credential IDs to a namespace for OMF ingress. [S:dcv-github-adh-omf-ingress]

**Open questions**
- PI to Data Hub agent details are not read: install on PI side, transfer configuration, and AF-to-asset mapping.
- PI Cloud Connect (legacy) is not researched.
- Exact rename timeline OCS → CONNECT data services → AVEVA Data Hub is not confirmed (verify).

---

### vis.vision-basics: PI Vision symbols, editing, time bar, search

**Facts**
- **Home page controls (numbered in the course):**
  - 1 Home
  - 2 Group filter
  - 3 Filter by keywords
  - 4 Select displays to move
  - 5 Show private displays
  - 6 Touch-friendly toggle
  - 7 Create New Display
  - 8 PI Vision Messages
  - 9 Identity connected
  - 10 Help
  - 11 Search display box
  - 12 Predefined groups
  - 13 Folders
  - 14 Display thumbnail
  - 15 Shared/public indicator
  - 16 Related displays
  - 17 Display settings
  - 18 Favorite
  - 19 Table view
  - 20 Thumbnail view
  - 21 Ascending/descending sort
  - 22 Sort by Accessed, Modified, Name or Owner

  [S:dcv-visualizing-workbook-2024] (read)
- Predefined home-page groups: All Displays, Favorites, My Displays, Recent (last seven days). [S:dcv-visualizing-workbook-2024] (read)
- Folder actions: Create new folder, Move folder, Edit folder settings (rename, share, permissions), Delete folder. Deleting a folder moves its contents to Home. [S:dcv-visualizing-workbook-2024] (read)
- In version 2024, folders can be shared by URL and can inherit permissions from the parent folder. [S:dcv-visualizing-workbook-2024] (read)
- **Design mode toolbar (numbered):**
  - 1 Display name (shows "Click Save Icon" if unnamed; `*` marks unsaved changes)
  - 2 Design mode
  - 3 Display settings
  - 4 Save
  - 5 Undo/Redo
  - 6 Cut
  - 7 Copy
  - 8 Paste
  - 9 Delete
  - 10 Arrange (Align, Bring forward, Send back, Distribute)
  - 11 Grid on/off
  - 12 Select
  - 13 Predefined shapes
  - 14 Text
  - 15 Images/GIFs

  [S:dcv-visualizing-workbook-2024] (read)
- Right-clicking in design mode offers Format Display, Format Shape, Format Line and Format Symbols. [S:dcv-visualizing-workbook-2024] (read)
- An orange border marks Design mode. The first save of a new display (prompting for name and folder) leaves Design mode, and the Design mode icon re-enters editing. [S:dcv-visualizing-workbook-2024] (read)
- **The "ten core dynamic symbols":**
  1. Trend
  2. Value (Multiple Value)
  3. Vertical Gauge
  4. Horizontal Gauge
  5. Radial Gauge
  6. Table
  7. Asset Comparison Table
  8. Time Series Table
  9. Bar Chart
  10. XY Plot

  [S:dcv-visualizing-workbook-2024] (read)
- Elsewhere the same workbook says "nine core dynamic symbols", an internal inconsistency. [S:dcv-visualizing-workbook-2024] (read)
- The Time Series Table symbol (version 2024) shows sequential values with timestamps. Its default update interval is 5 seconds, and administrators can set its default configuration across all displays. [S:dcv-visualizing-workbook-2024] (read)
- The three gauges share zero/span logic. The Table shows name, value, description and summary columns over the time range. [S:dcv-visualizing-workbook-2024] (read)
- Trend capabilities: cursors, pan, zoom and hiding traces. Double-clicking a trend expands (maximises) it. [S:dcv-visualizing-workbook-2024] (read)
- The double-click behaviour is also described in [S:dcv-exploration-notification-2020] (read).
- A symbol type is chosen before dragging data in. The course says to "Make sure a trend selected as the default visualization object (upper left-hand corner)". [S:dcv-exploration-notification-2020] (read)
- Dragging an attribute onto a blank display creates the default symbol. Dragging another attribute onto an existing trend adds a trace. [S:dcv-exploration-notification-2020] (read)
- **Configuration options per symbol:**

  | Symbol | Dialog | Options |
  |---|---|---|
  | Gauge | Format Gauge | Style (type e.g. Arc, Units, value colour); Visibility (Label, Scale) |
  | Value | Format Value | Font size; Visibility (Label, Units, Timestamp, Value); Units |
  | Trend | Configure Trend | see below |
  | Table | Configure Table | Columns (Show Column toggles: Description, Trend, Minimum, Maximum); Style |
  | Asset Comparison Table | Configure Table | Add Dynamic Search Criteria; Add Multistate |
  | Bar Chart | Format Bar chart | Orientation (vertical/horizontal); Style; Visibility; Bar Options (bar label); Scale; Multi-state; Add Dynamic Search Criteria |
  | XY Plot | Configure XY Plot | Format section with Regression Line and Correlation Coefficient |

  [S:dcv-visualizing-workbook-2024] (read)
- Configure Trend options:
  - Value Scales: scale type, for example "single scale"; Scale Range, for example "Autorange of dynamic values"; Scale Labels, for example "Outside the plot Area"
  - Trace Options: colour and style
  - Trend options: Title; Grid (Lines/Plain)
  - Time Range: Display time range; Duration and Offset; Use custom time range

  [S:dcv-visualizing-workbook-2024] (read)
- From 2022, Unit of Measure can be set per data item and per symbol. [S:dcv-visualizing-workbook-2024] (read)
- **Multi-state:**
  - Right-click a Value or Gauge and choose Add Multi-State, then Configure Multi-State.
  - There are five regular states with colours, plus a Bad data state and a Blink option.
  - Maximums are editable, and states can be added or removed with X.
  - The trash icon uncouples the attribute.

  [S:dcv-visualizing-workbook-2024] (read)
- If the AF attribute has Limits, multi-state uses them and only the colours can change. "The Bad data state can only be configured by a PI administrator", though any user can change its colour. [S:dcv-visualizing-workbook-2024] (read)
- **Time bar** controls: Start time, Revert display, shift arrows, Duration button (for example 1h), Now button, End time. The default display span is 8 hours. [S:dcv-visualizing-workbook-2024] (read)
- PI Time reference abbreviations:
  - `*` (now)
  - `t` (today)
  - `y` (yesterday)
  - weekday names (`mon`, `fri`)
  - month names (`may`, `apr-15`)
  - `YYYY`
  - `M-D` or `M/D` (USA), `D-M` or `D/M` (rest of world)
  - a bare day number (`15`)

  [S:dcv-visualizing-workbook-2024] (read)
- Offset units: `s`, `m`, `h`, `d`, `mo`, `y`, `w` (full and plural names are accepted). [S:dcv-visualizing-workbook-2024] (read)
- PI Time rules:
  - Only one offset is allowed per expression.
  - Fractions are allowed only for s, m and h.
  - Missing fields default to midnight or the current day, month or year.

  [S:dcv-visualizing-workbook-2024] (read)
- **Search:**
  - The Assets pane is a navigation tree for drilling through the hierarchy.
  - The Search pane finds PI Points, AF elements, attributes, descriptions and saved displays.
  - Wildcards are `*` (assumed at the end of every query) and `?` (single character).

  [S:dcv-visualizing-workbook-2024] (read)
- Events appear in an Events tab on the left. The colour beside each event shows severity. [S:dcv-analyzing-workbook-2022] (read)
- **Keyboard shortcuts:**

  | Keys | Action |
  |---|---|
  | Ctrl+C / Ctrl+V / Ctrl+X | Copy / paste / cut |
  | Delete or Backspace | Delete |
  | Arrow keys | Move |
  | Ctrl+click | Multi-select |
  | Ctrl+A | Select all |
  | Shift+drag | Resize proportionally |
  | Ctrl+Z / Ctrl+Y | Undo / redo |
  | Ctrl+S | Save |
  | Shift while drawing a line | Snap the line to 45° |

  [S:dcv-visualizing-workbook-2024] (read)
- **Navigation links:**
  - Right-click a symbol, shape or image and choose "Add Navigation Link…" to open another PI Vision display or an external URL.
  - Options are "Set start and end time", "Set asset context" and "Use current asset", plus "Search for displays" to pick the target.
  - "Open hyperlink to another page" is a further option.

  [S:dcv-visualizing-workbook-2024] (read)
- An ad hoc display is "a temporary display that shows a single trend populated with specified data items". [S:dcv-visualizing-workbook-2024] (read)
- **URL parameters:**
  - `?` starts the query string and `&` separates parameters.
  - `StartTime` and `EndTime` take any PI time, for example `StartTime=*-1h&EndTime=*`.
  - `Mode=Kiosk` gives limited interactivity (read-only).
  - `HideToolbar` and `HideTimebar` hide those elements.
  - URL parameters can also set the time zone, swap to other assets sharing the same AF template, and prevent mobile redirection.

  [S:dcv-visualizing-workbook-2024] (read)
- The graphic library offers symbols such as tanks, dragged into the display. Text can be bold, sized (for example 18) and filled. [S:dcv-visualizing-workbook-2024] (read)
- The 2017 graphics library offered "Same symbols as available from PI ProcessBook". [S:dcv-thomassen-pivision-2017] (read)
- Attribute values containing URLs act as hyperlinks on a display (2017 R2). [S:dcv-sloves-pivision-2017] (read)
- 2017 R2 editor improvements: snap to grid, display printing, improved font size control and display-level number format. [S:dcv-pelletier-pivision-2017] (read)
- Selecting the PI Vision logo (upper left) returns to the display thumbnails. [S:dcv-exploration-notification-2020] (read)

**Terms**
- Design mode: PI Vision's editing state, shown with an orange border, where symbols are added and configured. [S:dcv-visualizing-workbook-2024]
- Multi-state: symbol colouring driven by the value of an attribute against up to five ranges (or the AF attribute Limits), with a Bad data state. [S:dcv-visualizing-workbook-2024]
- Ad hoc display: a temporary, unsaved display (a single trend of chosen items), often opened by URL. [S:dcv-visualizing-workbook-2024]
- Kiosk mode: the `Mode=Kiosk` URL parameter that opens a display with limited interactivity. [S:dcv-visualizing-workbook-2024]
- Time bar: the strip at the bottom of a display holding start and end time, duration, shift arrows and Now. [S:dcv-visualizing-workbook-2024]

**Worked-example material**
- Time expressions from the course:
  - `*-1h`
  - `t+8h`
  - `y-8h`
  - `mon+14.5h`
  - `sat-1m`
  - `1-jan-20 - 1d`
  - `-1d`
  - `+6h`
  - `-30m`
  - `-15s`
  - `*+15m`
  - fixed time `26-jan-88 12:34`

  [S:dcv-visualizing-workbook-2024]
- Search examples: `VPSD*Flow`, `Mixing`, `temp`, `*Tank1 in Production*`, `*Net Flow*`, `F?Rate`. [S:dcv-visualizing-workbook-2024]
- Kiosk URL pattern: `https://<server>/PIVision/#/Displays/<id>/<name>?StartTime=*-1h&EndTime=*&Mode=Kiosk`.
  - Parameter names are from [S:dcv-visualizing-workbook-2024].
  - The path form is (inferred).
- Migration lab server URL: `https://pivision/pivision`. [S:dcv-pb-migration-lab-2020]

**Common mistakes / pitfalls**
- More than one offset in a time expression (for example `*-1d+2h`) is not allowed. [S:dcv-visualizing-workbook-2024]
- A fractional value with d, mo or y units. [S:dcv-visualizing-workbook-2024]
- Expecting to change multi-state ranges when the attribute has AF Limits: only colours can change. [S:dcv-visualizing-workbook-2024]

**Open questions**
- Is there a Gantt symbol? Not seen in the sources (verify).
- Event Details symbol configuration is not read.
- The full Shapes list (rectangle, ellipse, line, polyline, arc?) is not read (verify).
- Trend "Multiple scales" and "Time format" options are not seen in the readable text (verify).

---

### vis.vision-advanced: collections, asset swap, event comparison

**Facts**
- **Asset switching:**
  - The Switch Asset dropdown changes the asset context.
  - The gear icon opens "Configure Context Switching".
  - Options: Show search results, Show Assets paths, Search Root, Return All Descendants, Asset Type (for example a template such as "Generic Tank Template").

  [S:dcv-visualizing-workbook-2024] (read)
- Related Assets (2017 R2): authors define asset criteria for context switching, swap a single asset or an entire asset path, or disable switching. Users can filter related assets by name. [S:dcv-sloves-pivision-2017] (read)
- **Collections:**
  - Use "Convert to Collection...", Modify collection and "Edit Collection Criteria...".
  - Criteria: Search Root, Return All Descendants, Asset Type, and Asset Attribute with operators (for example "> 50").
  - Collections update automatically as asset values change.

  [S:dcv-visualizing-workbook-2024] (read)
- A collection groups one or more symbols. It "automatically reflects when equipment is added or removed from the system" and can be filtered by live data values. [S:dcv-sloves-pivision-2017] (read)
- PI Vision 2017 introduced:
  - Collections
  - Drill-in Navigation
  - Graphics Library
  - Asset Comparison Table
  - User Types

  [S:dcv-thomassen-pivision-2017] (read)
- 2017 also brought Events Table, Pinned Events and XY Plot (CTP). [S:dcv-gomatam-pivision-2017] (read)
- Pinned Events: reference events saved with the display, used to spot batch deviations. [S:dcv-sloves-pivision-2017] (read)
- The Event Table filters by asset type, severity, hierarchy and more. [S:dcv-clark-pivision-2017] (read)
- The XY Plot identifies correlations between attributes, compares assets and compares time ranges. [S:dcv-sloves-pivision-2017] (read)
- PI Vision 2017 R2 added display folders, Related Assets enhancements, XY Plot, Events Table, and text and value formats. [S:dcv-sloves-pivision-2017] (read)
- Right-clicking an event offers "Apply Time Range" and "Compare Similar Events by Type". The latter trends the trigger attributes for that event and recent similar events. [S:dcv-analyzing-workbook-2022] (read)
- "Edit Search Criteria" widens an event comparison, for example to 100 Inactivity events across all turbines. [S:dcv-analyzing-workbook-2022] (read)
- Each trend can have its own time context: Display time range, Duration and Offset, or a custom range (for example `*-48h` to `*`). [S:dcv-visualizing-workbook-2024] (read)
- A navigation link can carry the asset and time context to the target display. [S:dcv-visualizing-workbook-2024] (read)
- PI Vision 2016 (as PI Coresight 2016) added a new Display Editor, mobile support and Event Comparison. [S:dcv-kwan-roadmap-2016] (read)

**Terms**
- Collection: a group of symbols bound to an asset search (root, template, attribute filter) that repeats for each matching asset and updates dynamically. [S:dcv-visualizing-workbook-2024]
- Asset (context) switching: changing a display to show another asset of the same type, configured via Configure Context Switching. [S:dcv-visualizing-workbook-2024]
- Pinned event: an event frame saved with a display as a reference for comparison. [S:dcv-sloves-pivision-2017]

**Open questions**
- Events pane search criteria fields, event acknowledgement and annotations, and Event Details symbol are not read.
- Reason codes ("Event Reason Entry") are mentioned only in [S:dcv-thomassen-pivision-2017].

---

### vis.vision-admin: administration, security, extensibility

**Facts**
- Administrators control read and write access to display folders and can view private displays. [S:dcv-thomassen-pivision-2017] (read)
- User types (2017):
  - Publisher (content creator), "equivalent to the traditional PI Coresight user", can create and save displays.
  - Explorer "can not save any new displays or changes to existing displays" but can switch context, adjust time, investigate events and create ad hoc displays.

  [S:dcv-gomatam-pivision-2017] (read)
- Folder settings include share and permissions. From 2024, folders can inherit permissions from the parent folder. [S:dcv-visualizing-workbook-2024] (read)
- Display sharing in the migration utility uses "Display Sharing Access: World". [S:dcv-pb-migration-lab-2020] (read)
- Display Sharing Access is shown together with Target Display Owner and Destination folder. [S:dcv-pb-migration-lab-2020] (read)
- Only a PI administrator can configure the Bad data state. Administrators set the default Time Series Table configuration for all displays. [S:dcv-visualizing-workbook-2024] (read)
- PI Vision 2017 R2 added server-side enhancements for PI Web API. [S:dcv-pelletier-pivision-2017] (read)
- PI Vision 4 (UC EMEA 2018) introduced an "Integrated Visualization Infrastructure" with official extensibility. [S:dcv-thomassen-pivision-2017] (read)
- A 2023 customer solution was tested on PI Vision Server 3.7.1. [S:dcv-kruger-pivision-2023] (read)

**Open questions (all verify)**
- Admin site at `/PIVision/Admin`
- IIS application hosting
- SQL Server PI Vision database
- Kerberos constrained delegation to Data Archive and AF
- PI Web API as data back end
- Custom symbol extensibility: `ext` folder, `sym-<name>.js`, `sym-<name>-template.html`

None of these was readable in this session.

---

### vis.processbook: PI ProcessBook (legacy) and migration

**Facts**
- ProcessBook is described as "a 25-year-old product that has begun to show its age" (2020). [S:dcv-pb-migration-lab-2020] (read)
- The "PI ProcessBook to PI Vision Migration Utility" workflow:
  1. Add Files and select Folders of .pdi files.
  2. Run Analysis and review the Analysis Results categories and Issues.
  3. Export VBA, which writes a .vba file and MigrationAnalysis.csv to a reports folder.
  4. Migrate.
  5. Review the Migration Report.

  [S:dcv-pb-migration-lab-2020] (read)
- "In order to preserve links between PI ProcessBook displays, they must be migrated in the same operation." [S:dcv-pb-migration-lab-2020] (read)
- VBA "is not supported in PI Vision". ProcessBook datasets (calculations) are not carried over. The lab rebuilds them as AF analyses. [S:dcv-pb-migration-lab-2020] (read)
- Migration settings:
  - PI Vision server URL
  - destination folder
  - Target Display Owner
  - Display Sharing Access
  - "Persist folder structure from migrated items"

  [S:dcv-pb-migration-lab-2020] (read)
- ProcessBook display files use the .pdi extension (examples: PG_Flynn_Home.pdi, PowerGeneration.pdi). [S:dcv-pb-migration-lab-2020] (read)
- In 2016, "ProcessBook displays are still viewable through PI Coresight" (PB Viewer). [S:dcv-kwan-roadmap-2016] (read)
- PI Vision's stated strategy was to "Provide PI ProcessBook customers a path forward" through Process Graphics. [S:dcv-sloves-pivision-2017] (read)
- The PI Visualization Suite listed PI Vision, PI ProcessBook, PI DataLink and PI WebParts (2017). [S:dcv-collins-pi101-2017] (read)

**Terms**
- PDI file: a PI ProcessBook display file. [S:dcv-pb-migration-lab-2020]
- Migration Utility: the tool that analyses and converts .pdi displays to PI Vision displays. [S:dcv-pb-migration-lab-2020]

**Open questions**
- ProcessBook end-of-sale and end-of-support dates are not found (verify).
- The utility's full list of supported and unsupported objects is not found.

---

### vis.datalink: PI DataLink (Excel)

**Facts**
- Function groups:
  - Single-value: "exactly one value per data item"
  - Multiple-value
  - Calculation
  - Events: event frames from AF
  - Search: data items matching criteria
  - Properties

  [S:dcv-datalink-lab-2020] (read)
- Calculated Data maps to the Excel function `PIAdvCalcVal`. Compressed Data maps to `PICompDat`. [S:dcv-datalink-lab-2020] (read)
- The PICompDat example is `PICompDat("cdm158","y","t",1,"","inside")`. [S:dcv-datalink-lab-2020] (read)
- Calculated Data task pane fields:
  - Data item(s) and Root path
  - Start time and End time
  - Time Interval
  - Calculation mode (for example total, average)
  - Conversion factor (1440 for a total of a per-minute rate)
  - show end time
  - show percent good

  [S:dcv-datalink-lab-2020] (read)
- "The only PI DataLink function that is volatile by default is Current Value." [S:dcv-datalink-lab-2020] (read)
- Resources > Settings has an Automatic Update option ("Full calculate, 0s Interval") and an Update button that toggles auto-update. [S:dcv-datalink-lab-2020] (read)
- Converting single-cell formulas into contiguous ranges cut call counts by an order of magnitude. [S:dcv-datalink-lab-2020] (read)
- With Excel dynamic arrays, only the top-left cell is editable. A blocked spill range shows #SPILL, and older Excel shows #NAME?. [S:dcv-datalink-lab-2020] (read)
- Event retrieval has two methods:
  - Explore Events is hierarchical and suits events sharing a template.
  - Compare Events is flat, with child attributes on the parent row.

  [S:dcv-analyzing-workbook-2018] (read)
- Event search fields:
  - Database, Event Name, Search Start, Search End
  - Event Template, Element Template, Element Name
  - More Search Options (attribute values, duration, category)
  - Number of child event levels (Explore only)

  [S:dcv-analyzing-workbook-2018] (read)
- To preview more than 1,000 event frames, change Settings to 10,000. [S:dcv-analyzing-workbook-2018] (read)
- DataLink 2012 added AF integration (attributes and asset-relative use), search, and Excel 2010 64-bit support. It dropped Excel 2003. [S:dcv-datalink-2012-uc] (read)
- DataLink 2012 supported AF data references PI point, Formula, Custom and Table. [S:dcv-datalink-2012-uc] (read)
- PI DataLink Server was planned for 2013 for SharePoint 15. [S:dcv-datalink-2012-uc] (read)
- PI DataLink 2019 SP1 is version 5.5.1. [S:dcv-exploration-notification-2020] (read)
- DataLink support for Notifications is "read only" in 2016+. [S:dcv-kwan-roadmap-2016] (read)

**Worked-example material**
- Compare Events example settings: Database `\\PISRV01\Fleet Generation`, Event Name `*`, Search Start `*-1d`, template "Gas Turbine Temperature Anomaly", minimum duration 30 minutes. [S:dcv-analyzing-workbook-2018]
- `PICompDat("cdm158","y","t",1,"","inside")` [S:dcv-datalink-lab-2020]

**Open questions (verify)**
- Function names and arguments for Current Value (`PICurrVal`), Archive Value (`PIArcVal`), Sampled Data (`PISampDat`), Timed Data (`PITimeDat`), Time Filtered (`PITimeFilter`), Expression (`PIExpVal` / `PIExpDat`) and Asset Filter Search
- Retrieval mode and boundary type option lists
- Meaning of each PICompDat argument

None of these was read.

---

### vis.legacy-web: PI Coresight, PI WebParts, PI Manual Logger

**Facts**
- In September 2016 the roadmap listed PI Coresight 2016, 2016 R2 and "PI Coresight 2017 (tentative, TBD)". [S:dcv-kwan-roadmap-2016] (read)
- The October 2017 decks are titled "PI Vision 2017". The Publisher user type is "equivalent to the traditional PI Coresight user that has existed in all previous versions of the product". This implies PI Vision 2017 succeeded PI Coresight. [S:dcv-sloves-pivision-2017] (inferred)
- PI WebParts appears in the 2017 PI Visualization Suite. PI Manual Logger appears under PI Interfaces and PI Connectors. [S:dcv-collins-pi101-2017] (read)

**Open questions (verify)**
- Exact rename date and announcement (believed UC 2017)
- WebParts and SharePoint end-of-life
- Manual Logger features: tours, PI Manual Logger Web

---

### vis.bi: PI Integrator for Business Analytics, PI SQL Client, Power BI

**Facts**
- PI Integrator for BA "transforms PI System data into a decision-ready format" for BI tools such as Power BI, Tableau, Spotfire and QlikView. [S:dcv-devtech-workbook-2020] (read)
- It "works directly with PI AF (not the PI Data Archive)" when building view search criteria. [S:dcv-devtech-workbook-2020] (read)
- Integrator components:
  - PI Integrator Framework (master service)
  - Worker Nodes: "Up to 5 worker nodes can be added"
  - PI Integrator Sync, which watches for PI tag and AF changes

  [S:dcv-devtech-workbook-2020] (read)
- Integrator 1.0 offered fleet asset reporting and data warehouse integration. Version 1.1 added Oracle, Hadoop (Hive and HDFS) and event frames. Azure, SAP HANA, Kafka and Azure Event/IoT Hub targets were on the 2016–2017 roadmap. [S:dcv-kwan-roadmap-2016] (read)
- Integrator data flow steps are Cleanse, Augment, Shape, Transmit, Pull and Push. [S:dcv-collins-pi101-2017] (read)
- PI SQL Client:
  - For RTQP it "is the recommended tool for new development projects".
  - RTQP installs only on the PI AF Server and became available in PI Server 2018 SP2, succeeding PI OLEDB Enterprise.
  - Drivers are OLEDB, ODBC and JDBC, over Net.Tcp or HTTPS.
  - PI SQL Commander Lite is a query tool.

  [S:dcv-devtech-workbook-2020] (read)

**Open questions**
- Power BI connector for PI (PI SQL Client-based "AVEVA PI System" connector?) is not read (verify).

---

### vis.connect: CONNECT visualisation

**Facts**
- The 2023 architecture lists "AVEVA Connect, visualization services". Edge devices pair and bootstrap to "AVEVA Connect, common cloud platform". [S:dcv-felts-connectivity-2023] (read)
- EDS-sourced data in Data Hub can be viewed with the Data Hub trend tool. PI data can be viewed in PI Vision. [S:dcv-uc23-mqtt-eds-workshop] (read)

**Open questions**
- CONNECT data views, AVEVA Insight, and Data Hub trend and Data Views features are not researched (search budget exhausted).
