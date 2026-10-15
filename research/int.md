# Group int: Integration and developer technologies

**Summary.** 173 facts: 169 (read), 2 (snippet), 2 (inferred). Per id: webapi-basics 72, webapi-advanced 31, afsdk-dev 21, sql 10, integrator 3, scripting 12, adh-apis 24.
docs.aveva.com was not readable (JS shell), so PI Web API facts come mainly from the PI World 2020 lab PDF, AVEVA/OSIsoft GitHub samples, and the swagger-generated PI Developers Club client (PI Web API 2018 spec). A shared web-search budget ran out partway through, so the later ids are thin.
**Biggest gaps:** (1) int.integrator is almost empty: views, targets and editions are unsourced. (2) int.sql has no SQL text and no catalog or table names (picomp2/piinterp2, RTQP Master.Element.*). (3) int.afsdk-dev has no source for PIServer.FindPIPoint, PIPoint.RecordedValues, PIPointList/PIPagingConfiguration, PIDataPipe or the AFSearch token syntax. (4) PIconnect (Python) is unsourced. (5) PI Web API version history for 2019 SP1, 2021 and 2023, summaryType values, updateOption/bufferOption values, and the channel and stream-updates message JSON are not read.

### int.webapi-basics: PI Web API fundamentals (controllers, URLs, WebIDs, JSON, auth, CSRF/CORS, versions)

