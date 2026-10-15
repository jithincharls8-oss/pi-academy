# ops2: Operations gap-fill (PI Vision admin, Kerberos/TLS, CONNECT, licensing, Part 11, sizing)

## Summary
- Counts (tag occurrences, excluding this summary): 134 (read), 2 (snippet), 9 (inferred).
- docs.aveva.com pages were not readable (JS shell only), so the official PI Vision install guide, PI Web API admin pages, PI to CONNECT agent docs and Data Archive audit reference are listed as `readable: false`.
- Readable substitutes:
  - an OSIsoft PI Vision installation workbook
  - AVEVA World 2023 security and claims-authentication decks
  - the AVEVA PI Vision Extensibility Guide on GitHub
  - AVEVA legal licensing documents from 2026
  - PI Square threads
- **Biggest gaps:**
  - the official SPN for PI Web API (only inferred to be HTTP/<host>, the same pattern as PI Vision)
  - the PI Data Archive version that introduced TLS (only "PI Server 2023 + OIDC" is confirmed; no "TLS 1.2" statement found)
  - any official PI Vision or AF hardware sizing table (none readable; AVEVA defers to account team or tech support)
  - the PI WebParts retirement date
  - PI Manual Logger e-signature support (no source; a 2022 feedback idea asks for it)
  - current AF audit trail SQL edition requirements
  - a full list of PI Vision 2023 features per release

---

### ops2.vision-admin: PI Vision administration (IIS, app pools, SQL database, admin site, groups, permissions)

**Facts**
- PI Vision prerequisites (OSIsoft course workbook):
  - "Microsoft Windows Server 2012 64-bit and later, incl. Server Core versions"
  - "Microsoft Information Services (IIS) 8.0 and later" (sic)
  - "Microsoft .NET Framework 4.8"

  [S:ops2-pb-migration-workbook] (read)
- "PI Vision requires MS SQL Server 2014 or above. All editions (Express, Standard, Enterprise) are supported." [S:ops2-pb-migration-workbook] (read)
- PI Vision installs three IIS application pools [S:ops2-pb-migration-workbook] (read):

  | Pool | Runs |
  |---|---|
  | PIVisionAdminAppPool | the Administration website |
  | PIVisionServiceAppPool | the main PI Vision application website |
  | PIVisionUtilityAppPool | the PI Vision Display Utility |
- The admin site URL is `https://<WebServer>/PIVision/Admin`. [S:ops2-pb-migration-workbook] (read)
- PI Vision creates three local Windows groups [S:ops2-pb-migration-workbook] (read):
  - "The PI Vision Admins group controls access to the PI Vision Admin site."
  - "The PI Vision Users group controls access to the PI Vision site."
  - "The PI Vision Utility Users group controls access to use the PI Vision Display Utility."
- The PI Vision SQL database is created from the Admin site: "In the Overview page of the PI Vision Admin site, click Manage Configuration next to PI Vision Database", then enter the database name. [S:ops2-pb-migration-workbook] (read)
- Creating the database needs:
  - the dbcreator server role
  - the ALTER ANY LOGIN permission, which is "given to users who have the securityadmin server role"

  [S:ops2-pb-migration-workbook] (read)
- A PI Square security blog says the account that creates the database needs "the db_creator server role" and ALTER ANY LOGIN. If SQL Server is on the PI Vision node, it says to set "Allow Triggers to Fire Others" to True. [S:ops2-pisquare-vision-security-blog] (read)
- Supported data sources (workbook): "PI Data Archive version 3.4.380 (the first version supporting Windows Integrated Security) and later" and "PI AF version 2018 (2.10) and later". [S:ops2-pb-migration-workbook] (read)
- The Admin site's Data Archive list shows "the Data Archives from the Known Servers Table on the PI Vision web server". [S:ops2-pb-migration-workbook] (read)
- "Since version 2020 (3.5.0.0) PI Vision no longer relies on PI Web API." [S:ops2-pb-migration-workbook] (read)
- From PI Vision 2020, a clean install's setup kit "will create a self-signed certificate, and apply it to the target IIS web site where PI Vision is being installed". On upgrade, the existing site certificate is reused. [S:ops2-feedback-pivision-1495] (read)
- "PI Vision and PI Web API must both have a third-party certificate or a domain certificate" (security blog recommendation). [S:ops2-pisquare-vision-security-blog] (read)
- Basic authentication for mobile users needs SSL: select "Require SSL" in IIS SSL Settings. [S:ops2-pisquare-vision-security-blog] (read)
- IIS Windows Authentication providers default to Negotiate and NTLM, which the blog calls "the recommended option". Use "Negotiate:Kerberos" only if you do not want a silent fallback to NTLM. [S:ops2-pisquare-vision-security-blog] (read)
- If PI Vision runs under a domain service account rather than Network Service, set `useAppPoolCredentials` to True. [S:ops2-pisquare-vision-security-blog] (read)
- The PI Vision account must map to a PI Identity with Read access to the PIDBSEC, PIMAPPING, PIPOINT and PIUSER database tables, and Read access to the PI points it uses. [S:ops2-pisquare-vision-security-blog] (read)
- CorsOrigins should list the PI Vision server host and domain URLs, "not just the asterisk". [S:ops2-pisquare-vision-security-blog] (read)
- The 2025 architecture course workbook tells students to "Use IIS Manager or PowerShell to switch PI Vision Application Pools to run under gMSA". [S:ops2-arch-workbook-2025] (read)
- That course's chapter 8 is titled: 8.3 Addresses, Application Pools, Services and Local Groups; 8.4 Hardware and Software Requirements; 8.5 Kerberos Delegation; 8.6 IIS Application Server preparation; 8.7 Installation; 8.8 Configuration. Only the headings were readable. [S:ops2-arch-workbook-2025] (read)
- PI Vision 2024 adds enhanced folder and display permissions [S:ops2-aw25-vision-2024] (read):
  - users can edit folder-level permissions
  - setting inheritance on a parent folder applies access to child folders
  - a folder can be moved with all its displays
- PI Vision 2024 admin enhancements include "viewing connected users and data access times for all open displays". [S:ops2-aw25-vision-2024] (read)
- Earlier releases added [S:ops2-uc22-vision-dutta] (read):
  - offline display management through the PI Vision Display Utility ("promote displays across disconnected environments")
  - usage reports: display usage, "User access within time range", user count by license type
- PI Vision 2022 lets admins set default symbol and display configuration (trace colours, line styles, multi-state palettes, time-bar durations, background colours). [S:ops2-uc22-vision-dutta] (read)
- PI Vision licence types are Named User publisher ("full display manipulation capabilities") and Named User explorer ("view and interact with displays", no saving). [S:ops2-sw-schedule-pi-2026] (read)

**Terms**
- PIVisionServiceAppPool: the IIS application pool that runs the main PI Vision website. [S:ops2-pb-migration-workbook]
- PIVisionAdminAppPool: the IIS application pool that runs the PI Vision Admin site (`/PIVision/Admin`). [S:ops2-pb-migration-workbook]
- PI Vision Display Utility: a utility (own app pool, PIVisionUtilityAppPool) used to move displays between disconnected environments. [S:ops2-pb-migration-workbook] [S:ops2-uc22-vision-dutta]
- PI Vision Admins / PI Vision Users / PI Vision Utility Users: local Windows groups that control access to the admin site, main site and display utility. [S:ops2-pb-migration-workbook]
- Publisher / Explorer: PI Vision named-user licence types; Publishers can create and save displays, Explorers can view and interact. [S:ops2-sw-schedule-pi-2026]

**Worked-example material**
- Admin URL: `https://pivis01.corp.example/PIVision/Admin` → Overview → PI Vision Database → Manage Configuration → enter SQL instance and database name (e.g. `PIVision`). The installer account needs dbcreator and securityadmin (ALTER ANY LOGIN). [S:ops2-pb-migration-workbook] (database name is illustrative)
- Duplicate-rule fix from PI Square: remove `<add accessType="Allow" users="" roles="PI Vision Users" />` from `PIVision\web.config`, or the same rule at host/site level, then recycle PIVisionServiceAppPool. [S:ops2-pisquare-vision-404] (read)

**Common mistakes / pitfalls**
- **App pools left as Network Service.** Built-in Network Service cannot delegate to multiple AF servers; run the Admin, Service and Utility pools under a domain account or gMSA. [S:ops2-pisquare-vision-af-delegation] (read)
- **404 after upgrade.** After a 2017 → 2017 R2 upgrade, IIS Request Filtering with "Allow unlisted verbs" unchecked blocked HTTP verbs (404.6). A default install denies no verbs. [S:ops2-pisquare-vision-404] (read)
- **500.19 duplicate entry.** A "PI Vision Users" authorization rule defined at both site and application level causes 500.19 "Cannot add duplicate collection entry". [S:ops2-pisquare-vision-404] (read)
- **Wildcard CORS.** Using only `*` in CorsOrigins. [S:ops2-pisquare-vision-security-blog]

**Open questions**
- The official PI Vision 2023/2024 install guide (docs.aveva.com) was not readable. Current minimum Windows/SQL/.NET versions for PI Vision 2024 are not confirmed; the workbook's figures are from about 2020 (verify). [S:ops2-docs-vision-install-guide]
- The default SQL database name and the exact names of SQL logins and roles created for the app pool account were not read.
- Exact semantics of PI Vision display/folder permission levels (e.g. Read vs Read/Write per identity) were not read.

---

### ops2.vision-history: Coresight to Vision, release highlights, ProcessBook and WebParts retirement

**Facts**
- OSIsoft's web site states: "PI Coresight was renamed PI Vision in 2017". [S:ops2-osisoft-coresight-renamed] (read)
- PI Coresight was introduced in 2011 [S:ops2-rs2011-coresight] (read):
  - a June 2011 beta was planned, with "2H 2011 – Release"
  - it was a "New Product – does not replace any existing PI System product"
  - it was positioned for ad-hoc analysis and collaboration, alongside ProcessBook (process monitoring) and WebParts (SharePoint composite applications)
- Early Coresight clients used Silverlight: "Silverlight Available from PI Coresight server, no internet access". [S:ops2-rs2011-coresight] (read)
- A 2018 timeline slide lists releases 2016, 2016 R2, 2017, 2017 R2 and then "PI Vision 2019 (3.4)". It lists a "PI ProcessBook Migration Tool" under PI Vision 2019. [S:ops2-uc18-vision-coppock] (read)
- The PI Vision 2019 roadmap included "Streamlined security for XY plot and Events Table". [S:ops2-uc18-vision-coppock] (read)
- The migration tool covers Trend, Gauges, XY Plot, Multi-state, Shapes & Lines, Images, Display Links, VBA, SQC Charts, BatchView, Data Sets and Embedded OLE Objects. [S:ops2-uc18-vision-coppock] (read)
  - Conflict: that is the slide's list of ProcessBook items "covered", but the 2020 lab workbook says a display with VBA "is not supported in PI Vision". (verify)
- The PI ProcessBook to PI Vision Migration Utility is "a separate installation" from PI Vision and migrates "PI ProcessBook displays to native PI Vision displays". [S:ops2-pb-migration-workbook] (read)
- "In order to preserve links between PI ProcessBook displays, they must be migrated in the same operation." [S:ops2-pb-migration-workbook] (read)
- AVEVA's blog of 20 October 2021: "we are officially retiring PI ProcessBook as we transition to AVEVA PI Vision". It gave the reason that "the existing code base is outdated". [S:ops2-aveva-pb-retire-blog] (read)
- A third-party article says ProcessBook security updates were "scheduled to end in 2022" and "support for the platform will end entirely in December of 2024". [S:ops2-digitalrefining-pb] (read)
- An AVEVA World 2024 session abstract states "PI ProcessBook support is coming to an end in December". This is consistent with December 2024. [S:ops2-aw24-pb-migration-session] (read) [S:ops2-digitalrefining-pb] (inferred)
- A 2015 OSIsoft roadmap table showed PI WebParts and ProcessBook display viewers under "TODAY (2015)" and "Dashboards" in the "FUTURE (2016+)" column. [S:ops2-uc15-roadmap-hughes] (read)
- A 2022 feedback-portal post lists PI ProcessBook and PI WebParts among deprecated products "not being sold anymore". This is a user-written source. [S:ops2-feedback-picust-192] (read)
- PI Vision 2022 [S:ops2-uc22-vision-dutta] (read):
  - Event Frame visualisation: "Overlay attributes in Event Comparison Display trends" and zoom/pan in event trends
  - display theming
  - per-symbol units of measure
  - admin default symbol configuration