**Facts**
- PI Web API is a RESTful, stateless, resource-oriented service whose resources are navigable through `Links`; the root (home) URL takes the form `https://<server>/piwebapi` and the built-in help is at `https://<server>/piwebapi/help`. [S:int-piworld2020-webapi-lab] (read)
- The root (Home) response `Links` include Self, AssetServers, DataServers, Omf, Search and System. [S:int-piworld2020-webapi-lab] (read)
- The System controller exposes UserInfo and Status endpoints (in addition to the System landing resource). [S:int-piworld2020-webapi-lab] (read)
- PI Web API is built on top of AF SDK (.NET, Windows-only); it exposes a subset of AF SDK functionality and cannot outperform AF SDK, but it can be used from any platform that can make HTTP requests. [S:int-piworld2020-webapi-lab] (read)
- Controllers used in the PI World 2020 lab include Attribute, AssetServer, AssetDatabase, Batch, DataServer, Element, EventFrame, Point, Stream and StreamSet. [S:int-piworld2020-webapi-lab] (read)
- The 2018 Swagger specification of PI Web API also contains an Analyses controller (`GET /analyses`, `GET /analyses/search`, `GET|PATCH|DELETE /analyses/{webId}`, `/analyses/{webId}/categories`, `/analyses/{webId}/security`), plus `/points/search`, `/elements/search`, `/elementtemplates`, `/eventframes`, `/security` and `/securityIdentities`. [S:int-jentic-piwebapi-2018sp1] (read)
- A PI point is located by path with `GET /piwebapi/points?path=\\<DataArchive>\<tag>` and an AF element by `GET /piwebapi/elements?path=\\<AFServer>\<Database>\<Element>`; both responses contain the object's WebId. [S:int-uc19-edpr-webapi] (read)
- An AF attribute is located by path with `GET /attributes?path=\\<AFServer>\<Database>\<Element>|<Attribute>` (the pipe `|` separates the element path from the attribute name). [S:int-gh-batch-call-py] (read)
- Asset servers, databases and element templates can be located by path: `GET /assetservers?path=\\<AFServer>`, `GET /assetdatabases?path=\\<AFServer>\<Database>`, `GET /elementtemplates?path=\\<AFServer>\<Database>\ElementTemplates[<TemplateName>]`, and element categories with `GET /elementcategories?path=\\<AFServer>\<Database>\CategoriesElement[<CategoryName>]`. [S:int-gh-create-sandbox-py] (read)
- HTTP verbs map to operations: GET reads, POST creates, PUT does a full update, PATCH does a partial update, and DELETE deletes. [S:int-piworld2020-webapi-lab] (read)
- Creating an AF database is `POST {assetserver Links.Self}/assetdatabases` with body keys `Name`, `Description`, `ExtendedProperties`, and the sample checks for HTTP 201 (Created). [S:int-gh-create-sandbox-py] (read)
- Deleting an element, element template, element category or asset database with DELETE returns HTTP 204 (No Content) in the AVEVA Python sample. [S:int-gh-create-sandbox-py] (read)
- Element templates are created with `POST {database}/elementtemplates` (body keys `Name`, `Description`, `CategoryNames`, `AllowElementToExtend`) and attribute templates with `POST {template}/attributetemplates` (body keys `Name`, `Type`, `IsConfigurationItem`, `Description`, `DataReferencePlugIn`, `ConfigString`). [S:int-gh-create-sandbox-py] (read)
- In the AVEVA Python sample, a PI Point data-reference attribute template uses `DataReferencePlugIn: "PI Point"` and a config string such as `\\<pi_server>\%Element%_OSIPythonSampleTag;ReadOnly=False;ptclassname=classic;pointtype=Float64;pointsource=webapi`, and `POST /elements/{webId}/config` (body `includeChildElements: true`) creates the referenced tags. [S:int-gh-create-sandbox-py] (read)
- Stream controller endpoints (2018 swagger): `GET /streams/{webId}/value`, `GET /streams/{webId}/end`, `GET /streams/{webId}/recorded`, `POST /streams/{webId}/recorded` (UpdateValues), `GET /streams/{webId}/recordedattime`, `GET /streams/{webId}/recordedattimes`, `GET /streams/{webId}/interpolated`, `GET /streams/{webId}/interpolatedattimes`, `GET /streams/{webId}/plot`, `GET /streams/{webId}/summary`, `POST /streams/{webId}/value` (UpdateValue), `GET /streams/{webId}/channel`, `POST /streams/{webId}/updates`, `GET /streams/updates/{marker}`. [S:int-gh-pyclient-stream-api] (read)
- `GET /streams/{webId}/recorded` accepts the query parameters startTime, endTime, maxCount, boundaryType, filterExpression, includeFilteredValues, selectedFields, timeZone, desiredUnits and associations. [S:int-gh-pyclient-stream-api] (read)
- `GET /streams/{webId}/interpolated` accepts startTime, endTime, interval, syncTime, syncTimeBoundaryType, filterExpression, includeFilteredValues, selectedFields, timeZone and desiredUnits. [S:int-gh-pyclient-stream-api] (read)
- `GET /streams/{webId}/plot` accepts startTime, endTime, intervals, selectedFields, timeZone and desiredUnits. [S:int-gh-pyclient-stream-api] (read)
- `GET /streams/{webId}/summary` accepts summaryType (multi-valued: repeat the parameter), calculationBasis, timeType, summaryDuration, sampleType, sampleInterval, filterExpression, startTime, endTime, selectedFields and timeZone. [S:int-gh-pyclient-stream-api] (read)
- `POST /streams/{webId}/value` and `POST /streams/{webId}/recorded` accept the query parameters updateOption and bufferOption. [S:int-gh-pyclient-stream-api] (read)
- `recordedattimes` and `interpolatedattimes` take a repeated `time` parameter (one per timestamp). [S:int-gh-pyclient-stream-api] (read)
- The maxCount parameter of recorded-value calls defaults to 1000. [S:int-piworld2020-webapi-lab] (read)
- PI time expressions such as `*-2d`, `*-1d`, `*` and intervals such as `1h` are accepted, e.g. `?startTime=*-1d&endTime=*&interval=1h`. [S:int-piworld2020-webapi-lab] (read)
- A filter expression can be applied to recorded data, e.g. `&filterExpression='.'>75` (the `'.'` refers to the stream's own value). [S:int-piworld2020-webapi-lab] (read)
- StreamSet endpoints exist in two forms: by parent WebId (`/streamsets/{webId}/value`, `/recorded`, `/interpolated`, `/plot`, `/summary`, `/end`, `/channel`, ...) which return values for all attributes of an element, and "ad hoc" forms (`/streamsets/value?webId=...&webId=...`, `/streamsets/recorded?webId=...`) where webId is a repeated query parameter. [S:int-gh-pyclient-streamset-api] (read)
- StreamSet-by-element calls accept attribute filter parameters nameFilter, categoryName, templateName, searchFullHierarchy, showExcluded, showHidden, sortField and sortOrder. [S:int-gh-pyclient-streamset-api] (read)
- `/streamsets/{webId}/value` returns one current value per attribute of an element; `/streamsets/{webId}/recorded?starttime=*-1h&endtime=*-30m` returns archive values for all attributes over a window. [S:int-uc19-edpr-webapi] (read)
- `selectedFields` limits the response to listed fields using semicolon-separated dotted paths, e.g. `selectedFields=Items.Timestamp;Items.Value` or `selectedFields=Items.Name;Items.WebId`. [S:int-piworld2020-webapi-lab] (read)
- A time-series response wraps values in `Items` and also contains `Links` and `UnitsAbbreviation`; each item has `Timestamp`, `Value`, `UnitsAbbreviation`, `Good`, `Questionable`, `Substituted` and `Annotated`. [S:int-piworld2020-webapi-lab] (read)
- The PITimedValue model has JSON properties Timestamp (string), UnitsAbbreviation, Good, Questionable, Substituted, Annotated (booleans), Value (object), Errors and WebException. [S:int-gh-pyclient-timedvalue] (read)
- The PIStreamValues model (a stream's values in a streamset response) has WebId, Name, Path, Items (list of timed values), UnitsAbbreviation, Links and WebException. [S:int-gh-pyclient-streamvalues] (read)
- A summary result item (PISummaryValue) has `Type` (the summary type name) and `Value` (a timed value). [S:int-gh-pyclient-summaryvalue] (read)
- Timestamps in PI Web API responses are ISO 8601 strings with a `Z` (UTC) suffix in the lab examples. [S:int-piworld2020-webapi-lab] (read)
- Digital-state values are returned as an object, e.g. `"Value": {"Name": "Run", "Value": 3}`, so a client must read the `Name` property to get the state text. [S:int-pisquare-afvalue-run] (read)
- System digital states can be written by POSTing `{"Value": {"Name": "Comm Fail", "Value": 313, "IsSystem": true}}` to `/streams/{webId}/value`; PI Web API 1.2 (2014) rejected this and writing system digital states was explicitly allowed by 1.4 (2015). [S:int-pisquare-query-examples] (read)
- A value write body has the form `{"Timestamp": "...", "Value": 42.0}`; if Timestamp is omitted the server uses the current time. [S:int-pisquare-query-examples] (read for body; "omitted -> now" is inferred) 
- Validation errors are returned as JSON `{"Errors": ["Parameter 'Value' is required.", "Unsupported value type."]}`. [S:int-pisquare-query-examples] (read)
- The PIWebException model contains `StatusCode` (int) and `Errors` (list of strings); it appears as a `WebException` property on objects returned within batch/bulk responses. [S:int-gh-pyclient-webexception] (read)
- The PIPoint JSON object has WebId, Id (int), Name, Path, Descriptor, PointClass, PointType, DigitalSetName, Span, Zero, EngineeringUnits, Step, Future, DisplayDigits and Links. [S:int-gh-pyclient-point] (read)
- The PIElement JSON object has WebId, Id (GUID string), Name, Description, Path, TemplateName, HasChildren, CategoryNames, ExtendedProperties and Links. [S:int-gh-pyclient-element] (read)
- The PIAttribute JSON object has WebId, Id, Name, Description, Path, Type, TypeQualifier, DefaultUnitsName, DisplayDigits, DataReferencePlugIn, ConfigString, IsConfigurationItem, IsExcluded, IsHidden, IsManualDataEntry, HasChildren, CategoryNames, Step, TraitName, DefaultUnitsNameAbbreviation, Span, Zero and Links. [S:int-gh-pyclient-attribute] (read)
- WebID 2.0 was introduced in PI Web API 2017 R2; WebID 1.0 was opaque, while WebID 2.0 follows an open specification so clients can build WebIDs themselves. [S:int-piworld2020-webapi-lab] (read)
- WebIDs are persistent and can be stored by client applications. [S:int-piworld2020-webapi-lab] (read)
- WebID 2.0 types: Full (encodes IDs and path; longest; most resilient), IDOnly (object IDs only; survives moves/renames, invalid after delete), PathOnly (path only; breaks on rename; always points to whatever is at that path), LocalIDOnly and DefaultIDOnly (not persistent/unique, not compatible with load balancers). [S:int-piworld2020-webapi-lab] (read)
- The WebID type is chosen with the `webIdType` query parameter, e.g. `?webIdType=PathOnly`. [S:int-piworld2020-webapi-lab] (read)
- WebID 2.0 layout: character 1 = type letter (F=Full, I=IDOnly, P=PathOnly, L=LocalIDOnly, D=DefaultIDOnly), character 2 = version (`1`), characters 3-4 = object-type marker, then an optional one-character owner marker, then Base64url-encoded IDs and/or path. [S:int-gh-java-webidinfo] (read)
- WebID object markers: DP = PI Point, DS = PI Data Server, RS = AF (asset) server, RD = asset database, Em = element, EC = element category, ET = element template, Ab = attribute, AC = attribute category, AT = attribute template, Fm = event frame, MS = enumeration set, MV = enumeration value, Bl = table, BC = table category, Ut = unit, UC = unit class, Xs = analysis, XC = analysis category, XT = analysis template, XR = analysis rule, XP = analysis rule plug-in, TR = time rule, TP = time rule plug-in, SI = security identity, SM = security mapping. [S:int-gh-pydevclub-webid-helper] (read)
- WebID owner markers: R = asset server, D = data server, X = analysis, T = analysis template, E = element (or element template), F = event frame; owner markers are used for attributes (Ab), attribute templates (AT), enumeration sets/values, analysis rules and time rules. [S:int-gh-pydevclub-webid-helper] (read)
- In WebID 2.0, GUIDs are encoded as 22 URL-safe Base64 characters (with `-` and `_` replacing `+` and `/`, no `=` padding); a PI Point ID is encoded as 6 Base64 characters (a 4-byte little-endian integer) in place of an object GUID. [S:int-gh-java-webidinfo] (read)
- A PathOnly WebID is `P1` + marker + owner marker + Base64url(UTF-8(UPPERCASE path without the leading `\\`)). [S:int-gh-pydevclub-webid-helper] (read)
- Example Full WebID returned for asset server "PISRV01": `F1RSiOPKGTTUcUCFkVGxiCya9gUElTUlYwMQ` (F1 + RS marker + 22-char server GUID + Base64 of "PISRV01"). [S:int-piworld2020-webapi-lab] (read; decomposition inferred from int-gh-java-webidinfo)
- PI Web API 1.x-era point WebIDs looked different (e.g. beginning `P0...`), and 2.0 Full point WebIDs begin `F1DP`. [S:int-pisquare-query-examples] (inferred)
- Authentication schemes carried in the Authorization header: Basic, Negotiate (Kerberos) and Bearer. [S:int-piworld2020-webapi-lab] (read)
- Authentication options listed by OSIsoft: Anonymous, Basic, Kerberos, and claims-based authentication using OpenID Connect (an authentication layer on top of OAuth 2.0). [S:int-uc17-secure-webapi] (read)
- Bearer (OpenID Connect) and Kerberos cannot be enabled together on PI Web API; Basic can be combined with either. [S:int-cisa-cm0143] (read)
- Anonymous authentication is advised against by AVEVA. [S:int-cisa-cm0143] (read)
- PI Web API has no plain-HTTP option; it requires HTTPS with a certificate, and the default listen port is 443. [S:int-uc17-secure-webapi] (read) [S:int-cisa-cm0143] (read)
- The PI Web API Admin Utility manages Telemetry, Configuration Store, Authentication, AIM Registration, Listen Port, Certificate, API Service and OMF Servers settings. [S:int-cisa-cm0143] (read)
- Runtime settings live in an AF configuration element (PI System Explorer: `Elements > OSIsoft > PI Web API > <Configuration Instance Name>`) and can be read through `/piwebapi/system/configuration`. [S:int-cisa-cm0143] (read)
- CSRF defense: POST, PUT, PATCH and DELETE requests must carry an `X-Requested-With` header (any value works; samples use `XmlHttpRequest`); GET requests are not affected. [S:int-piworld2020-webapi-lab] (read) [S:int-uc17-secure-webapi] (read)
- CORS is configured with configuration attributes CorsOrigins, CorsMethods, CorsHeaders, CorsExposedHeaders and CorsSupportsCredentials; the AVEVA Angular sample uses CorsOrigins=`http://localhost:9876`, CorsHeaders=`*`, CorsMethods=`*`, CorsExposedHeaders=`Allow,Content-Encoding,Content-Length,Date,Location`, CorsSupportsCredentials=True. [S:int-gh-angular-sample] (read)
- `DisableWrites` (Boolean) in the configuration element makes PI Web API read-only. [S:int-uc17-secure-webapi] (read) [S:int-gh-angular-sample] (read)
- Denial-of-service related configuration attributes include RateLimitMaxRequests, RateLimitDuration and MaxReturnedItemsPerCall. [S:int-uc17-secure-webapi] (read)
- Sending `Cache-Control: no-cache` bypasses PI Web API's AF cache; the default AF cache refresh is 5 minutes; time-series data are never cached. [S:int-piworld2020-webapi-lab] (read)
- Request bodies use `Content-Type: application/json`, and responses carry `Content-Type: application/json; charset=utf-8`. [S:int-piworld2020-webapi-lab] (read)
- Traditional child queries use filters such as `GET /assetdatabases/{webId}/elements?nameFilter=*b*&templateFilter=PumpTemplate&searchFullHierarchy=true`. [S:int-piworld2020-webapi-lab] (read; note the lab misspells searchFullHierarchy)
- AFSearch-style query methods (e.g. `GET /elements/search?databaseWebId={webId}&query=Name:=*b* AND Template:=PumpTemplate`) were introduced in PI Web API 2017 R2. [S:int-piworld2020-webapi-lab] (read)
- Version timeline items: PI Web API 1.2 (2014), 1.4 (2015), 2017 R2 (WebID 2.0, AFSearch queries), 2018 SP1 (Stream Updates CTP, improved StreamSets performance), 2019 (OMF endpoint added). [S:int-pisquare-query-examples] (read) [S:int-piworld2020-webapi-lab] (read) [S:int-dev-tech-overview] (read)
- OpenID Connect is supported by PI Web API, PI Vision, AF and the Data Archive in the AVEVA PI Server 2023 era; registration with AVEVA Identity Manager (AIM) is done for PI Web API through its Admin Utility. [S:int-uc23-claims-auth] (read)
- AVEVA Identity Manager (AIM) runs as a Windows service, is part of Platform Common Services, uses Windows AD by default and can federate one more IdP (AVEVA Connect, recommended, or Azure AD). [S:int-uc23-claims-auth] (read)
- The OIDC discovery document is retrieved from `/.well-known/openid-configuration`. [S:int-uc17-secure-webapi] (read)
- AVEVA's reference docs contain per-version "detailed changes" pages for 2019 SP1, 2021 SP1 and 2023 SP1. [S:int-docs-webapi-changes-2019sp1] (snippet) [S:int-docs-webapi-changes-2021sp1] (snippet) [S:int-docs-webapi-changes-2023sp1] (snippet)

**Terms**
- WebID: a persistent, URL-safe identifier PI Web API uses to address an object (point, element, attribute, ...) in URLs. [S:int-piworld2020-webapi-lab]
- WebID 2.0: the open WebID format introduced in PI Web API 2017 R2 that clients can generate and decode. [S:int-piworld2020-webapi-lab]
- PathOnly WebID: a WebID that encodes only the object's path, so it can be built client-side without a lookup. [S:int-piworld2020-webapi-lab]
- Stream: in PI Web API, the time series of a PI point or an AF attribute, addressed via `/streams/{webId}`. [S:int-gh-pyclient-stream-api]
- StreamSet: a set of streams (all attributes of an element, or an ad hoc list of WebIds) read or written in one call. [S:int-gh-pyclient-streamset-api]
- selectedFields: query parameter that trims a response to the listed fields. [S:int-piworld2020-webapi-lab]
- Links: object in each PI Web API response containing URLs to related resources. [S:int-piworld2020-webapi-lab]
- CSRF defense (PI Web API): the requirement that write requests carry an X-Requested-With header. [S:int-uc17-secure-webapi]
- CORS: browser mechanism configured in PI Web API (CorsOrigins etc.) to let web pages on another origin call it. [S:int-uc17-secure-webapi]
- PI Web API Admin Utility: the configuration tool for PI Web API installation-level settings. [S:int-cisa-cm0143]
- AVEVA Identity Manager (AIM): AVEVA's OpenID Connect identity provider service used for claims-based auth in the PI System. [S:int-uc23-claims-auth]

**Worked-example material**
- Read the last 10 recorded values with only timestamp and value:
  `GET https://pisrv01/piwebapi/streams/{webId}/recorded?maxCount=10&selectedFields=Items.Timestamp;Items.Value` [S:int-gh-batch-call-py]
- Interpolated hourly values for the last day: `GET .../streams/{webId}/interpolated?startTime=*-1d&endTime=*&interval=1h` [S:int-piworld2020-webapi-lab]
- Summary: `GET .../streams/{webId}/summary?startTime=*-1d&endTime=*&summaryType=Average` [S:int-piworld2020-webapi-lab]
- Lab paths: element `\\PISRV01\NuGreen\NuGreen\Houston\Cracking Process\Equipment\B-210`; attribute `\\PISRV01\NuGreen\NuGreen\Tucson\Distilling Process\Equipment\P-871|Process Feedrate`; tags `CDT158`, `sinusoid`, `sinusoidu`. [S:int-piworld2020-webapi-lab]
- Recorded response shape (structure per the lab and the swagger models; values illustrative):
```json
{
  "Links": {},
  "Items": [
    {"Timestamp": "2020-03-01T10:00:00Z", "Value": 74.6, "UnitsAbbreviation": "", "Good": true,
     "Questionable": false, "Substituted": false, "Annotated": false}
  ],
  "UnitsAbbreviation": ""
}
```
- Digital value item: `{"Timestamp": "...Z", "Value": {"Name": "Run", "Value": 3}, "Good": true, ...}` [S:int-pisquare-afvalue-run]
- Error response: `{"Errors": ["Parameter 'Value' is required.", "Unsupported value type."]}` [S:int-pisquare-query-examples]
- Write a value: `POST .../streams/{webId}/value` with `X-Requested-With: XMLHttpRequest`, body `{"Timestamp": "2015-05-25T07:00:00Z", "Value": 42.0}` [S:int-pisquare-query-examples]
- Decoding a WebID: `F1RSiOPKGTTUcUCFkVGxiCya9gUElTUlYwMQ` -> type F (Full), version 1, marker RS (asset server), 22-char server GUID `iOPKGTTUcUCFkVGxiCya9g`, path Base64 `UElTUlYwMQ` = "PISRV01". [S:int-piworld2020-webapi-lab] [S:int-gh-java-webidinfo]
- Python requests auth used in AVEVA's sample: `HTTPBasicAuth(user, pwd)` or `HTTPKerberosAuth(mutual_authentication='REQUIRED', sanitize_mutual_error_response=False)`. [S:int-gh-batch-call-py]

**Common mistakes / pitfalls**
- Forgetting `X-Requested-With` on POST/PUT/PATCH/DELETE causes write requests to be rejected by CSRF defense. [S:int-uc17-secure-webapi] (read; exact status code not confirmed)
- Treating digital values as numbers: PI Web API returns digital states as `{Name, Value}` objects; reading `Value.Value` gives the state code, not the text. [S:int-pisquare-afvalue-run]
- Calling `/recorded` without a time range returns the default range (recent values), not the value at a specific past time; use `/recordedattime?time=...` for that. [S:int-pisquare-afvalue-run]
- AF metadata changes made in PI System Explorer may not show in PI Web API until the cache refreshes (default 5 minutes) unless `Cache-Control: no-cache` is sent. [S:int-piworld2020-webapi-lab]
- Invalid JSON (e.g. trailing commas) in POST bodies; the PI Square example itself contains one. [S:int-pisquare-query-examples]
- PathOnly WebIDs break when an object is renamed; IDOnly WebIDs become invalid when the object is deleted. [S:int-piworld2020-webapi-lab]
- Kerberos and Bearer cannot be combined; plan authentication accordingly. [S:int-cisa-cm0143]
- Postman cannot do Kerberos (Negotiate) in the lab environment, which is why the lab uses Basic. [S:int-piworld2020-webapi-lab]

**Open questions**
- Exact default time range of `/streams/{webId}/recorded` when startTime/endTime are omitted (commonly `*-1d` to `*`): not read in a source.
- Full list and exact spelling of summaryType values (Total, Average, Minimum, Maximum, Range, StdDev, PopulationStdDev, Count, PercentGood, All, AllForNonNumeric, TotalWithUOM...) seen only as search-term hits on docs.aveva.com summary-type page; not read.
- Exact HTTP status returned when CSRF header missing; exact status for Basic auth failure (401 expected).
- Exact numeric version numbers (e.g. 1.13 for 2019 SP1) and per-release feature lists for 2019 SP1, 2021, 2021 SP1-SP3, 2023, 2023 SP1: changelog pages exist but were not readable.
- Exact version where Bearer/OpenID Connect became generally available in PI Web API (2021 vs 2023) not confirmed in a readable source.
- updateOption values (Replace, Insert, NoReplace, ReplaceOnly, InsertNoCompression, Remove) and bufferOption values (DoNotBuffer, BufferIfPossible, Buffer) not read in source.
- Configuration attribute names for authentication (e.g. `AuthenticationMethods`) not read.

### int.webapi-advanced: Indexed Search, channels, stream updates, batch, OMF endpoint

**Facts**
- The Search controller provides indexed search, e.g. `GET {baseURL}/search/query?q=name:*b* AND afelementtemplate=PumpTemplate AND scope=MyAFDatabase`. [S:int-piworld2020-webapi-lab] (read)
- Indexed Search requires AF databases to be crawled by the PI Web API Search Crawler, a separate service that builds index files; Indexed Search and the Crawler are optional features. [S:int-piworld2020-webapi-lab] (read)
- PI Vision 2020 no longer uses the PI Web API crawler (AVEVA admin statement, Aug 2022, declining an idea to add crawl checkpoints). [S:int-feedback-pidevtech-118] (read)
- The same AVEVA feedback page does not state that Indexed Search is removed from PI Web API; community comments note that custom applications still use the Search controller. [S:int-feedback-pidevtech-118] (read)
- AFSearch-based query methods (e.g. Element GetElementsQuery `GET /elements/search?databaseWebId=...&query=...`, Attribute GetAttributesQuery, EventFrame GetEventFramesQuery, plus Query methods for Analyses, Analysis Templates, Notification Rules, Notification Rule Templates and Notification Contact Templates) are an alternative to indexed search that needs no crawler. [S:int-piworld2020-webapi-lab] (read)
- OSIsoft lists the AFSearch benefits as better performance, less filtering in PI Web API and better caching on PI Web API and the AF Server. [S:int-piworld2020-webapi-lab] (read)
- Channels use the WebSocket protocol: a persistent connection over which the server pushes messages; secure channel URLs start with `wss://` instead of `https://`. [S:int-piworld2020-webapi-lab] (read)
- Channel endpoints: `GET /streams/{webId}/channel`, `GET /streamsets/{webId}/channel` (all attributes of an element) and `GET /streamsets/channel?webId=...&webId=...` (ad hoc). [S:int-gh-pyclient-stream-api] (read) [S:int-gh-pyclient-streamset-api] (read)
- Channel query parameters are includeInitialValues (default false) and heartbeatRate (default: no heartbeat; sends empty periodic messages), plus webIdType. [S:int-piworld2020-webapi-lab] (read) [S:int-gh-pyclient-stream-api] (read)
- A utility customer (EDPR) used `/piwebapi/streamsets/{webid}/channel` for continuous streaming, scaling to about 2 million tags across 4 PI Web API instances and 39 element groups of about 50,000 tags. [S:int-uc19-edpr-webapi] (read)
- Stream Updates is an HTTP-only (non-WebSocket) alternative: register with `POST /streams/{webId}/updates` (or `POST /streamsets/updates?webId=...`), which returns a marker, then poll `GET /streams/updates/{marker}` (or `GET /streamsets/updates?marker=...`). [S:int-piworld2020-webapi-lab] (read) [S:int-gh-pyclient-stream-api] (read)
- Each stream-updates response includes the next marker (`LatestMarker`) which the client passes in the next request; results are queued server-side so the client receives only new data. [S:int-piworld2020-webapi-lab] (read)
- Stream Updates appeared as a CTP around PI Web API 2018 SP1. [S:int-dev-tech-overview] (read)
- The Batch controller has a single action, Execute, at `POST /batch`; GET is not supported. [S:int-piworld2020-webapi-lab] (read)
- A batch body is a JSON object of named sub-requests; each has `Method` and `Resource` and optionally `Content`, `Headers`, `ParentIds`, `Parameters` and `RequestTemplate`. [S:int-piworld2020-webapi-lab] (read) [S:int-gh-pyclient-request] (read)
- `ParentIds` lists sub-requests that must complete first; `Parameters` holds JSONPath expressions (e.g. `$.1.Content.WebId`) whose results fill `{0}`, `{1}`, ... placeholders in the child's Resource in order. [S:int-piworld2020-webapi-lab] (read) [S:int-gh-batch-call-py] (read)
- JSONPath syntax supported in batch: `$` (root), dot notation (`$.C.D`), index (`$.B[0].Val`) and wildcard (`$.B[*].Val`). [S:int-piworld2020-webapi-lab] (read)
- A `RequestTemplate` holds a parameterized Resource so one sub-request can be expanded over many parameter values (e.g. every WebId returned by a parent). [S:int-piworld2020-webapi-lab] (read; expansion behaviour partly inferred)
- Each batch response entry contains `Status`, `Headers` (e.g. `Content-Type: application/json; charset=utf-8`) and `Content` (the sub-request's normal response body). [S:int-piworld2020-webapi-lab] (read)
- The batch POST itself must carry the `X-Requested-With` header like any other write request; AVEVA's Python sample sends it. [S:int-gh-batch-call-py] (read)
- Sub-request Content is a JSON string, e.g. `"Content": "{'Value':3.1415}"` or `"[{'Value': '111'}, {'Value': '222'}, {'Value': '333'}]"`. [S:int-gh-batch-call-py] (read)
- PI Web API added an OMF endpoint in the 2019 release; the root Links include `Omf`. [S:int-piworld2020-webapi-lab] (read) [S:int-dev-tech-overview] (read)
- OMF messages to PI Web API are POSTed to `{piwebapi}/omf`; Edge Data Store uses `{Resource}/api/{ApiVersion}/tenants/default/namespaces/default/omf` and CONNECT data services uses `{Resource}/api/{ApiVersion}/tenants/{TenantId}/namespaces/{NamespaceId}/omf`. [S:int-gh-omf-complexdynamic-program] (read)
- OMF HTTP headers sent by AVEVA's sample: `messagetype` (type, container or data), `action` (create), `messageformat` (JSON), `omfversion` (1.2 by default), optional `compression: gzip`, plus `x-requested-with: xmlhttprequest` and Authorization. [S:int-gh-omf-complexdynamic-sendomf] (read)
- OMF messages are sent in order: type, then container, then data. [S:int-gh-omf-complexdynamic-program] (read)
- AVEVA's OMF sample treats HTTP 409 as "type already exists with the same ID and version" and any 2xx as success. [S:int-gh-omf-complexdynamic-sendomf] (read)
- PI only accepts a DateTime timestamp as the OMF type's index property and supports only one index; ADH accepts only the Dynamic type classification and does not accept Link type data. [S:int-gh-aveva-samples-omf] (read)
- OMF types cannot be changed once defined, so a changed structure requires a new type. [S:int-fledge-omf] (read)
- The PI Connector Relay has been discontinued, and the PI Web API OMF endpoint is recommended for new deployments by the FogLAMP/Fledge OMF plugin docs. [S:int-fledge-omf] (read)
- The OMF option must be selected when installing the PI Server (PI Web API) for the OMF endpoint to be available. [S:int-fledge-omf] (read)
- No webhook (outbound HTTP callback) feature was found in the PI Web API controller lists examined; push delivery is via Channels (WebSocket) and pull-based Stream Updates. [S:int-jentic-piwebapi-2018sp1] [S:int-gh-pyclient-stream-api] (inferred)

**Terms**
- Channel: a WebSocket subscription in PI Web API that pushes new values for a stream or stream set. [S:int-piworld2020-webapi-lab]
- Stream Updates: marker-based HTTP polling mechanism returning only data changed since the previous marker. [S:int-piworld2020-webapi-lab]
- Marker: opaque token returned by Stream Updates identifying the position from which to fetch the next updates. [S:int-piworld2020-webapi-lab]
- Batch: PI Web API controller that executes many sub-requests in one HTTP POST, with optional dependencies. [S:int-piworld2020-webapi-lab]
- ParentIds: batch property naming sub-requests that must run before this one. [S:int-piworld2020-webapi-lab]
- RequestTemplate: batch property that repeats a parameterized request over a set of parameter values. [S:int-gh-pyclient-request]
- Indexed Search: PI Web API Search controller backed by crawler-built indexes. [S:int-piworld2020-webapi-lab]
- PI Web API Crawler: service that crawls AF and PI Data Archive to build indexed-search indexes. [S:int-piworld2020-webapi-lab]
- OMF (OSIsoft Message Format): JSON-based message format of type, container and data messages for writing to PI, EDS and CONNECT data services. [S:int-dev-tech-overview] [S:int-gh-omf-complexdynamic-sendomf]

**Worked-example material**
- Batch body (from AVEVA Python sample, simplified):
```json
{
  "1": {"Method": "GET", "Resource": "https://srv/piwebapi/attributes?path=\\\\AF01\\OSIPythonDatabase\\OSIPythonElement|OSIPythonAttributeSampleTag"},
  "2": {"Method": "GET", "Resource": "https://srv/piwebapi/streams/{0}/value", "ParentIds": ["1"], "Parameters": ["$.1.Content.WebId"]},
  "3": {"Method": "GET", "Resource": "https://srv/piwebapi/streams/{0}/recorded?maxCount=10", "ParentIds": ["1"], "Parameters": ["$.1.Content.WebId"]},
  "4": {"Method": "PUT", "Resource": "https://srv/piwebapi/attributes/{0}/value", "Content": "{'Value':3.1415}", "ParentIds": ["1"], "Parameters": ["$.1.Content.WebId"]},
  "5": {"Method": "POST", "Resource": "https://srv/piwebapi/streams/{0}/recorded", "Content": "[{'Value': '111'}, {'Value': '222'}, {'Value': '333'}]", "ParentIds": ["1"], "Parameters": ["$.1.Content.WebId"]}
}
```
  [S:int-gh-batch-call-py]
- Batch response entry fragment: `"Status": 200, "Headers": {"Content-Type": "application/json; charset=utf-8"}, "Content": {"Links": {"Self": "https://servername/piwebapi/"}, "WebId": "F1RSiOPKGTTUcUCFkVGxiCya9gUElTUlYwMQ", "Name": "PISRV01"}` [S:int-piworld2020-webapi-lab]
- OMF type/container/data (AVEVA complex dynamic sample):
```json
[{"id": "TankMeasurement", "type": "object", "classification": "dynamic",
  "properties": {"Time": {"format": "date-time", "type": "string", "isindex": true},
                 "Pressure": {"type": "number", "name": "Tank Pressure", "description": "Tank Pressure in Pa"},
                 "Temperature": {"type": "number", "name": "Tank Temperature", "description": "Tank Temperature in K"}}}]
[{"id": "Tank1Measurements", "typeid": "TankMeasurement", "typeVersion": "1.0.0.0"}]
[{"containerid": "Tank1Measurements", "values": [{"Time": "2024-01-01T00:00:00Z", "Pressure": 101325, "Temperature": 293.1}]}]
```
  [S:int-gh-omf-complexdynamic-helper] (structure read; values illustrative)
- Channel URL: `wss://srv/piwebapi/streamsets/channel?webId={id1}&webId={id2}&includeInitialValues=true&heartbeatRate=10` [S:int-gh-pyclient-streamset-api] (parameter names read; URL composed)

**Common mistakes / pitfalls**
- Using `https://` instead of `wss://` for channel connections. [S:int-piworld2020-webapi-lab]
- Expecting indexed search to find new objects immediately: results depend on the crawler having indexed them. [S:int-piworld2020-webapi-lab] (inferred)
- Forgetting ParentIds when using Parameters: the child may run before the parent's result exists. [S:int-piworld2020-webapi-lab] (inferred)
- Sending OMF data before the type and container messages. [S:int-gh-omf-complexdynamic-program] (inferred)
- Trying to modify an existing OMF type in place; a new type (id/version) is needed. [S:int-fledge-omf]

**Open questions**
- Exact JSON of a channel message and of a stream-updates response (fields such as `Events`, `LatestMarker`, `Status`, `Source`) not read.
- Whether the Search controller/Crawler is formally deprecated or removed in PI Web API 2021/2023 (not confirmed).
- Exact RequestTemplate JSON shape (`{"RequestTemplate": {"Resource": "...{0}..."}, "Parameters": ["$.1.Content.Items[*].WebId"]}`) not read in a source.
- Supported OMF versions on PI Web API (1.0/1.1/1.2) per PI Web API release not confirmed.

### int.afsdk-dev: AF SDK development (C#)

**Facts**
- AF SDK is a .NET data-access library; OSIsoft describes it as the most performant way to access PI data in a Windows environment and the most flexible for moving data in and out of PI. [S:int-dev-tech-overview] (read)
- PI Analysis Service and PI Notifications Service are examples of services built on AF SDK. [S:int-dev-tech-overview] (read)
- AF SDK accepts PI time expressions such as `*` and `*-10h`. [S:int-dev-tech-overview] (read)
- AF 2018 SP2 added faster event-frame searches for overlapping/active time ranges, an OR operator and an OwnerName field in search, and exposed admin functions (clearing change tables, re-indexing) previously only in AFDiag via AF SDK and PowerShell. [S:int-dev-tech-overview] (read)
- Custom data references are built by declaring supported methods (e.g. GetValue, SetValue) and supported data-method contexts (e.g. RecordedValue, InterpolatedValue) and implementing them; a data pipe for a custom DR is implemented by inheriting from AFEventSource and overriding GetEvents. [S:int-dev-tech-overview] (read)
- Connecting: `PISystems myPISystems = new PISystems(); PISystem myPISystem = myPISystems.DefaultPISystem;` or `myPISystems["<AFServerName>"]`; databases via `myPISystem.Databases.DefaultDatabase` or `myPISystem.Databases["<name>"]`; elements via `myAFDB.Elements["<name>"]`. [S:int-gh-afsdk-eventcalc-program] (read)
- Reading by count: `attribute.Data.RecordedValuesByCount(triggerTime, 100, false, AFBoundaryType.Interpolated, uom, filterExpression, includeFilteredValues)` returns the 100 values before triggerTime (isForward=false). [S:int-gh-afsdk-eventcalc-program] (read)
- `AFBoundaryType` values used in AVEVA samples include `Interpolated` and `Inside`. [S:int-gh-afsdk-eventcalc-program] (read)
- Writing: `attribute.Data.UpdateValue(new AFValue(value, timestamp, uom), AFUpdateOption.Insert)`. [S:int-gh-afsdk-eventcalc-program] (read)
- Bad values are filtered with `values.RemoveAll(v => !v.IsGood)`. [S:int-gh-afsdk-eventcalc-program] (read)
- Units of measure are requested via `PISystem.UOMDatabase.UOMs["K"]`, `["torr"]`, `["L"]`, `["mol"]`, `["mol/s"]`, so the server converts values to the requested unit. [S:int-gh-afsdk-eventcalc-program] (read)
- `AFDataCache` is created, populated with `Add(attributeList)`, given `CacheTimeSpan`, refreshed with `UpdateData()`, and subscribed with an observer (`Subscribe(observer)`); internally it uses an `AFDataPipe` to receive updates from the server. [S:int-gh-afsdk-eventcalc-program] (read) [S:int-gh-afsdk-eventcalc] (read)
- An `AFDataPipeEvent` carries `Value` (an AFValue whose `.Attribute`, `.Timestamp` are used) and `Action`. [S:int-gh-afsdk-eventcalc-program] (read)
- `AFData.EndOfStream` returns the current (end-of-stream) value of an attribute. [S:int-gh-afsdk-timercalc] (read)
- `AFDataReference.CreateConfig` creates the underlying PI points for PI Point data references. [S:int-gh-afsdk-timercalc] (read)
- AVEVA's event-triggered calc sample uses AF SDK 2.10.9 and .NET Framework 4.8 and checks its update queue every `UpdateCheckIntervalMS` (5000 ms in sample config), with `CacheTimeSpanSeconds` 86400. [S:int-gh-afsdk-eventcalc] (read)
- AVEVA's timer-triggered calc sample uses `System.Timers.Timer` with `TimerIntervalMS` (60000 in sample config); it calls the calculation once at start because the timer waits a full interval before the first tick. [S:int-gh-afsdk-timercalc] (read)
- The AF SDK Getting Started Guide (v1.1.2, written against AF 2.10) has five exercises: Connection and Hierarchy Basics, Searching for Assets, Reading and Writing Data, Building an AF Hierarchy, Working with Event Frames, using a "Green Power Company" sample database. [S:int-gh-afsdk-getting-started] (read)
- AFSearch query syntax uses `Field:=value` clauses joined with AND (e.g. `Name:=*b* AND Template:=PumpTemplate`); the same syntax is passed through by PI Web API `/elements/search?query=`. [S:int-piworld2020-webapi-lab] (read)
- AF SDK clients configure OpenID Connect use with `preferOIDCAuth` in `%ProgramData%\OSIsoft\AF\AFSDK.config` (Prompt, Never, Always). [S:int-uc23-claims-auth] (read)
- AF SDK documentation has a `PIPoint.Summary` method page and `AFDataReference.Summary` page. [S:int-docs-afsdk-pipoint-summary] (snippet)

**Terms**
- PISystems: AF SDK collection of known AF servers (PISystem objects) on the client. [S:int-gh-afsdk-eventcalc-program]
- AFDataCache: client-side cache of attribute values kept current by a data pipe. [S:int-gh-afsdk-timercalc]
- AFDataPipe: AF SDK mechanism to subscribe to new events for attributes. [S:int-gh-afsdk-eventcalc]
- AFBoundaryType: enumeration controlling how values at range boundaries are returned (Inside, Interpolated, ...). [S:int-gh-afsdk-eventcalc-program]
- AFUpdateOption: enumeration controlling write behaviour (e.g. Insert). [S:int-gh-afsdk-eventcalc-program]

**Worked-example material**
```csharp
PISystems myPISystems = new PISystems();
PISystem myPISystem = myPISystems.DefaultPISystem;
AFDatabase db = myPISystem.Databases["Green Power Company"];
AFElement el = db.Elements["Reactor_1001"];
AFValues temps = el.Attributes["Temperature"].Data.RecordedValuesByCount(
    AFTime.Now, 100, false, AFBoundaryType.Interpolated,
    myPISystem.UOMDatabase.UOMs["K"], "", false);
temps.RemoveAll(v => !v.IsGood);
el.Attributes["Moles"].Data.UpdateValue(new AFValue(42.0, AFTime.Now, myPISystem.UOMDatabase.UOMs["mol"]), AFUpdateOption.Insert);
```
[S:int-gh-afsdk-eventcalc-program] (calls read; assembled into one snippet; AFTime.Now usage inferred)

**Common mistakes / pitfalls**
- Calling a calculation only from a timer means nothing runs until the first interval elapses; call it once at start. [S:int-gh-afsdk-timercalc]
- Older AF SDK versions may require code changes for samples built on 2.10.9. [S:int-gh-afsdk-eventcalc]
- Not filtering bad values (IsGood=false) before statistics. [S:int-gh-afsdk-eventcalc-program]

**Open questions** (search budget exhausted before these could be sourced; all need verification)
- `PIServer.FindPIPoint(server, name)`, `PIPoint.FindPIPoints(...)`, `PIPoint.RecordedValues(AFTimeRange, AFBoundaryType, filter, includeFiltered, maxCount)`, `PIPointList` bulk calls with `PIPagingConfiguration`, `PIDataPipe` (`AddSignups`, `GetUpdateEvents`, `GetObserverEvents`), `AFAttributeList.Data.RecordedValues`, `AFElementSearch`/`AFAttributeSearch` classes and `Template:'Pump' Name:'P*'` query syntax: not read in a source in this session.
- AFSearch exact syntax variants (`Name:'P*'` vs `Name:=P*`) not confirmed.

### int.sql: PI SQL Client, RTQP, PI OLEDB, PI JDBC/ODBC

**Facts**
- The PI SQL family (OLE DB, ODBC, JDBC) ships as PI SQL Client; version 2018 R2 added ODBC support and a pure-Java JDBC driver. [S:int-dev-tech-overview] (read)
- PI SQL Client connects over net.tcp or HTTPS using an underlying C++ library. [S:int-dev-tech-overview] (read)
- Middleware behind PI SQL Client includes PI SQL Data Access Server (RTQP Engine), PI SQL Data Access Server (Integrator Framework), PI OLEDB / PI OLEDB Enterprise and PI Integrator for Business Analytics, reaching SQL Server, the AF Server and the PI Data Archive. [S:int-dev-tech-overview] (read)
- PI OLEDB Provider (2017 R2) offers read/write (CRUD) access to PI Point data, not AF. [S:int-dev-tech-overview] (read)
- PI OLEDB Enterprise (2017 R2) offers read-only access to AF assets, event frames and AF attribute data. [S:int-dev-tech-overview] (read)
- PI JDBC (2017 R2) supports JDBC 4.0, 4.1 and 4.2 over HTTPS only, with CRUD on PI Point data and read on AF assets, event frames and attribute data. [S:int-dev-tech-overview] (read)
- PI ODBC (2016 R2) implements ODBC v3 over net.tcp or HTTPS. [S:int-dev-tech-overview] (read)
- Use cases listed: SSRS and Power BI reporting, SSIS ETL, SQL Server Linked Server, Excel/Power View, Tibco Spotfire, Tableau, OLAP/EAI and custom applications. [S:int-dev-tech-overview] (read)
- Tools shown with PI SQL: PI SQL Commander and DBVisualizer (via PI JDBC). [S:int-dev-tech-overview] (read)
- 2019 bug-fix releases were planned for PI OLEDB Provider and PI OLEDB Enterprise. [S:int-dev-tech-overview] (read)

**Terms**
- RTQP Engine: Real-Time Query Processor engine hosted by PI SQL Data Access Server, the newer SQL engine for PI SQL Client. [S:int-dev-tech-overview] (expansion of RTQP inferred)
- PI SQL DAS: PI SQL Data Access Server, middleware that PI SQL clients connect to. [S:int-dev-tech-overview]
- PI OLEDB Provider: OLE DB provider for PI Data Archive point data (read/write). [S:int-dev-tech-overview]
- PI OLEDB Enterprise: OLE DB provider for AF assets, event frames and attribute data (read-only). [S:int-dev-tech-overview]

**Worked-example material**
- (No SQL text read in a source this session; see open questions.)

**Common mistakes / pitfalls**
- Choosing PI OLEDB Enterprise for writes: it is read-only. [S:int-dev-tech-overview] (inferred)

**Open questions** (search budget exhausted; need sourcing)
- Exact table names and sample SQL: `piarchive..picomp2`, `piarchive..piinterp2`, `pipoint..classic`, RTQP catalog `Master.Element.Element`, `Master.Element.Attribute`, `Master.EventFrame.EventFrame`, PI OLEDB Enterprise catalog/schema layout.
- RTQP engine version timeline and whether PI OLEDB Enterprise is being superseded by RTQP.
- PI JDBC/ODBC connection string syntax.

### int.integrator: PI Integrator for Business Analytics

**Facts**
- PI Integrator for Business Analytics sits in the PI SQL architecture alongside PI SQL Data Access Server (Integrator Framework). [S:int-dev-tech-overview] (read)
- PI Integrator for Business Analytics already supported TLS certificates before the PI Server 2023 OIDC work. [S:int-uc23-claims-auth] (read)
- In the EDPR case study, PI Web API was chosen over PI Integrator, which the presenter described as having configuration difficulties and restrictions for their use case. [S:int-uc19-edpr-webapi] (read)

**Terms**
- PI Integrator for Business Analytics: product that publishes shaped PI/AF data (views) to BI and analytics targets. [S:int-dev-tech-overview] (definition partly inferred)

**Open questions** (search budget exhausted; needs a full research pass)
- Asset views, event views, streaming views; publish targets (SQL Server, Azure SQL/Data Lake, Kafka, Power BI, Hadoop, text files); Advanced vs Standard editions; scheduling and keys. None confirmed this session.

### int.scripting: Python, PowerShell and other scripting against PI

**Facts**
- AVEVA's Python PI Web API sample uses `requests` with either `HTTPBasicAuth(user, password)` or `HTTPKerberosAuth(mutual_authentication='REQUIRED', sanitize_mutual_error_response=False)` (from requests_kerberos). [S:int-gh-batch-call-py] (read)
- AVEVA's Python sample reads a snapshot with `GET /streams/{WebId}/value`, recorded values with `GET /streams/{WebId}/recorded?startTime=*-2d`, and trimmed output with `&selectedFields=Items.Timestamp;Items.Value`. [S:int-gh-read-attributes-py] (read)
- Writing a single value (`POST {attribute Links.Value}` with body `{"Value": 42}`) and 100 values (`POST /streams/{WebId}/recorded` with a JSON array of `{"Timestamp","Value"}`) both return HTTP 202 (Accepted) in AVEVA's sample. [S:int-gh-write-attributes-py] (read)
- Updating a static (non-PI-point) attribute value with `PUT {attribute Links.Value}` and body `{"Value": true}` returns HTTP 204. [S:int-gh-write-attributes-py] (read)
- Write requests in the Python sample send headers `X-Requested-With: XmlHttpRequest` and `content-type: application/json`. [S:int-gh-write-attributes-py] (read)
- The AVEVA Python sample requires the account to have rights to create/delete AF databases, categories, templates, elements and PI points, and PI Web API CORS configured for origin `http://localhost:9876` (used by its browser-based siblings). [S:int-gh-aveva-webapi-python-sample] (read)
- The PI Web API Jupyter data-analysis sample was tested with PI Web API 2018 SP1, PI AF Server 2018 SP2 and PI Data Archive 2018 SP2, using Basic authentication by default. [S:int-gh-webapi-jupyter-sample] (read)
- PowerShell Tools for the PI System (OSIsoft.PowerShell) ship with PI System Management Tools 2015 and later and need PowerShell 5.1+ in AVEVA's sample. [S:int-gh-adh-transfer-verification-ps] (read)
- PowerShell cmdlets used by AVEVA: `Connect-PIDataArchive -PIDataArchiveMachineName <name> [-WindowsCredential $cred] -OperationTimeout <hh:mm:ss>`, `Get-PIPoint -ID <id> -Attributes pointtype -Connection $con`, `Get-PIValue -PointId <id> -Connection $con -StartTime <t> -Count <n>`. [S:int-gh-adh-transfer-verification-getdata] (read)
- JMP (JSL) clients call `GET elements/{webId}/elements?webidtype=idonly&selectedfields=items.webid;items.name;items.description;items.path;items.haschildren;items.templatename` and parse the JSON; Kerberos or Basic authentication can be used. [S:int-jmp-pi-tagnames] (read)
- Integration platforms such as Cybus Connectware that do not support Kerberos require `Basic` to be added to the PI Web API `AuthenticationMethods` configuration item; Kerberos is enabled by default. [S:int-cybus-pi-integration] (read)
- PI Web API's help page is at `https://<server>/piwebapi/help` and can be used to explore controllers. [S:int-gh-webapi-jupyter-sample] (read)

**Terms**
- OSIsoft.PowerShell / PowerShell Tools for the PI System: PowerShell module with cmdlets such as Connect-PIDataArchive, Get-PIPoint, Get-PIValue. [S:int-gh-adh-transfer-verification-ps]
- requests_kerberos: Python package providing HTTPKerberosAuth for Kerberos (Negotiate) authentication with requests. [S:int-gh-batch-call-py]

**Worked-example material**
```python
import requests
from requests.auth import HTTPBasicAuth
base = "https://pisrv01/piwebapi"
auth = HTTPBasicAuth("user", "pwd")
attr = requests.get(base + r"/attributes?path=\\AF01\OSIPythonDatabase\OSIPythonElement|OSIPythonAttributeSampleTag", auth=auth).json()
rec = requests.get(f"{base}/streams/{attr['WebId']}/recorded?startTime=*-2d&selectedFields=Items.Timestamp;Items.Value", auth=auth).json()
for item in rec["Items"]:
    print(item["Timestamp"], item["Value"])
r = requests.post(f"{base}/streams/{attr['WebId']}/value", json={"Value": 42},
                  headers={"X-Requested-With": "XmlHttpRequest"}, auth=auth)
assert r.status_code == 202
```
[S:int-gh-read-attributes-py] [S:int-gh-write-attributes-py] (pattern read; condensed)
```powershell
$con = Connect-PIDataArchive -PIDataArchiveMachineName "PISRV01"
$pt  = Get-PIPoint -ID 12 -Attributes pointtype -Connection $con
Get-PIValue -PointId 12 -Connection $con -StartTime "2024-01-01T00:00:00Z" -Count 100
```
[S:int-gh-adh-transfer-verification-getdata] (cmdlets read; values illustrative)

**Common mistakes / pitfalls**
- Disabling certificate verification (`verify=False`) or HTTPS (`Secure(0)` in JSL) in production. [S:int-gh-read-attributes-py] [S:int-jmp-pi-tagnames]
- Hard-coding credentials in scripts; Kerberos avoids storing passwords. [S:int-jmp-pi-tagnames]
- Expecting HTTP 200 from value writes: PI Web API returns 202 for stream writes and 204 for attribute PUT. [S:int-gh-write-attributes-py]

**Open questions**
- PIconnect Python library (PIconnect.PIServer, PIconnect.PIAFDatabase, `.recorded_values`, `.interpolated_values`), its dependency on AF SDK via pythonnet: not sourced this session.
- Get-PIPoint `-Name` / `-WhereClause` parameters, `Add-PIValue`, `Get-PIArchiveFileInfo` etc.: not read.

### int.adh-apis: AVEVA Data Hub / CONNECT data services REST APIs

**Facts**
- CONNECT data services (formerly AVEVA Data Hub, formerly OSIsoft Cloud Services) is powered by the Sequential Data Store (SDS). [S:int-gh-cloudops-samples] (read)
- An example ADH resource URL is `https://uswe.datahub.connect.aveva.com` with ApiVersion `v1`. [S:int-gh-adh-time-series-py] (read)
- The REST base is `{resource}/api/{version}/Tenants/{tenantId}/Namespaces/{namespaceId}`; preview APIs use `{resource}/api/{version}-preview/...`. [S:int-gh-adh-lib-baseclient] (read) [S:int-gh-adh-lib-streams] (read)
- SDS stream endpoints: `/Streams` (GET with `query`, `skip`, `count`), `/Streams/{streamId}` (GET, POST getOrCreate, PUT createOrUpdate, DELETE), `/Streams/{id}/Type`, `/Tags`, `/Metadata`. [S:int-gh-adh-lib-streams] (read)
- SDS data endpoints: `/Streams/{id}/Data` (GET with `index`, or `startIndex`/`endIndex` window; POST insert; PUT update; PUT `?allowCreate=false` replace; DELETE with `index` or window), `/Data/First`, `/Data/Last`, `/Data/Summaries`, `/Data/Sampled`, `/Data/Transform`, `/Data/Transform/Interpolated`, and bulk `/Bulk/Streams/Data/Joins`. [S:int-gh-adh-lib-streams] (read)
- Paged window reads use `count` and `continuationToken`, looping until the continuation token is null; AVEVA's PowerShell sample uses `count=250000`. [S:int-gh-adh-lib-streams] (read) [S:int-gh-adh-transfer-verification-getdata] (read)
- SDS types are defined with `SdsTypeCode` (e.g. Object, Double, DateTime) and properties flagged `IsKey` (the index; a DateTime key for time series). [S:int-gh-adh-time-series-program] (read)
- Data Views endpoints: `/dataviews/{id}` (POST/PUT/GET/DELETE), `/dataviews` (skip, count default 100), `/dataviews/{id}/Resolved/DataItems/{queryId}`, `/Resolved/IneligibleDataItems/{queryId}`, `/Resolved/AvailableFieldSets`, `/dataviews/{id}/data/interpolated` (startIndex, endIndex, interval, count, form, cache) and `/data/stored`. [S:int-gh-adh-lib-dataviews] (read)
- Data view paging follows next/first page links returned in the HTTP `Link` header. [S:int-gh-adh-lib-dataviews] (read)
- Authentication uses OpenID Connect/OAuth 2.0 with third-party identity providers; ADH does not store user accounts. [S:int-gh-cloudops-auth] (read)
- Three auth flows: Client Credentials (machine-to-machine; tenant ID, client ID, client secret; no refresh token), Authorization Code + PKCE (SPA/native; silent refresh, no refresh token) and Hybrid (thick apps with server component; access and refresh tokens). [S:int-gh-cloudops-auth] (read)
- Client-credentials token: GET discovery document `{resource}/identity/.well-known/openid-configuration`, read `token_endpoint`, POST form `client_id`, `client_secret`, `grant_type=client_credentials`, read `access_token` and `expires_in`. [S:int-gh-omf-complexdynamic-auth] (read) [S:int-gh-adh-transfer-verification-getdata] (read)
- AVEVA's sample reuses a cached token only while more than 5 minutes remain before expiry. [S:int-gh-omf-complexdynamic-auth] (read)
- Requests send `Authorization: Bearer <token>`, `Content-type: application/json`, `Accept: application/json`; optional headers are `Accept-Verbosity: verbose|non-verbose`, `Request-Timeout` and `Community-id`. [S:int-gh-adh-lib-baseclient] (read)
- The `accept-verbosity` header controls whether default-valued fields are returned in data responses. [S:int-gh-adh-pi-readonly-py] (read)
- HTTP 207 (partial success for collection calls) is treated as an error by AVEVA's library. [S:int-gh-adh-lib-baseclient] (read)
- Streams written by the PI to Data Hub transfer are read-only and have IDs `PI_<DataArchiveName or alias>_<PointId>`; find one with query `ID:PI_<SERVER>_* AND Name:<TAG>`. [S:int-gh-adh-pi-readonly-py] (read) [S:int-gh-adh-transfer-verification-getdata] (read)
- PI-generated SDS types include IsQuestionable, IsSubstituted, IsAnnotated, SystemStateCode and DigitalStateName properties. [S:int-gh-adh-pi-readonly-py] (read)
- For compressed PI points, only archived data are sent by the PI to Data Hub agent, so comparisons cover archived values only. [S:int-gh-adh-transfer-verification-ps] (read)
- CONNECT accepts OMF at `{Resource}/api/{ApiVersion}/tenants/{TenantId}/namespaces/{NamespaceId}/omf`, using a client-credentials client and an OMF connection configured in the portal. [S:int-gh-omf-complexdynamic-program] (read) [S:int-gh-aveva-samples-omf] (read)
- CONNECT accepts only the Dynamic OMF type classification and no Link type data. [S:int-gh-aveva-samples-omf] (read)
- Communities let streams be shared across tenants; when a CommunityId is set, the namespace ID is ignored in the samples. [S:int-gh-adh-to-pi-py] (read)
- Streaming Updates in CONNECT data services use a Signup resource. [S:int-gh-cloudops-samples] (read)
- The SDS search syntax supports exact `Id:StreamDemo1` and wildcard `S*` queries. [S:int-gh-adh-to-pi-py] (read)

**Terms**
- Tenant: top-level CONNECT data services account container. [S:int-gh-cloudops-auth]
- Namespace: logical container within a tenant isolating types, streams and data views. [S:int-gh-adh-pi-readonly-py]
- SDS (Sequential Data Store): storage engine of CONNECT data services for types, streams and indexed data. [S:int-gh-cloudops-samples]
- SdsType: schema of a stream's events, with a key (index) property. [S:int-gh-adh-time-series-program]
- SdsStream: a sequence of events of one SdsType. [S:int-gh-adh-time-series-program]
- Data View: a server-side definition that queries streams and returns aligned, interpolated or stored tabular data. [S:int-gh-adh-lib-dataviews]
- Community: a cross-tenant sharing space for streams. [S:int-gh-adh-to-pi-py]
- Client Credentials client: a non-interactive identity (client ID + secret) used by services. [S:int-gh-cloudops-auth]

**Worked-example material**
- Window read: `GET https://uswe.datahub.connect.aveva.com/api/v1/Tenants/{t}/Namespaces/{ns}/Streams/PI_PISRV01_12/Data?startIndex=2024-01-01T00:00:00Z&endIndex=2024-01-02T00:00:00Z&count=250000` with `Authorization: Bearer <token>` [S:int-gh-adh-transfer-verification-getdata] (pattern read; values illustrative)
- SdsType:
```json
{"Id": "Value_Time", "SdsTypeCode": "Object", "Description": "A Time-Series indexed type with a value",
 "Properties": [{"Id": "value", "IsKey": false, "SdsType": {"Id": "doubleType", "SdsTypeCode": "Double"}},
                {"Id": "time",  "IsKey": true,  "SdsType": {"Id": "string", "SdsTypeCode": "DateTime"}}]}
```
[S:int-gh-adh-time-series-program] (structure as built by sample; serialized shape partly inferred)

**Common mistakes / pitfalls**
- Not handling `continuationToken`, so only the first page of data is read. [S:int-gh-adh-transfer-verification-getdata]
- Granting broader roles than needed; read-only access to the stream (or Tenant Member) suffices for reads. [S:int-gh-adh-transfer-verification-ps]
- Treating HTTP 207 as success when some items failed. [S:int-gh-adh-lib-baseclient]
- Storing client secrets in plain config files (samples warn this is insecure). [S:int-gh-cloudops-samples]

**Open questions**
- Current official product name timeline (OSIsoft Cloud Services -> AVEVA Data Hub -> CONNECT data services) and dates not confirmed by a dated source.
- Numeric SdsTypeCode values and the Assets/Asset Types API shape not read.
- Token lifetime default (expires_in) not stated in sources.