- The AVEVA World 2023 deck lists "Released: AVEVA PI Vision 2023" under the theme "Streamlined, secure access". [S:ops2-uc23-vision-swartzentruber] (read)
  - Items listed under that theme: "Claims-based authentication via OpenID Connect for AVEVA PI Vision end users", "Configure user access levels from AF identities" and "User log-out capability".
  - Per-release assignment is unclear in the extracted text (verify).
- PI Vision 2024 (the docs.aveva.com release-notes page was seen only in search [S:ops2-docs-vision-2024-relnotes]) [S:ops2-aw25-vision-2024] (read):
  - "includes 20+ new enhancements based on 2500+ votes from AVEVA PI System Feedback Portal"
  - display search and a list view
  - links to display folders
  - a time-series data symbol
  - multistate values in tables
  - editing multiple symbols at once
  - font and font-size changes
  - folder permission inheritance
- The 2024 Architecture course pairs PI Vision 2024 with version 3.10.0.0 (from research/adm.md, adm-arch-planning-workbook-2024). [S:ops2-arch-workbook-2025] (inferred)

**Terms**
- PI Coresight: OSIsoft's browser-based ad-hoc visualisation client released in 2011, renamed PI Vision in 2017. [S:ops2-rs2011-coresight] [S:ops2-osisoft-coresight-renamed]
- PI ProcessBook to PI Vision Migration Utility: a separately installed tool that analyses ProcessBook displays and migrates them to native PI Vision displays. [S:ops2-pb-migration-workbook]
- PI WebParts: OSIsoft web parts for building PI composite applications in Microsoft SharePoint; now deprecated. [S:ops2-rs2011-coresight] [S:ops2-feedback-picust-192]

**Worked-example material**
- Migration flow on the slide: "Select → Analyze → Migrate". Analysis results show issues (e.g. VBA) before migration. Options include "Persist folder structure from migrated items". [S:ops2-uc22-vision-dutta] [S:ops2-pb-migration-workbook] (read)

**Common mistakes / pitfalls**
- Migrating linked ProcessBook displays in separate runs breaks the display links. [S:ops2-pb-migration-workbook]
- Expecting VBA logic to carry over to PI Vision. [S:ops2-pb-migration-workbook]

**Open questions**
- Exact ProcessBook dates (end of sale, end of security patches, end of support "December 2024") come from a third-party article and an undated session abstract. No AVEVA lifecycle page was read (verify).
- No official PI WebParts end-of-support date was found (verify).
- The month in 2017 of the Coresight → Vision rename, and whether "PI Vision 2017" was version 3.2, are not confirmed.

---

### ops2.vision-extensibility: Custom symbols (sym-*.js)

**Facts**
- Extensibility file locations [S:ops2-gh-vision-ext-guide] (read):
  - symbol files: `INSTALLATION_FOLDER\Scripts\app\editor\symbols\ext`
  - icons: `...\symbols\ext\icons`
  - external libraries: `...\symbols\ext\libraries`
  - tool panes: `INSTALLATION_FOLDER\Scripts\app\editor\tools\ext`
- A typical full path seen in community material is `C:\Program Files\PIPC\PIVision\Scripts\app\editor\symbols\ext`. [S:ops2-gh-leniel-vision-ext] (read)
- The 2019 deck writes the same path as `%pihome64%PIVision\Scripts\App\editor\symbols\ext`. [S:ops2-us19-vision-ext-schmitz] (read)
- File naming [S:ops2-gh-vision-ext-guide] (read):
  - required: `sym-<Name>.js` (implementation) and `sym-<Name>-template.html` (presentation)
  - optional: `sym-<Name>-config.html` (configuration pane) and `sym-<Name>.css`
- Symbols register with `PV.symbolCatalog.register(def)`; tool panes with `PV.toolCatalog.register(def)`. [S:ops2-gh-vision-ext-guide] (read)
- Definition properties [S:ops2-gh-vision-ext-guide] (read):
  - `typeName`: required unique name
  - `displayName`
  - `datasourceBehavior`: None 0 / Single 1 / Multiple 2; None means a static symbol not shown in the selector
  - `iconUrl`
  - `getDefaultConfig`: property names start uppercase; available as `scope.config`
  - `configOptions`
  - `inject`
  - `visObjectType`: required
  - `supportsCollections`: default false
- The DataShape set in getDefaultConfig is one of `Value`, `Gauge`, `Trend`, `Table` or `TimeSeries`. [S:ops2-gh-vision-ext-guide] (read)
- Init and callbacks [S:ops2-gh-vision-ext-guide] (read):
  - init signature: `symbolVis.prototype.init = function (scope, element)`
  - callbacks: `onDataUpdate(data)`, `onResize(width, height)`, `onConfigChange(newConfig, oldConfig)`, `onDestroy`
- The guide says the framework has been "fully supported" since PI Vision 2019. [S:ops2-gh-vision-ext-guide] (read)
- The course README says PI Vision "version 3.0 and later" supports extensions built from HTML and JavaScript. [S:ops2-gh-vision-custom-symbols] (read)
- In PI Vision 2025, the older array-returning pattern for `configOptions` is "not supported". [S:ops2-gh-vision-ext-guide] (read)
- Debugging and minification [S:ops2-gh-vision-ext-guide] (read):
  - set `<compilation debug="true">` in web.config to disable bundling
  - JS in `ext` is always minified
  - to stop minification, add appSetting `DisableExtensibilityJSMinification` = `true`
  - your own `*.min.js` is used only when debug is off
- The 2019 deck example uses `datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Single`, `visObjectType: symbolVis` and `PV.ClientSettings.PIWebAPIUrl` for calls to PI Web API. [S:ops2-us19-vision-ext-schmitz] (read)

**Terms**
- Custom symbol: a PI Vision extension made of a `sym-<name>.js` definition plus HTML template, placed in the `ext` folder and registered with `PV.symbolCatalog.register`. [S:ops2-gh-vision-ext-guide]
- DataShape: the data format a symbol asks PI Vision for (Value, Gauge, Trend, Table, TimeSeries). [S:ops2-gh-vision-ext-guide]

**Worked-example material**
```js
(function (PV) {
  function symbolVis() { }
  PV.deriveVisualizationFromBase(symbolVis);
  var definition = {
    typeName: 'simplevalue',
    datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Single,
    visObjectType: symbolVis,
    getDefaultConfig: function () { return { DataShape: 'Value', Height: 150, Width: 150 }; }
  };
  symbolVis.prototype.init = function (scope, element) {
    this.onDataUpdate = function (data) { if (data) { scope.value = data.Value; } };
  };
  PV.symbolCatalog.register(definition);
})(window.PIVisualization);
```
This is assembled from properties named in the guide and deck (inferred). The `window.PIVisualization` wrapper is the common pattern but was not read verbatim (verify). [S:ops2-gh-vision-ext-guide] [S:ops2-us19-vision-ext-schmitz]

**Common mistakes / pitfalls**
- Modern JS syntax broken by the built-in minifier in production. [S:ops2-gh-vision-ext-guide]
- Editing `Views\Home\index.cshtml` to load libraries is an "unrecommended" route; use `ext\libraries`. [S:ops2-gh-leniel-vision-ext]
- A custom symbol calling PI Web API prompts for credentials when Kerberos delegation (SPN, delegation or service account settings) is wrong. [S:ops2-pisquare-webapi-custom-symbol-auth] (read)

**Open questions**
- Whether `ext` contents survive upgrades is not stated in the guide (verify).

---

### ops2.kerberos-tls: SPNs, delegation, PI Web API certificates, Data Archive transport security

**Facts**
- SPNs "relate an account to a service being offered on a server" and tell the KDC which ticket a client needs, e.g. "Ticket for http/pivis01 please." [S:ops2-uc23-security-biggins] (read)
- AVEVA's PI Vision checklist [S:ops2-uc23-security-biggins] (read):
  1. Create a custom service account.
  2. Run PI Vision as that account.
  3. Configure the site to use application-pool credentials.
  4. Create two SPNs: `setspn -U -S http/hostname domain\service-account` and `setspn -U -S http/fully-qualified-DNS-name domain\service-account`.
  5. Delegate to the PISERVER and AFSERVER services.
- A double hop needs delegation, for example [S:ops2-uc23-security-biggins] (read):
  - PI Vision with a remote client
  - PI OLEDB Enterprise with a PI SQL client
  - PI System Explorer with an AF linked table
- Troubleshooting commands [S:ops2-uc23-security-biggins] (read):
  - `setspn -l` and `setspn -q PIServer/<hostname>`
  - `Get-ADUser '<VisionServiceAcctName>' -Properties msDS-AllowedToDelegateTo,Displayname`
  - Kerberos logging: set `LogLevel` (REG_DWORD 1) under `HKLM\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters`, then run `klist purge`
- The OSIsoft PI Security Audit Tools build expected SPNs as `<serviceType>/<hostname>` and `<serviceType>/<fqdn>` (lower-case). [S:ops2-gh-security-audit-tools] (read)
  - Service types: `piserver` for the PI Network Manager service (pinetmgr), `afserver` for the AF service (afservice), and `http` for PI Coresight/PI Vision.
  - "Machine accounts don't need http SPN" (the tool checks `host` instead).
- The security blog says to use the `afserver` service type for AF and `PIServer` for Data Archive when configuring constrained delegation. [S:ops2-pisquare-vision-security-blog] (read)
- The blog's delegation advice [S:ops2-pisquare-vision-security-blog] (read):
  - "Use any authentication protocol" allows protocol transition
  - "Unconstrained Delegation is not recommended!"
  - keep clock drift under 5 minutes
- The OSIsoft workbook says "Constrained delegation is more secure because it limits delegation to a specified list of services" and "Without the SPN the client cannot receive the Service ticket and Kerberos delegation is not possible." It concludes "RBCD is highly recommended type of delegation". [S:ops2-pb-migration-workbook] (read)
- PI Web API authentication methods (CISA countermeasure page) [S:ops2-cisa-cm0143-webapi] (read):
  - methods: OpenID Connect/Bearer, Kerberos, Basic, Anonymous
  - "Bearer and Kerberos are mutually exclusive"
  - "Anonymous authentication disables all other types"
  - AVEVA recommends against Anonymous
- PI Web API listens by default on "port 443 for HTTPS traffic". The installer prompts for the SSL certificate, and the Admin Utility is the only supported place to change it. [S:ops2-cisa-cm0143-webapi] (read)
- Admin Utility-only settings: Telemetry, Configuration Store, Authentication Option, AIM Registration, Listen Port, Certificate, API Service, OMF Servers. Runtime settings are at `/piwebapi/system/configuration` or in PSE under `OSIsoft > PI Web API > <instance name>`. [S:ops2-cisa-cm0143-webapi] (read)
- "PI Web API has no HTTP option". Certificate choices include self-signed, Windows domain CA, Let's Encrypt or commercial. [S:ops2-uc17-secure-webapi] (read)
- PI Web API CSRF defence: GET is fine, but POST/PATCH/DELETE clients must send `X-Requested-With: XMLHttpRequest`. [S:ops2-uc17-secure-webapi] (read)
- Transport security for Data Archive arrived with PI Server 2015. A slide "Transport Security with PI Server 2015" lists NTLM with "RC4/MD5" and Active Directory (Kerberos) with "AES256/SHA1*". [S:ops2-uc15-roadmap-hughes] (read)
- TLS in PI Server 2023 [S:ops2-uc23-claims-auth-biggins] (read):
  - "Natively encrypts communication for all AVEVA PI System authentication methods (OIDC, Windows, PI Trust)"
  - "Optional feature for PI Server; Required if using OIDC authentication"
- Data Archive TLS certificate commands [S:ops2-uc23-claims-auth-biggins] (read):
  - the certificate is chosen at install
  - change it with `pidiag -tls -r <thumbprint>` (`--register`)
  - verify with `pidiag -tls -y` (`--verify`)
- AF Server TLS certificate [S:ops2-uc23-claims-auth-biggins] (read):
  - change it with `AFDiag /CT:<thumbprint>` (`/CertificateThumbprint:`)
  - it is stored as registry value `CERTIFICATETHUMBPRINT` under `HKLM\SYSTEM\CurrentControlSet\Services\AFService`
- Components on one server can share a certificate, which "need[s] to be trusted by all clients". Self-signed certificates are trusted only locally or where imported. [S:ops2-uc23-claims-auth-biggins] (read)
- AF SDK clients have a `preferOIDCAuth` setting in AFSDK.config with values Prompt, Never and Always. [S:ops2-uc23-claims-auth-biggins] (read)
- The UC23 security deck calls TLS "Optional feature; required for OIDC Authentication and AIM". [S:ops2-uc23-security-biggins] (read)
- Automatic TLS certificate rotation was listed "In development" in 2023. [S:ops2-uc23-pi-server-geneva] (read)
- A PI Vision server log message seen in the field: "client attempted TLS connection but PInetmgr does not have a certificate loaded". [S:ops2-pisquare-vision-collective] (read)
- Ports relevant to Kerberos from the Data Archive [S:ops2-uc23-security-biggins] (read):
  - TCP/UDP 135 to the DC (SPN registration)
  - TCP/UDP 88 to the KDC
  - TCP 5450 inbound (clients)
  - TCP 5457 (AF)

**Terms**
- SPN (Service Principal Name): an AD record linking a service class and host (e.g. `http/pivis01`) to the account the service runs under, needed for Kerberos tickets. [S:ops2-uc23-security-biggins]
- RBCD (resource-based constrained delegation): delegation configured on the back-end resource's account; OSIsoft's workbook calls it the "highly recommended" type for PI Vision. [S:ops2-pb-migration-workbook]
- Protocol transition: the "Use any authentication protocol" delegation option. [S:ops2-pisquare-vision-security-blog]

**Worked-example material**
```
setspn -U -S http/pivis01 CORP\svc-pivision
setspn -U -S http/pivis01.corp.example CORP\svc-pivision
setspn -q PIServer/pida01
setspn -q AFServer/piaf01
pidiag -tls -y
AFDiag /CT:3F2A...C9
```
The command forms are from [S:ops2-uc23-security-biggins] and [S:ops2-uc23-claims-auth-biggins]. The host names are illustrative, and the `AFServer/` class is from [S:ops2-gh-security-audit-tools].

**Common mistakes / pitfalls**
- Using unconstrained delegation. [S:ops2-pisquare-vision-security-blog]
- Clock drift over 5 minutes breaks Kerberos. [S:ops2-pisquare-vision-security-blog]
- Using Network Service for the PI Vision pools in multi-server setups. [S:ops2-pisquare-vision-af-delegation]
- Forgetting the FQDN SPN, so only one of the two names works. [S:ops2-uc23-security-biggins] (inferred)
- Turning on OIDC without trusted certificates on clients: there is "No popup if the certificate isn't present". [S:ops2-uc23-claims-auth-biggins]

**Open questions**
- The SPN class for PI Web API (expected `HTTP/<host>` under the PI Web API service account, same as any IIS/HTTP.sys service) is not confirmed in a readable AVEVA source (verify).
- No readable source states which TLS protocol version (e.g. TLS 1.2) the Data Archive uses or requires (verify).
- PI Server 2015 transport security uses Windows SSPI encryption (Kerberos AES / NTLM RC4), not TLS. This is inferred from the slide. [S:ops2-uc15-roadmap-hughes] (inferred)
- The registry or tuning setting that forces encrypted connections was not read.

---

### ops2.connect: AVEVA CONNECT, CONNECT data services, agents, Edge Data Store

**Facts**
- On 11 July 2024 AVEVA announced "The renaming of AVEVA Data Hub to CONNECT data services". [S:ops2-aveva-dh-to-cds-blog] (read)
- "CONNECT data services is the foundation of our industrial intelligence platform, CONNECT". It aggregates, stores, enriches, analyses and securely shares real-time industrial data in the cloud. [S:ops2-aveva-dh-to-cds-blog] (read)
- CONNECT was unveiled at Hannover Messe and reported on 23 April 2024 [S:ops2-arc-connect-launch] (read):
  - it is "an industrial intelligence platform"
  - it offers "native data services, visualization services, modeling and analytics capabilities"
  - it runs on Microsoft Azure
- In 2022, AVEVA said "OCS customers will have a migration path to AVEVA Data Hub". OCS is OSIsoft Cloud Services, the predecessor service. [S:ops2-uc22-carasso-odi] (read)
- The PI to Data Hub agent (2022) [S:ops2-uc22-carasso-odi] (read):
  - "Native Ingress to AVEVA Data Hub"
  - "Agent Runs On-Prem"
  - "Windows accounts authenticate against onPrem PI Server(s)"
  - transfers AF elements, AF attributes, PI Point references, constant values and excluded attributes, plus PI points
  - shows warnings and errors for transfers
  - deletions replicate only if you opt in
- It was named "PI to Data Hub 2.0" in 2022. [S:ops2-uc22-carasso-odi] (read)
- The current name is "PI to CONNECT Agent", which "enables the transfer of data from on-premises PI Server to CONNECT data services" (AVEVA licence schedule, June 2026). [S:ops2-sw-schedule-pi-2026] (read)
- AVEVA docs page title: "Transfer PI System data to CONNECT data services". [S:ops2-docs-pi-to-connect] (snippet)
- The PI to CONNECT Agent [S:ops2-pidi-service-description] (read):
  - reports tag usage for the Aggregate Tag licence model and can optionally send process data to CONNECT data services
  - "Each PI Server in the aggregate tag model requires that the PI to CONNECT Agent be installed and configured"
- The CONNECT to PI Agent writes data from CONNECT streams back to PI tags. [S:ops2-pidi-service-description] (read)
- The 2024 course uses a gMSA `SVC-PICON$` for the "PI to CONNECT Agent" service (from research/adm.md, adm-arch-planning-workbook-2024). [S:ops2-arch-workbook-2025] (inferred)
- In the Sequential Data Store [S:ops2-gh-adh-waveform-sample] (read):
  - "a namespace provides isolation within a Tenant"
  - "SdsTypes are the model that define SdsStreams"
  - "An SdsStream stores an ordered series of events"
  - an SdsStreamView maps data from one type to another
- The sample's endpoint is `https://uswe.datahub.connect.aveva.com`. Authentication uses a client-credentials client (tenant ID, client ID, secret). [S:ops2-gh-adh-waveform-sample] (read)
- Data Views "curate operational data for external consumption" [S:ops2-uc23-dataviews-coppock] (read):
  - they are defined at runtime
  - query parameters: time range, stored or interpolated data, interpolation interval, data format
  - outputs: JSON, CSV, Table and (new in 2023) Parquet
  - consumers include the "AVEVA Data Hub Power BI Connector" and the REST API
- Data Hub regions listed in 2023: West US (California), North Europe (Ireland), Australia East (New South Wales). [S:ops2-uc23-dataviews-coppock] (read)
- AVEVA Edge Data Store "is software for the Industrial Internet of Things (IIoT)" [S:ops2-eds-datasheet] (read):
  - runs on Linux or Windows, on small hardware such as gateways or Raspberry Pi
  - built-in OPC UA and Modbus TCP connectivity, plus AVEVA Adapters and OMF
  - REST API
  - "integrates natively with AVEVA PI Server and AVEVA Data Hub"
- "Edge Data Store is now globally available through the AVEVA Flex program." [S:ops2-eds-datasheet] (read)
- EDS listens on port 5590. `EdgeCmd` is a CLI whose queries "are translated to HTTP queries against REST API". [S:ops2-uc23-adapters-eds-lab] (read)
- Streams are read at `/api/v1/tenants/default/namespaces/default/streams/`. Egress endpoints can be PI System, EDS or Data Hub. [S:ops2-uc23-adapters-eds-lab] (read)
- The SDS sample README gives `http://localhost:5590` as the resource for a local EDS. [S:ops2-gh-adh-waveform-sample] (read)
- AVEVA PI Data Infrastructure "augments the on-premises PI System with cloud-enabled functionalities". Its core is AVEVA PI Server, Edge Data Store, CONNECT data services and connectivity (Adapters, Interfaces, Connectors). PI Vision, PI DataLink and PI Web API are also included. [S:ops2-pidi-service-description] (read)
- CONNECT updates of 2025 (blog, 9 Dec 2025) [S:ops2-aveva-connect-2025-updates] (read):
  - Databricks integration
  - AVEVA Asset Information Management integration in CONNECT visualization
  - "Experience visualizations"
  - asset and time context
  - an "Industrial AI Assistant (open preview)"

**Terms**
- CONNECT: AVEVA's cloud industrial intelligence platform (data services, visualisation, modelling and analytics) launched in 2024. [S:ops2-arc-connect-launch]
- CONNECT data services: the cloud time-series and asset data service of CONNECT, formerly AVEVA Data Hub (and before that OSIsoft Cloud Services). [S:ops2-aveva-dh-to-cds-blog] [S:ops2-uc22-carasso-odi]
- PI to CONNECT Agent: an on-premises agent that transfers PI points and AF data to CONNECT data services and reports tag usage; formerly the PI to Data Hub agent. [S:ops2-sw-schedule-pi-2026] [S:ops2-pidi-service-description]
- Data view: a runtime-defined, curated query over streams and assets that returns shaped data (JSON, CSV, Parquet) for analytics tools. [S:ops2-uc23-dataviews-coppock]
- Namespace: an isolated container of SDS types, streams and views inside a tenant. [S:ops2-gh-adh-waveform-sample]
- Edge Data Store (EDS): AVEVA's lightweight edge store with built-in adapters and a REST API on port 5590 that forwards to PI Server or CONNECT. [S:ops2-eds-datasheet] [S:ops2-uc23-adapters-eds-lab]

**Worked-example material**
- `GET http://localhost:5590/api/v1/tenants/default/namespaces/default/streams/` lists EDS streams. [S:ops2-uc23-adapters-eds-lab]
- Cloud resource: `https://uswe.datahub.connect.aveva.com` with tenant ID, namespace, client ID and secret in `appsettings.json`. [S:ops2-gh-adh-waveform-sample]

**Common mistakes / pitfalls**
- Assuming deletions in PI are mirrored automatically; replicating deletions is opt-in. [S:ops2-uc22-carasso-odi]

**Open questions**
- Current PI to CONNECT agent features (event frames are only a "preview" docs bundle, `pi-to-connect-agent-event-frames-preview`, seen in search) are not read (verify). [S:ops2-docs-pi-to-connect]
- Whether "AVEVA CONNECT" or just "CONNECT" is the official current brand name. AVEVA's own 2024–2025 text uses "CONNECT". [S:ops2-aveva-dh-to-cds-blog] (inferred)

---

### ops2.licensing: PI Server licence model and AVEVA Flex (official statements only)

**Facts**
- "AVEVA PI Server 2023 requires you to be on AVEVA™ Flex" (AVEVA World 2023 deck). [S:ops2-uc23-claims-auth-biggins] (read)
- AVEVA Flex is a subscription program that "spans any mix of cloud, hybrid, and on-premises solutions across AVEVA's comprehensive portfolio". [S:ops2-aveva-trade-in-2022] (read)
- On 10 October 2022 AVEVA announced a trade-in allowance credit for PI System customers moving "from a perpetual license to subscription". The credits "can be used to offset future charges". [S:ops2-aveva-trade-in-2022] (read)
- The PI System Software Schedule v1.5 (June 2026) licenses data collection "by node and data streams". Tags or modules count as data streams, and stream counts are not transferable between products. [S:ops2-sw-schedule-pi-2026] (read)
- Aggregate Tag tiers [S:ops2-sw-schedule-pi-2026] (read):
  - the customer commits to a minimum tag tier that can be spread across all PI Servers
  - overage is paid at a daily rate
  - reductions during the term are not allowed
- Capacity (Non-Reporting) tiers: the aggregate tag count "shall not exceed" the tier, and "Only fixed capacity tag licenses for PI Servers are allowed". [S:ops2-sw-schedule-pi-2026] (read)
- A PI Test Server [S:ops2-sw-schedule-pi-2026] (read):
  - matches the production tag count up to one million tags
  - has a ninety (90) day data retrieval limit
  - "Cannot be used in a production environment"
- "HA PI Servers are configured to form a collective with the primary PI Server", and members "cannot be separated to operate as independent PI Servers". [S:ops2-sw-schedule-pi-2026] (read)
- Interfaces and connectors [S:ops2-sw-schedule-pi-2026] (read):
  - a node is "a host computer, either physical or virtual"
  - the included failover deployment "only sends data if the primary interface or connector deployment fails"
  - each PI to PI connection is unidirectional, so two licences are needed for bidirectional transfer
- Named user [S:ops2-sw-schedule-pi-2026] (read):
  - "one person in the organization and their associated login account"
  - can be reassigned no sooner than 90 days after the last reassignment
- Backup copies may not be used for testing or training, "as a hot standby" or "as a caching server". [S:ops2-sw-schedule-pi-2026] (read)
- Both PI Data Infrastructure models (Aggregate Tag, Capacity Non-Reporting) are described in the PI System Software Schedule. [S:ops2-pidi-service-description] (read)
- Edge Data Store and PI Audit Reporter are sold "through the AVEVA Flex program" / "Flex subscription program". [S:ops2-eds-datasheet] [S:ops2-audit-reporter-datasheet] (read)

**Terms**
- AVEVA Flex: AVEVA's credit-based subscription program across cloud, hybrid and on-premises products. [S:ops2-aveva-trade-in-2022]
- Aggregate Tag model: a PI Server licence where a committed tag tier is shared across all PI Servers, with tag usage reported by the PI to CONNECT Agent. [S:ops2-sw-schedule-pi-2026] [S:ops2-pidi-service-description]
- PI Test Server: a non-production licence for testing or training with a 90-day data retrieval limit. [S:ops2-sw-schedule-pi-2026]

**Common mistakes / pitfalls**
- Using a backup or DR copy as a running hot standby without a licence. [S:ops2-sw-schedule-pi-2026]
- Assuming PI to PI is bidirectional on one licence. [S:ops2-sw-schedule-pi-2026]

**Open questions**
- Prices, credit conversion rates and tier sizes are not public in the sources read.
- Whether perpetual PI Server licences are still sold is not stated (verify).

---

### ops2.part11: 21 CFR Part 11 and PI System audit trails

**Facts**
- The Data Archive audit trail is controlled by the `EnableAudit` tuning parameter (in the `pi_gen,pitimeout` table). [S:ops2-osipi-blog-audit] (read)
  - Example piconfig: `@table pi_gen,pitimeout` / `@mode create,t` / `@istr name,value` / `EnableAudit,-1`.
  - Per a 2010 third-party blog, the value is a bit mask by subsystem database:

  | Database | Bit | Decimal |
  |---|---|---|
  | Point | 0 | 1 |
  | Digital State | 1 | 2 |
  | User | 5 | 32 |
  | Group | 6 | 64 |
  | Trust | 7 | 128 |
  | Snapshot | 28 | 268435456 |
  | Archive | 29 | 536870912 |
  | All | — | -1 |
- Users on the AVEVA feedback portal confirm "an admin could change this setting to 0 which would disable auditing" (`EnableAudit`). The idea "Track if auditing was turned off" (PIDA-I-452) was "Evaluating" as of 2026. [S:ops2-feedback-pida-452] (read)
- The archive subsystem audit file is `piarchssaudit.dat` in the PI `log` folder. Export it by:
  1. bracketing a copy with `piartool -systembackup start -subsystem piarchss` … `end`
  2. reading the copy with `pidiag -xa <file> -st <start> -et <end>`

  [S:ops2-osipi-blog-audit] (read)
- PI AuditViewer is "an application that aids in viewing computer-generated and time-stamped audit records" from "the PI Audit Databases". It "satisfies US FDA 21CFR part 11 regulation requirements for generating copies of audit records … in both human readable and electronic form". [S:ops2-techsupport-auditviewer] (read)
- The AF audit trail is turned on with `AFDiag.exe /EnableAuditTrail:True` (`/AT`). "The SQL Server Agent needs to be running prior to enabling the Audit Trail feature". You need the sysadmin role on the SQL instance hosting the AF database. [S:ops2-pisquare-af-audit-trail] (read)
- The new AF Audit Trail feature came with AF 2.6, with a viewer in PSE under "Tools > AF Audit Trail". Older audit data is not accessible with it. [S:ops2-pisquare-af-audit-trail] (read)
- In that AF-2012-era thread the answer was "SQL Server 2008 (or later) Enterprise edition is required". This is old guidance; current requirements are unverified. [S:ops2-pisquare-af-audit-trail] (read)
- AVEVA PI Audit Reporter (datasheet 2025-08) [S:ops2-audit-reporter-datasheet] (read):
  - "a web-based audit trail review and reporting tool"
  - ingests audit records "from PI Data Archive and PI Asset Framework servers" via remote agents
  - tracks change-control numbers
  - "supports compliance with standards such as 21 CFR Part 11, NERC CIP, and ISO"
- AVEVA World 2025 held a session on Life Sciences "enhancements to the Audit Trail functionality in the PI System" tied to GMP and 21 CFR Part 11. [S:ops2-aw25-audit-trail-session] (read)
- A 2022 feedback idea asks for "21 CFR Part 11 Electronic Signatures for manual data entry" in PI Vision, and for PI Manual Logger and PI Manual Logger Web. No AVEVA response is shown. [S:ops2-feedback-pivision-1621] (read)
- PI Manual Logger stores settings and data in SQL Server "before it gets sent to PI Data Archive". The 2015 versions were PI ML Web 2014/2014 R2 and PI ML Mobile 2012. [S:ops2-uc15-manual-logger] (read)

**Terms**
- EnableAudit: a Data Archive tuning parameter whose bit mask selects which subsystem databases write audit records. [S:ops2-osipi-blog-audit]
- PI Audit Database: per-subsystem audit files (e.g. `piarchssaudit.dat`) recording changes, read with `pidiag -xa` or PI AuditViewer. [S:ops2-osipi-blog-audit] [S:ops2-techsupport-auditviewer]
- AF Audit Trail: SQL-based change history for AF objects, enabled with `AFDiag /EnableAuditTrail:True` and viewed in PSE. [S:ops2-pisquare-af-audit-trail]
- PI Audit Reporter: AVEVA's web tool (2025) that consolidates Data Archive and AF audit records for review and compliance reporting. [S:ops2-audit-reporter-datasheet]

**Worked-example material**
```
@table pi_gen,pitimeout
@mode create,t
@istr name,value
EnableAudit,-1
```
```
piartool -systembackup start -subsystem piarchss
copy d:\pi\log\piarchssaudit.dat d:\pi\adm\archaudit_Copy.dat
piartool -systembackup end -subsystem piarchss
pidiag -xa d:\pi\adm\archaudit_Copy.dat -st "1-apr-2010" -et "2-apr-2010" >> ArchAudit.log
```
[S:ops2-osipi-blog-audit]

**Common mistakes / pitfalls**
- An administrator can disable auditing by setting EnableAudit to 0, and this change was not itself tracked (as of the feedback idea). [S:ops2-feedback-pida-452]
- Enabling the AF audit trail with SQL Server Agent stopped. [S:ops2-pisquare-af-audit-trail]
- Message logs are removed after about 30 days, so they are not an audit trail. [S:ops2-feedback-pida-452] (read, user comment)

**Open questions**
- AVEVA's own Part 11 statement for the core PI Server was not found. Only PI AuditViewer and PI Audit Reporter claims were read (verify).
- PI Manual Logger electronic signature support: no evidence found (verify; likely unsupported).
- The official Audit Database reference page was unreadable [S:ops2-docs-da-audit-database]. Whether the EnableAudit bit values above are current for PI Data Archive 2018 SP3 / 2023 / 2024 (verify). Also not confirmed: whether `piartool -audit` exists (no source found).
- The current SQL edition requirement for AF audit trail (it depends on SQL Change Data Capture, which Standard edition gained in SQL Server 2016 SP1; this is general SQL knowledge, not a PI source) (verify).

---

### ops2.sizing: official sizing material

**Facts**
- 2012 OSIsoft Data Archive basic sizing guidelines [S:ops2-rs2012-bryant-arch] (read):

  | | Minimum | Recommended |
  |---|---|---|
  | RAM | "15KB per PI Point" | "Enough to fit 2 full archives in RAM" |
  | Disk IO/s | "Rate of Archived Events/50" | "Rate of Archived Events/10 + Read Workload" |
  | Network | "100Mbps LAN" | "1-10Gbps LAN" |
  | CPU cores | "4 + Active Client Connections/5" | "4 + Active Client Connections/2" |
- The same deck compares PI Server 2012 with 2010 R3 [S:ops2-rs2012-bryant-arch] (read):

  | | PI Server 2012 | PI Server 2010 R3 |
  |---|---|---|
  | Max point count | 5M | 2M+ |
  | Max data-in rate | 500K ev/s | <100K ev/s |
  | Online archives | >10K files | 2–5K files |
  | Startup time | <2 minutes | >20 minutes |
- 2012 virtualization rules [S:ops2-rs2012-bryant-arch] (read):
  - "OSIsoft supports virtualization"
  - "Treat virtual machines as if they were physical machines"
  - "Do not mix virtual and physical on the same host"
  - "Test on the target platform"
- 2012 AF topology rule [S:ops2-rs2012-vining-arch] (read):
  - "Small" systems (<10,000 assets and <25,000 tags) can put "PI, AF, & SQL on one node"
  - larger systems need "Two nodes min" with "Separate PI and SQL"
- The 2025 course says "The MS SQL Express Edition is limited to using only a single physical CPU and 1 GB of RAM", and "AVEVA recommends that you install MS SQL Server on a different computer from PI Server." [S:ops2-arch-workbook-2025] (read)
- The 2019 PI World architecture deck has no hardware sizing numbers. [S:ops2-pw19-architecting-zhimanov] (read)

**Common mistakes / pitfalls**
- Sizing AF by object count rather than workload (see research/adm.md). Running AF SQL on Express in production, given Express's 1 GB RAM and single-CPU limit. [S:ops2-arch-workbook-2025] (inferred)

**Open questions**
- No readable PI Vision sizing (users per server, cores, RAM) or AF Server sizing table was found. docs.aveva.com topology pages (`pi-server-l-topologies`) appeared in search but were unreadable (verify).
- The "Hardware and PI System Sizing Recommendations" spreadsheet referenced elsewhere was not found.
