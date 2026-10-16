# ind: Industry hubs and PI System customer case-study library

## Summary (read first)

- Research method: WebSearch + WebFetch only. Every AVEVA success-story page and OSIsoft/AVEVA PDF cited as `(read)` was fetched and read by WebFetch (via a summarising model, so verbatim quotes are as returned by that tool). docs.aveva.com pages are JS-rendered and were NOT readable.
- The shared WebSearch budget for this turn ran out part-way through. Searching stopped after about 40 queries. All later work used only URLs already found. Some industry topics are therefore thinner than planned: marine, buildings, pulp & paper AF hierarchies, and PI audit-trail configuration specifics.
- Fact counts in the industry sections, by tagged bullet: 265 `(read)`, 15 `(inferred)` (mostly the "typical hierarchy" syntheses, labelled as such) and 2 `(snippet)`. The cs.library outcome fields are all read from the cited page, which adds several hundred more read facts.
- Case-study library (`cs.library`): 83 PI System case blocks, all with readable sources (AVEVA success-story pages, OSIsoft/AVEVA conference decks or abstracts, and integrator pages). There is also a list of AVEVA stories that were checked and found NOT to use PI System; those must not be used as PI examples.
- Biggest gaps:
  1. Product-level 21 CFR Part 11 configuration in PI Server. This covers PI Data Archive audit database parameters, PI AF audit trail settings and e-signature features. The docs.aveva.com pages could not be read, so this is flagged `verify`.
  2. Published standard AF hierarchies per industry. AVEVA rarely publishes them; most hierarchies below are syntheses from customer decks.
  3. Typical tag counts by company size. Only individual customer figures exist; no AVEVA sizing table was found.
  4. Marine, buildings and pulp & paper have few readable technical decks.

Conventions: `[S:id]` maps to `ind.sources.json`. Outcome figures are copied exactly as the source states them, with who reported them. "AVEVA success story" means a vendor-published page on aveva.com.

---

### ind.oil-gas: Oil & gas (upstream, midstream, downstream/HPI)

**Facts**
- OSIsoft's 2015 O&G/chemicals industry deck splits use cases into Upstream (digital oil field, production optimisation, lifting cost reduction, reservoir optimisation, drilling and completions optimisation), Midstream (gas compression, storage and quality; natural gas capacity) and HPI (Hydrocarbon Processing Industries) [S:ind-uc15-og-chem] (read).
- The HPI use cases listed in that deck are: interlock statuses, operating envelopes, alarm management, column dashboards, APC monitoring, crude blending control, corrosion control, control-room temperature monitoring, catalysts, and chemicals/additives [S:ind-uc15-og-chem] (read).
- The same deck cites benchmark targets drawn from "500+ customer use cases": E&P cost per BOED reduced 2-5% YOY, logistics controllable margin improved 2-5% YOY, and HPI controllable margin improved 1-5% YOY [S:ind-uc15-og-chem] (read).
- KPIs named in the O&G deck:
  - yield accounting (Sigmafine on PI AF), 1st/2nd-level material balancing, and Plan vs Actual (PvA)
  - a 6-tier energy KPI breakdown
  - HC (hydrocarbon) loss, flare activities, and preventable lost production
  - lifting cost, cost per BOED, controllable margin, EBITDA, and OEE [S:ind-uc15-og-chem] (read)
- A Gulf of Mexico operator described in the deck had "3+M tags with diverse naming from 29 offshore DCS historians" and 650 assets. It moved all analytics, visualisation and collaboration onto a PI AF asset data object model [S:ind-uc15-og-chem] (read).
- Eni Global E&P deployed PI AF collectives on all major production assets. It used PI-to-PI for data quality and security, and built a global E&P AF data object model "with extensive templates" [S:ind-uc15-og-chem] (read).
- A refinery corrosion use case built a PI AF template for High Temperature Hydrogen Attack (HTHA). The template's inputs are metallurgy, temperature, hydrogen partial pressure and exposure length. It generates alerts, notifications and event frames on temperature/exposure limits. It was "tested and rolled out in 6 units in under 1 week" [S:ind-uc15-og-chem] (read).
- YASREF (Yanbu Aramco Sinopec refinery) used PI System as the integration and application infrastructure for 23 separate applications. It ran "all calculations and analytics once in the infrastructure" and reported a reduction of over 50% in standard applications [S:ind-uc15-og-chem] (read).
- Noble Energy reported that using PI during the Aseng FPSO startup helped engineers increase production by an estimated 10,000 barrels of oil per day, with production measured in bbl/d [S:ind-pres-noble-2015] (read).
- Noble Energy's data-collection coverage at the time of its talk was: Marcellus 85%, Gulf of Mexico 40%, West Africa 25%, Eastern Mediterranean 20%, DJ Basin under 1%. This shows that enterprise rollouts are phased by asset [S:ind-pres-noble-2015] (read).
- Noble Energy evaluated three companies in 2010 to replace its Cygnet system before choosing PI. It then piloted domestically in 2011-2012 [S:ind-pres-noble-2015] (read).
- PG&E (gas T&D) used PI AF for advanced alarm management and notification and for critical-asset condition-based monitoring. This followed a mandate to implement NTSB and PHMSA 49 CFR 192 after the 9/9/2010 gas explosion [S:ind-pres-graves-2014] (read).
- PG&E's gas system in that deck had 4.2 million customers, 6,500 miles of transmission, 43,000 miles of distribution, 4,500 RTUs and 250 automated shut-off valves [S:ind-pres-graves-2014] (read).
- Pertamina's integrated downstream dashboard reported these outcomes, as stated by OSIsoft in a 2014 regional seminar: critical depot stock-outs reduced by 60%, demurrage reduced by 40%, and overall savings of "10s of Millions" [S:ind-pres-graves-2014] (read).
- At AVEVA World 2023, Pertamina (PT Kilang Pertamina Internasional) described PI AF as the "core pillar" of its refinery data effort. It was combined with PI Vision smartphone apps, AVEVA Production Accounting for loss quantification, and AVEVA Predictive Analytics [S:ind-pres-pertamina-2023] (read).
- BPX Energy's AVEVA World 2023 talk described an enterprise-wide PI rollout over 12 months with a focus on PI AF. Its use cases included ESP (electrical submersible pump) optimisation and improving compressor run time [S:ind-pres-bpx-2023] (read).
- Cameron LNG (three trains, 13.5 MTPA) runs a PI Server with "~70,000 PI tags, over 5,000 asset framework elements". It feeds LoRaWAN wireless sensors (temperature, vibration, valve position, weather) into PI System [S:ind-ss-cameron-lng] (read).
- Enbridge integrated "more than 350,000 tags" when it consolidated 37 proprietary SCADA systems onto AVEVA Enterprise SCADA. PI Server is used for calculations, analytics and reporting, including ESG metrics [S:ind-ss-enbridge] (read).
- Enbridge's HMIs are described as API RP 1165-compliant, with abnormal situation management (ASM) support [S:ind-ss-enbridge] (read).
- TC Energy integrated AWS ML models with the AVEVA pipeline solution and PI AF for linepack forecasting and gas-control dashboards [S:ind-ss-tc-energy] (read).
- DCP Midstream (57,000 miles of gathering pipeline; 4,500 miles of natural gas pipelines) used PI System and PI Vision so that field crews could monitor sites remotely [S:ind-ss-dcp] (read).
- Petronas used AVEVA Predictive Analytics with PI System as a cloud-enabled early-warning system for rotating equipment, implemented in 2019 [S:ind-ss-petronas] (read).
- OSIsoft's 2023 company overview claimed PI is used by "95% of the Global Fortune Top 40 oil and gas companies". The page's labels were scrambled, so this pairing is the reader's best interpretation [S:ind-osisoft-overview] (read).

**Typical AF hierarchy (synthesis)**
- Upstream (inferred from [S:ind-uc15-og-chem], [S:ind-pres-noble-2015], [S:ind-pres-bpx-2023]): Enterprise > Region/Basin > Field or Asset (e.g. platform, FPSO, pad) > Facility/Well > Equipment (ESP, compressor, separator). Templates are per equipment type (well, ESP, compressor). (inferred)
- Midstream (inferred from [S:ind-pres-graves-2014], [S:ind-ss-tc-energy]): Pipeline system > Segment > Station (compressor/pump/meter station) > Equipment, with linepack and flow-balance attributes. (inferred)
- Downstream (from [S:ind-uc15-og-chem]): an enterprise OT data model with Enterprise > Plant > Unit/System > Equipment levels, plus process-unit elements such as columns, control loops and utilities. (read for the levels; inferred for the ordering)

**Terms**
- BOED: barrels of oil equivalent per day, used in cost-per-BOED KPIs [S:ind-uc15-og-chem]
- HTHA: High Temperature Hydrogen Attack, a refinery corrosion mechanism modelled in a PI AF template from metallurgy, temperature, H2 partial pressure and exposure time [S:ind-uc15-og-chem]
- ESP: electrical submersible pump, an artificial-lift device whose optimisation is a common upstream PI use case [S:ind-pres-bpx-2023]
- Linepack: the gas volume stored in a pipeline, forecast with ML on PI AF data at TC Energy [S:ind-ss-tc-energy]
- Demurrage: charges for delayed loading/unloading of vessels, reduced 40% at Pertamina downstream [S:ind-pres-graves-2014]

**Worked-example material**
- HTHA template idea: element template "HTHA Equipment". Attributes: Metallurgy (static), Temperature (PI Point, degC), H2 Partial Pressure (PI Point), Exposure Hours (analysis-calculated). An event frame template is triggered when temperature and partial pressure exceed the limit curve. Built per [S:ind-uc15-og-chem] (inferred structure; the source names the inputs only).
- Upstream production attribute: Oil Rate (bbl/d) on each well element, rolled up to field level [S:ind-pres-noble-2015] (inferred rollup).

**Common mistakes / pitfalls**
- Tag-based "spider web" architectures make integration and application management hard: 3+M tags with inconsistent naming across 29 historians. The remedy cited is an AF asset data object model [S:ind-uc15-og-chem] (read).
- Offshore data transmission brings security, performance and reliability issues. PI-to-PI is used for data quality and security [S:ind-uc15-og-chem] (read).
- Enterprise agreements need champions, defined business use cases and proven ROI before the rollout scales (Noble Energy) [S:ind-pres-noble-2015] (read).

**Open questions**
- No published AVEVA reference AF template library for O&G (well/ESP/compressor attribute lists with units) was found. Flag `verify`.
- The MOL "EBITDA improvement: $500M-550M" (2015 deck) and the "$1 billion in EBITA since 2010" (2023 overview) are different figures from different sources and years. Keep both, attributed, and never merge them.

---

### ind.power: Power generation, renewables, T&D and grid operators

**Facts**
- EIA defines heat rate as "the amount of energy used by an electrical generator or power plant to generate one kilowatthour". It is expressed in Btu per net kWh generated [S:ind-eia-heat-rate] (read).
- EIA states that 3,412 Btu is the energy equivalent of 1 kWh. Efficiency (%) = 3,412 / heat rate, so 10,500 Btu/kWh is about 33% and 7,500 Btu/kWh about 45% [S:ind-eia-heat-rate] (read).
- Net generation is the electricity delivered to the transmission line after subtracting the plant's own use (auxiliary load). Heat rate uses net kWh [S:ind-eia-heat-rate] (read).
- OSIsoft's power-generation deck lists heat rate under plant and system efficiency. It also lists production vs schedule and condenser, turbine and boiler/HRSG performance as KPIs [S:ind-pres-power-oceania-2012] (read).
- That 2012 deck claims PI is used by "about 60% of USA power generation", "100% of North American ISOs/RTOs", "13 of the top 15 wind generating producers worldwide" and "76% of USA nuclear generators and the Nuclear Regulatory Commission". It also says 19.5 GW of 23 GW of US wind generation is monitored with PI (as reported by OSIsoft, 2012) [S:ind-pres-power-oceania-2012] (read).
- Typical power-plant measurements and limits from the deck (water chemistry):
  - pH 9.2-9.6
  - cation conductivity <0.2 µS/cm; specific conductivity 4-11 µS/cm
  - dissolved oxygen <10 ppb
  - sodium <3 ppb (most points), <300 ppb in drum blowdown
  - silica <60 ppb in drum blowdown, <10 ppb in drum steam [S:ind-pres-power-oceania-2012] (read)
- Power-generation use cases in OSIsoft decks:
  - condition-based maintenance using vibration, temperature and amps, with PI totalisers as run-time counters
  - boiler tube monitoring (excursion count, duration, time out of spec)
  - start-up/shut-down analysis and controllable-loss tracking
  - emissions compliance
  - Advanced Pattern Recognition [S:ind-pres-power-oceania-2012] (read)
- The deck states that most outages and de-rates are boiler-related, the highest lost-margin system [S:ind-pres-power-oceania-2012] (read).
- A best-practice maintenance mix cited by OSIsoft: under 10% reactive, 35% preventive and 55% predictive work, versus more than 55% reactive for the average plant [S:ind-pres-power-oceania-2012] (read).
- The 2015 OSIsoft power trends deck gives the equipment hierarchy as: plant, unit, primary system, subsystem, equipment. T&D assets are substations, feeders and equipment [S:ind-pres-power-trends-2015] (read).
- The same deck lists event types for power as downtime, startup and failure. Event frames are defined by templates, triggered by start conditions, and can be backfilled into history [S:ind-pres-power-trends-2015] (read).
- The deck says attribute aliases normalise inconsistent tag names. Element templates carry calculations, notifications and performance curves [S:ind-pres-power-trends-2015] (read).
- Regulatory references for power in the deck: NERC CIP and the Electronic Security Perimeter (ESP) limiting direct access to cyber assets [S:ind-pres-power-trends-2015] [S:ind-pres-power-oceania-2012] (read).
- Luminant (17,814 MW, "largest generator in Texas") consolidated thermal performance analysis: three tools and 13 applications were replaced with PI AF [S:ind-pres-luminant-2017] (read).
- In Luminant's design, one element template produced 24 elements. Substitution parameters generated PI tags and attribute references, and the calculations were converted from Excel to AF analysis templates with backfill [S:ind-pres-luminant-2017] (read).
- Luminant reported that PI AF on its most recent combined-cycle unit saved $160K. Third-party applications historically cost "$100K+ per unit" [S:ind-pres-luminant-2017] (read).
- At Longannet Power Station (ScottishPower), PI ACE calculated all 24 PI-based metrics every 10 minutes. Scores were stored in the PI Data Archive with calculation workings as annotations [S:ind-pres-longannet-2014] (read).
- Longannet's data came from a PI Server 2010 of about 50k tags, run as a collective of two geographically separated servers, centralising data from 10 power stations. Longannet alone used 22,739 tags [S:ind-pres-longannet-2014] (read).
- Longannet's AF used site-level elements above unit-level elements, with site metrics rolled up from unit metrics. AF tables held rotas, shifts, shift teams, coal diet and planned outages [S:ind-pres-longannet-2014] (read).
- Longannet's NOx annual limit is cited as 1.8 t/GWh. 2014 YTD vs 2013 outcomes: availability up 12.4%, tube leaks down 0.14 per 1000 running hours, NOx reduced by 0.1 t/GWh [S:ind-pres-longannet-2014] (read).
- Dominion Energy built an AF SDK application that ingests SCADA, EMS, ADMS, SAP and ESRI GIS data into an "evergreen" AF model of about 28,000 elements, with "upwards of 135,000 analyses" [S:ind-ss-dominion] (read).
- Dominion's AF element types include substations, transformers, circuits, breakers, lines and batteries. Its use cases include load tap changer monitoring, VOLT-VAR control monitoring, daily peak analysis and geospatial heat maps [S:ind-ss-dominion] (read).
- PJM integrates Esri ArcGIS with PI data in its Dispatch Interactive Map Application (DIMA), displaying "1.6 million pieces of information" [S:ind-ss-pjm] (read).
- AGL reduced data capture time "from 10 mins to 1 sec across 200 wind turbines". It shares wind and solar data with partners through CONNECT data services [S:ind-ss-agl] (read).
- Kansai Electric brought all nine of its power plants into PI System and built equipment digital twins in AF [S:ind-ss-kansai] (read).
- Bruce Power (eight reactor units, 6,555 MW) consolidated "40,000 tags from AVEVA PI System" into AVEVA Asset Information Management, with live PI Vision data in AIM [S:ind-ss-bruce-power] (read).
- ENTEGA uses PI Interfaces at each renewable site feeding a central PI Server. Wind turbines are colour-coded red/yellow/green, and theoretical power is compared with actual power per turbine [S:ind-ss-entega] (read).

**Typical AF hierarchy (synthesis)**
- Thermal generation: Fleet > Plant > Unit > Primary system (boiler/HRSG, turbine, condenser, feedwater) > Subsystem > Equipment (e.g. BFP2) [S:ind-pres-power-trends-2015] (read for levels).
- Wind: Portfolio > Wind farm > Turbine (templated), with attributes Active Power (MW or kW), Wind Speed (m/s), Theoretical Power and Status [S:ind-ss-entega] (inferred attribute names; the source states the theoretical vs actual power comparison).
- T&D: Utility > Region > Substation > Transformer/Breaker/Feeder/Circuit [S:ind-ss-dominion] [S:ind-pres-power-trends-2015] (inferred ordering).

**Terms**
- Heat rate: fuel energy input per net kWh generated, in Btu/kWh. Lower is better [S:ind-eia-heat-rate]
- Net generation: gross output minus station service (auxiliary) power [S:ind-eia-heat-rate]
- NERC CIP: North American Electric Reliability Corporation Critical Infrastructure Protection standards, cited for PI security architecture [S:ind-pres-power-oceania-2012]
- Controllable losses: margin lost to operator-controllable deviations from design (e.g. condenser backpressure), tracked in PI [S:ind-pres-power-oceania-2012]
- ISO/RTO: Independent System Operator / Regional Transmission Organization, e.g. PJM [S:ind-ss-pjm]

**Worked-example material**
- Heat rate in an AF analysis (illustrative, using EIA's definition): `HeatRate_BtuPerkWh = FuelFlow_lb_h * HHV_Btu_lb / (NetMW * 1000)`. Efficiency_pct = 3412 / HeatRate_BtuPerkWh * 100. At 10,500 Btu/kWh this gives 32.5%, which EIA rounds to 33% [S:ind-eia-heat-rate] (formula from EIA; the AF expression form is inferred).
- Longannet NOx curve example: (-0.000205 x²) + (0.195 x) - 45.37 evaluated at x = 428. The input units are not stated in the source [S:ind-pres-longannet-2014] (read).

**Common mistakes / pitfalls**
- Naming conventions matter, especially for element-relative PI Vision displays (Luminant lesson) [S:ind-pres-luminant-2017] (read).
- Document the analysis backfill sequence and know asset interdependencies before backfilling [S:ind-pres-luminant-2017] (read).
- Hierarchy design affects long-term maintenance. Longannet tried to mirror its Maximo work-management structure, found mapping all tags too difficult, and cut the structure back to metrics only [S:ind-pres-luminant-2017] [S:ind-pres-longannet-2014] (read).

**Open questions**
- There is no readable AVEVA source on standard wind-turbine availability formulas (time-based vs energy-based, IEC 61400-26). Flag `verify`.

---

### ind.water: Water and wastewater utilities

**Facts**
- Non-revenue water (NRW) is "the sum of Unbilled Authorized Consumption, Apparent Losses, and Real Losses" in the IWA/AWWA water balance [S:ind-awe-water-audit] (read).
- Apparent losses include customer metering inaccuracies, unauthorised consumption such as hydrant theft, and billing data errors [S:ind-awe-water-audit] (read).
- Real losses are "the annual volume lost through all types of leaks, breaks, and overflows on mains", plus reservoirs and service connections up to the customer meter [S:ind-awe-water-audit] (read).
- A water audit "compares volumes of water treated and pumped to volumes consumed by customers" [S:ind-awe-water-audit] (read).
- Halifax Water used the IWA water audit methodology. It set up 70 District Metered Areas (DMAs) and monitored minimum night flow (MNF) in PI. Mt. Edward East 24" DMA MNF fell from 70 m³/hr (2006) to 60 m³/hr (2011) [S:ind-pres-halifax-2013] (read).
- Halifax Water's PI System in 2013 was a single PI 2010 server with 5,000 tags and 10 OPC interfaces, with archives back to 2002. Its tools were PI ProcessBook, PI DataLink and PI WebParts [S:ind-pres-halifax-2013] (read).
- Halifax Water system inputs fell from 168 MLD (2000) to 131 MLD (2012), with "$600,000" direct annual savings in recovered water. This was reported by Halifax Water's GM at the OSIsoft UC 2013 [S:ind-pres-halifax-2013] (read).
- Halifax leak examples:
  - a 700 gpm unreported leak ran 9 hours
  - a 40 m³/hr burst ran 10 days at the Port Authority meter
  - large customer meters are monitored for a fee to give early leak detection [S:ind-pres-halifax-2013] (read)
- Units seen in water PI deployments: m³/hr, gpm and MLD (million litres per day) [S:ind-pres-halifax-2013] (read).
- OSIsoft's 2015 water deck lists water use cases: real-time water loss control, advanced pressure management to reduce main breaks, chlorine verification for water quality, pump-station KPI forecasting, meter data management, and sewer meter billing (linear interpolation, flow calculations, peak detection, data replacement) [S:ind-pres-water-2015] (read).
- Water KPIs in that deck: DMA night flows, main breaks per year, non-revenue water, energy consumption and pump efficiency [S:ind-pres-water-2015] (read).
- Detroit Water & Sewerage used event frames for flow monitoring. It reported $500,000 savings over 2012-2015 from automated reporting, notifications, event frames and replacing costly software [S:ind-pres-water-2015] (read).
- Halifax average main breaks fell from 23 to 12 per year with advanced pressure management, as reported in the OSIsoft 2015 water deck [S:ind-pres-water-2015] (read).
- Compesa (Pernambuco, Brazil) telemeters 5,300 variables across 238 sources, 200 wells, 234 pumping stations, 500 treatment stations and 519 reservoirs, using AF, Data Archive, Notifications, Event Frames and Asset Analytics [S:ind-webinar-compesa-2020] (read).
- Compesa's PI alarms cover level, pressure, flow, communication failure, rainfall and power factor [S:ind-webinar-compesa-2020] (read).
- Colorado Springs Utilities' water quality teams process 14,000 samples and 80,000 analytes a year. Their assets span eight watersheds, seven treatment facilities, 38 finished-water reservoirs and over 2,700 miles of pipeline [S:ind-ss-csu] (read).
- White House Utility District (600+ miles of rural pipeline) uses PI to watch DMA flows every morning, isolate pipeline sections to find leaks, and identify pressure differentials [S:ind-ss-whud] (read).
- San Jose Water monitors pump efficiency and relative operating cost across groundwater and booster stations. It runs pumps when energy rates are lowest [S:ind-ss-sjw] (read).
- Yorkshire Water's integrator Capula said the "asset framework was a key enabler" for automated leak prediction [S:ind-ss-yorkshire] (read).
- Evides Waterbedrijf built GAMEs (Geographic Assets Management at Evides) on PI System, combining operational, equipment and geographic data [S:ind-ss-evides] (read).

**Typical AF hierarchy (synthesis)**
- Utility > System (Water / Wastewater) > Facility type (Source, Treatment plant, Pumping station, Reservoir, DMA) > Equipment (Pump, Flow meter, Chlorine analyser). DMA elements carry Inflow, MNF and Pressure attributes [S:ind-pres-halifax-2013] [S:ind-webinar-compesa-2020] (inferred).

**Terms**
- NRW (non-revenue water): unbilled authorised consumption + apparent losses + real losses [S:ind-awe-water-audit]
- DMA: District Metered Area, a hydraulically discrete zone with metered inflows, used for leak detection [S:ind-pres-halifax-2013]
- MNF: Minimum Night Flow, the lowest DMA inflow (usually overnight). A rising MNF indicates leakage [S:ind-pres-halifax-2013]
- MLD: million litres per day [S:ind-pres-halifax-2013]
- Apparent losses: metering inaccuracies, theft and billing errors [S:ind-awe-water-audit]
- Real losses: physical leakage up to the customer meter [S:ind-awe-water-audit]

**Worked-example material**
- MNF analysis: on each DMA element, add a daily analysis that computes the minimum of the Inflow attribute between 02:00 and 04:00 and writes it to an "MNF" attribute. Notify if MNF rises above a baseline. The 2006 vs 2011 baseline was 70 vs 60 m³/hr at Halifax [S:ind-pres-halifax-2013] (time window inferred; values read).

**Common mistakes / pitfalls**
- Utilities often find they are doing worse than they thought once an IWA audit is done (Halifax quote) [S:ind-pres-halifax-2013] (read).
- Creating DMAs needs new instrumentation and zone reconfiguration, so PI analytics are only as good as the metering [S:ind-pres-halifax-2013] (read).
- Former municipalities may have no SCADA capable of supporting the programme. At Halifax, PI became the central platform [S:ind-pres-halifax-2013] (read).

**Open questions**
- ILI (Infrastructure Leakage Index) and CARL were not found in a readable source. Flag `verify`.

---

### ind.chemicals: Chemicals and petrochemicals

**Facts**
- The O&G/chemicals deck lists chemical KPIs: yield, energy (6-tier breakdown), material balance, controllable margin and OEE [S:ind-uc15-og-chem] (read).
- MOL Downstream outcomes across 6 refineries under its "New Downstream Program", as reported in the OSIsoft EMEA 2015 deck:
  - yield increase 5%
  - energy consumption decreased 2% YOY
  - HC loss -30%
  - EBITDA improvement $500M-550M [S:ind-uc15-og-chem] (read)
- Covestro's monitoring platform on PI System "unifies more than one million real-time data streams and contextualizes thousands of critical assets" [S:ind-ss-covestro] (read).
- Covestro reported energy consumption reduced by 30% and CO2 emissions reduced by 39% per ton of product (AVEVA success story) [S:ind-ss-covestro] (read).
- Syensqo uses a central-to-local model: central data managers create standardised AF templates and hierarchies, and local teams build solutions on them. AF holds asset templates and batch phases [S:ind-ss-syensqo] (read).
- In one year Syensqo's specialty polymer division grew from 200 to more than 4,000 AF elements, with 600 templates and 60,000 data points in the PI Data Archive [S:ind-ss-syensqo] (read).
- Syensqo reported rollout-time reductions: OEE tracking solution from 26 weeks to 5 weeks, and batch watcher from 11 weeks to 4 weeks [S:ind-ss-syensqo] (read).
- Syensqo feeds Seeq and Ekhosoft from AF, and is introducing AVEVA PI Data Infrastructure "with aggregate tag licensing" [S:ind-ss-syensqo] (read).
- Nutrien combines PI System data with AVEVA Unified Operations Center in a central monitoring centre for nitrogen production [S:ind-ss-nutrien] (read).
- OSIsoft's 2023 overview claimed "37 of the 50 largest chemical and petrochemical companies" use PI (label pairing uncertain) [S:ind-osisoft-overview] (read).
- China National Bluestar optimised 12 sites, and one site saves $200,000 in steam costs alone, as reported in OSIsoft's company overview [S:ind-osisoft-overview] (read).
- dsm-firmenich built a global Operations Data Layer (ODL) on PI Server and AF supporting 3,500 users. It uses OEE for day-to-day value across batch and continuous operations [S:ind-pres-dsm-firmenich-2024] (read).

**Typical AF hierarchy (synthesis)**
- Enterprise > Site > Plant/Production line > Unit (reactor, column, dryer) > Equipment (pump, exchanger). Batch plants add S88 batch phases [S:ind-ss-syensqo] [S:ind-uc15-og-chem] (inferred).

**Terms**
- Controllable margin: margin attributable to operational decisions, targeted at +1-5% YOY in HPI [S:ind-uc15-og-chem]
- HC loss: hydrocarbon loss (unaccounted material) from material balance [S:ind-uc15-og-chem]
- Aggregate tag licensing: licensing based on total data streams across a data infrastructure rather than per server (Syensqo context) [S:ind-ss-syensqo]

**Worked-example material**
- Specific energy consumption: Energy (GJ or MWh) / Product (t), analogous to Covestro's "CO2 per ton of product" KPI. Calculate as an AF analysis per plant element and roll it up to site [S:ind-ss-covestro] (inferred).

**Common mistakes / pitfalls**
- Copying a solution site-to-site fails when sites make different products. Syensqo's central-to-local model keeps templates central and solutions local [S:ind-ss-syensqo] (read).
- Overlooked notifications and unplanned shutdowns caused significant losses at Covestro before anomaly detection was added [S:ind-ss-covestro] (read).

**Open questions**
- Chemicals-specific regulation (e.g. EPA, Seveso, process safety) was not found in a readable PI source. Flag `verify`.

---
### ind.pharma: Pharmaceuticals and life sciences (GxP, 21 CFR Part 11, audit trail, PI in validated environments)

**Facts: regulation**
- 21 CFR 11.10(e) requires "Use of secure, computer-generated, time-stamped audit trails to independently record the date and time of operator entries and actions that create, modify, or delete electronic records." [S:ind-ecfr-11-10] (read)
- 11.10(e) continues: "Record changes shall not obscure previously recorded information." Audit trail documentation must be retained at least as long as the subject records and be available for agency review and copying [S:ind-ecfr-11-10] (read).
- 11.10(a) requires "Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records." [S:ind-ecfr-11-10] (read)
- 11.10(b) requires the ability to generate accurate and complete copies of records in both human-readable and electronic form [S:ind-ecfr-11-10] (read).
- 11.10(c) requires protection of records "to enable their accurate and ready retrieval throughout the records retention period" [S:ind-ecfr-11-10] (read).
- 11.10(d) requires limiting system access to authorised individuals. 11.10(g) requires authority checks on who can use the system, sign, access I/O devices, alter records or perform operations [S:ind-ecfr-11-10] (read).
- 11.10(f) requires operational system checks to enforce permitted sequencing of steps and events. 11.10(h) requires device (terminal) checks [S:ind-ecfr-11-10] (read).
- 11.10(i) requires that people who develop, maintain or use the systems have appropriate education, training and experience. 11.10(j) requires written policies holding individuals accountable for actions under their electronic signatures [S:ind-ecfr-11-10] (read).
- 11.10(k) requires controls over systems documentation, including revision and change control procedures that maintain an audit trail of documentation changes [S:ind-ecfr-11-10] (read).
- FDA's August 2003 guidance "Part 11, Electronic Records; Electronic Signatures — Scope and Application" says FDA interprets Part 11's scope narrowly. Part 11 applies to records required by predicate rules that are kept electronically [S:ind-fda-part11-guidance] (read).
- Under that guidance, FDA exercises enforcement discretion on validation, audit trail, record retention and record copying requirements. Validation should be based on a documented risk assessment, and predicate-rule requirements still apply [S:ind-fda-part11-guidance] (read).
- The guidance continues to enforce access limits, operational/authority/device checks, training, accountability policies, systems documentation controls, and the electronic signature sections (11.50, 11.70, 11.100, 11.200, 11.300) [S:ind-fda-part11-guidance] (read).
- Under the guidance, legacy systems in operation before August 20, 1997 are exempt from Part 11 if they met predicate rules and are documented as fit for use [S:ind-fda-part11-guidance] (read).
- OSIsoft life-sciences material defines data integrity as accuracy and consistency of data over its full life cycle. It lists ALCOA (attributable, legible, contemporaneous, original, accurate) and says electronic data needs time/date stamps, user IDs, metadata and audit trails [S:ind-pres-ls-2016-moree] (read).
- The same deck cites MHRA (2014): data integrity is fundamental to a pharmaceutical quality system and applies to paper and electronic records. It also cites EU Annex 15 on ongoing process verification (OPV) [S:ind-pres-ls-2016-moree] (read).
- FDA's 2011 process validation guidance has three stages: process design, process qualification, and continued process verification (CPV). Janssen Cork used PI to support Stage 3 CPV [S:ind-pres-janssen-cork-2013] (read).
- An AVEVA World 2025 session by Cognizant presented "Audit Trail enhancements to the AVEVA PI System" for Life Sciences. It noted that GMP and 21 CFR Part 11 require "systems used for critical decisions include secure, traceable Audit Trails" [S:ind-aw25-audit-trail] (read).

**Facts: PI System in validated environments**
- AVEVA PI Audit Reporter is described as a "web-based audit trail review and reporting tool". Remote agents collect audit records from PI Data Archive and PI AF servers into one searchable interface [S:ind-ds-pi-audit-reporter] (read).
- PI Audit Reporter features named in its datasheet:
  - preservation of electronic signatures, user attribution and comment history
  - change control number tracking
  - role-based access, Active Directory/SSO, and on-premises deployment "for data sovereignty and validation needs"
  - PDF/CSV reports
  - availability through the Flex subscription [S:ind-ds-pi-audit-reporter] (read)
- The PI Audit Reporter datasheet names 21 CFR Part 11, NERC CIP and ISO as the standards it supports. It does not mention EU Annex 11 [S:ind-ds-pi-audit-reporter] (read).
- The AVEVA PI Server Data Archive reference documentation contains a topic titled "Audit Database" (docs.aveva.com, not readable) [S:ind-docs-da-audit-database] (snippet).
- J&J/Janssen treats the PI System as a "GMP-critical application". It moved from site-specific validation to one common "lean validation" approach rolled out with standardised PI deployments (2014) [S:ind-pres-jj-lean-validation-2014] (read).
- An E Tech Group biotech project enabled "the audit trail" on the PI Server for GMP auditing. It developed URS, FS and SDS documents, ran FAT and SAT, and kept the exported tag list as a living appendix to the SDS [S:ind-etech-biotech] (read).
- That biotech system had a 3,000-tag licence, was designed for 100,000 tags, integrated 26 skids through one Kepware server, and used four VMs [S:ind-etech-biotech] (read).
- The same project limited PI access to authorised users and integrated ViewSE auto-logout with Windows Active Directory [S:ind-etech-biotech] (read).
- Pfizer Groton keeps GMP and non-GMP, GLP and GCP data on a second, local PI server set. The PCMM machine's local historian is validated to GMP, and the PCMM has over 2,000 tags [S:ind-ss-pfizer] (read).
- Pfizer uses an AF analysis that captures event frame snapshots at the start and end of each batch, adding batch context to tablet production [S:ind-ss-pfizer] (read).
- Roche's RIPIN (Roche Interface for PI Event Frames) is a GxP-compliant Event Frames interface that replaced OSIsoft's PI AlarmView. It uses standardised event frame templates and an AF structure as a meta database, and lets users acknowledge and annotate alarms (2016) [S:ind-pres-roche-ripin-2016] (read).
- Janssen Cork modelled AF on S88: one element per process, a sub-element per CQA, and child elements for CPPs mapped to PI tags. Lab results (CQAs such as loss on drying and HPLC assays) came from ELIMS and were linked to batches by material ID and time window [S:ind-pres-janssen-cork-2013] (read).
- PI Batch first released in March 2001 with PI Server 3.3.361.43, stored in the Data Archive with a fixed structure (Batch ID, Product, Recipe, Procedure). PI Event Frames first released in November 2011 with PI Server 2010 R3, stored in the AF (SQL Server) database [S:ind-pres-batch-migration-2015] (read).
- PI Batch allowed only one unit batch per PI Unit at a time, so customers used "phantom PI Units" as a workaround. Event Frames support unlimited overlapping events per unit [S:ind-pres-batch-migration-2015] (read).
- PI Batch did not support high availability. Event Frames are supported via an HA write AF architecture and are designed for millions of events [S:ind-pres-batch-migration-2015] (read).
- PI Batch-to-Event-Frames migration is included in PI Server 2015. The steps are:
  1. Upgrade the BES/MES interfaces.
  2. Upgrade PI Server to 2015.
  3. Install EF clients.
  4. Migrate the batch data.
  5. Switch the interfaces. [S:ind-pres-batch-migration-2015] (read)
- Genentech migrated batch data from April 2006 (7.2 million events) to Event Frames. The migration needed 3 days of downtime affecting only batch data, and used the EMDVB interface on PI Server 2015 R2 / AF Server 2015 R2 [S:ind-pres-genentech-ef-2016] (read).
- Genentech's AF/SQL sizing guidance in that talk: AF Server at least 16 GB memory, and SQL Server 12 GB dedicated memory with auto-growth configured and replication removed [S:ind-pres-genentech-ef-2016] (read).
- Genentech separately moved "130 billion events across 27,000 AVEVA PI System tags" from a legacy historian with RoviSys. They needed to "prove that we were moving this with 100% data integrity" [S:ind-ss-genentech] (read).
- RtReports 4.0 (beta 2016-2017) added event-based reports with comment, verify and approve (e-signature) workflows [S:ind-pres-ef-bajoll-2016] (read).
- The 2002 OSIsoft UC session "Batch Reporting for Regulated Industries" described reporting manufacturing exceptions in a form compliant with FDA 21 CFR Part 11, using the PI Module Database, PI SDK and ProcessBook automation [S:ind-pres-batch-reporting-2002] (read).
- Life-sciences PI use cases listed by OSIsoft:
  - process understanding, scale-up and tech transfer
  - CPP/CMA/CQA risk assessment
  - golden batch analysis
  - RTRt and batch release
  - CPV/OPV, OOS investigations and SPC
  - PAT and QbD [S:ind-pres-ls-2016-moree] (read)
- OSIsoft's 2023 overview claimed "9 of the Global Fortune Top 10 pharma companies" use PI (label pairing uncertain) [S:ind-osisoft-overview] (read).

**Typical AF hierarchy**
- ISA-88 physical model: Enterprise > Site > Area > Process Cell > Unit > Equipment Module. OSIsoft's example is [AREA] My House > [PROCESS CELL] Kitchen > [UNIT] Mixer, Pan, Oven. Batch interfaces build event frame hierarchies matching batch events (Procedure > Unit Procedure > Operation > Phase) [S:ind-pres-batch-ef-2017] (read for the example; inferred for the procedural levels).

**Terms**
- GxP: umbrella for Good Manufacturing/Laboratory/Clinical Practice (GMP/GLP/GCP) regulations [S:ind-ss-pfizer]
- 21 CFR Part 11: US FDA regulation on electronic records and electronic signatures [S:ind-ecfr-11-10]
- Predicate rule: an underlying FDA record-keeping requirement outside Part 11 that determines whether Part 11 applies [S:ind-fda-part11-guidance]
- ALCOA: attributable, legible, contemporaneous, original, accurate, the data integrity principles [S:ind-pres-ls-2016-moree]
- CPV: Continued Process Verification, Stage 3 of FDA process validation [S:ind-pres-janssen-cork-2013]
- CPP / CQA: Critical Process Parameter / Critical Quality Attribute [S:ind-pres-janssen-cork-2013]
- Golden batch: a reference batch profile that other batches are compared against [S:ind-pres-ls-2016-moree]
- IQ/OQ/PQ: Installation/Operational/Performance Qualification, validation test stages [S:ind-pres-genentech-ef-2016]
- URS/FS/SDS: User Requirements, Functional and Software Design Specifications in a GMP validation lifecycle [S:ind-etech-biotech]
- Phantom PI Unit: a workaround unit in the PI Module Database to hold overlapping batches, made unnecessary by Event Frames [S:ind-pres-batch-migration-2015]

**Worked-example material**
- Batch event frame attributes from the OSIsoft example event: Name `Ex 20121215-0002`, Start 15-Dec-2012 10:35:02, End 10:47:26, Duration 12 min 24 sec, Asset (bioreactor), Product, Recipe, Temperature Min, Agitator Max [S:ind-pres-ef-bajoll-2016] (read).
- An SPC workflow from OSIsoft:
  1. Gather reference events with PI DataLink.
  2. Compute average, standard deviation and control limits in Excel.
  3. Publish them as PI Points and virtual-unit event frames via piconfig/PI Builder. [S:ind-pres-batch-ef-2017] (read)

**Common mistakes / pitfalls**
- OSIsoft recalled PI Event Frames Generator v4.0.21.200, and Genentech reverted to v4.0.11.104 [S:ind-pres-genentech-ef-2016] (read).
- At Genentech, EFs below a reference element at the second hierarchy level were not created in Realtime or Recovery mode [S:ind-pres-genentech-ef-2016] (read).
- At Genentech, SQL access worked only when logged in as the service account (a security configuration issue) [S:ind-pres-genentech-ef-2016] (read).
- Concerns that slow adoption in validated plants: resistance to change, re-validation effort, a delayed migration tool, and early-adopter risk [S:ind-pres-genentech-ef-2016] (read).
- Direct queries to a LIMS database were too slow, so Janssen built an intermediate SQL cache [S:ind-pres-janssen-cork-2013] (read).
- Site-by-site validation under local procedures is costly. J&J moved to one common lean validation approach [S:ind-pres-jj-lean-validation-2014] (read).
- Do not claim the PI System is "Part 11 compliant" on its own. Compliance depends on configuration, procedures and validation by the regulated company. The FDA guidance places responsibility on the regulated firm [S:ind-fda-part11-guidance] (inferred).

**Open questions**
- PI Data Archive audit database: how it is enabled (tuning parameter names), what it records, and file locations. Not readable. Flag `verify`.
- PI AF audit trail feature (which object changes are recorded, the SQL storage). Not readable. Flag `verify`.
- Whether PI Vision or PI Manual Logger provide native electronic signatures. Not confirmed. Flag `verify`.

---

### ind.mining: Mining, metals and minerals

**Facts**
- ArcelorMittal Mining Canada ran 2 PI Servers holding about 140,000 PI points. Components: PI AF, PI Analytics, PI Event Frames, PI Notifications and PI Manual Logger, plus 7 interface types with 50+ instances (PI World 2019) [S:ind-pres-ammc-2019] (read).
- AMMC's other data sources included Wenco FMS (fleet management), Minesight and CAT terrain models. Its presentation layer was SharePoint, Power BI, SSAS Tabular and PI Vision [S:ind-pres-ammc-2019] (read).
- AMMC used a 3-level Operations Management System:
  - Level 3: overall mine view for management
  - Level 2: value driver tree per process (drilling, loading, hauling)
  - Level 1: equipment dashboards for operators [S:ind-pres-ammc-2019] (read)
- AMMC mining KPIs:
  - mine plan conformity by material type and shovel face (target above 80%)
  - production by pit, haul cycle time and inventories
  - Road Analysis Control alarms
  - match factor for haul fleet utilisation [S:ind-pres-ammc-2019] (read)
- AMMC's fleet: 11 rope shovels, 5 L1850 loaders and 55 haul trucks (793 and 797). Mining capacity was 150+ MTPA with concentrate grade 66.2% Fe [S:ind-pres-ammc-2019] (read).
- AMMC reported mine plan conformity increased by an additional 5%. It also stated concentrator slowdowns from low crusher feed were reduced by "300%", a figure that is mathematically unclear [S:ind-pres-ammc-2019] (read).
- AMMC used a single AF template "for all historical events across all units" [S:ind-pres-ammc-2019] (read).
- Hindustan Zinc (HZL) runs a P80 soft sensor. Historical PI data trains a model in Jupyter, live PI data feeds it, and it publishes predictions every 5 minutes to PI and then to the DCS [S:ind-pres-hzl-2021-pdf] (read).
- HZL reported the P80 soft sensor at about 95% accuracy (second-order regression). It eliminated the need for 6 online particle size analysers [S:ind-pres-hzl-2021-pdf] (read).
- HZL's sulphide sulphur (S/S) soft sensor for roasters is a Random Forest model at about 90% accuracy [S:ind-pres-hzl-2021-pdf] (read).
- HZL tracks process deviations with Event Frame analyses in PI, then uses Power BI to find frequently deviating parameters [S:ind-pres-hzl-2021-pdf] (read).
- HZL's PI feature requests included: Pareto in PI Vision, automated PI Vision PDF report generation, a notification counter, and native mobile apps [S:ind-pres-hzl-2021-pdf] (read).
- Newcrest's Cadia mine reported throughput up 650,000 tons in the first six months and crushing-circuit downtime down 50%. This used redundant PI servers and model-driven virtual sensors (AVEVA success story) [S:ind-ss-newcrest] (read).
- Barrick Goldstrike used PI AF and Analytics to automate air-quality permit compliance reporting under three Air Quality Operating Permits. The AF model returns the maximum or minimum hourly average [S:ind-ss-barrick] (read).
- Vale centralised data from 35 environmental monitoring stations on PI System, with PI Vision dashboards and PI DataLink compliance reports [S:ind-ss-vale] (read).
- Alcoa matched PI sensor data with Oracle eAM maintenance records to estimate remaining useful life [S:ind-ss-alcoa] (read).
- Ok Tedi (PNG) used PI System with AVEVA Production Management and Plant SCADA. Reported results: copper recovery +2.4% and gold recovery +7.4% (Mipac, 2025) [S:ind-mipac-oktedi] (read).
- Rio Tinto's aluminium business layered AVEVA Production Management on its "widely used" PI System to track downtime and losses [S:ind-ss-rio-tinto] (read).
- OSIsoft's 2023 overview claimed use by "100% of the Global Fortune Top 10 metals and mining companies". It also reported that ArcelorMittal raised iron ore production by 10 million tons per year [S:ind-osisoft-overview] (read).

**Typical AF hierarchy (synthesis)**
- Company > Site/Mine > Process (Drilling, Loading, Hauling, Crushing, Grinding/Milling, Concentration, Pelletising, Rail, Port) > Equipment (shovel, truck, crusher, mill). The levels come from AMMC's "unit, equipment, process, plant and company" AF context [S:ind-pres-ammc-2019] (read for levels; inferred for ordering).

**Terms**
- P80: the particle size that 80% of material passes, the key grinding performance indicator [S:ind-pres-hzl-2021-pdf]
- Soft sensor: a model-derived (virtual) measurement written back to PI, e.g. P80 or S/S [S:ind-pres-hzl-2021-pdf]
- Match factor: the ratio used to assess truck-to-shovel fleet balance and utilisation [S:ind-pres-ammc-2019]
- Mine plan conformity: actual vs planned extraction by material and shovel face [S:ind-pres-ammc-2019]
- MTPA / ktph: million tonnes per annum / thousand tonnes per hour [S:ind-pres-ammc-2019]
- Value driver tree: a KPI decomposition from top-level output to process drivers [S:ind-pres-ammc-2019]

**Common mistakes / pitfalls**
- Underground sensors are hard to reach and maintain. Newcrest used model-driven virtual sensors so it could keep operating through sensor failure [S:ind-ss-newcrest] (read).
- Manual field recording and interdependent spreadsheets make compliance reporting slow and error-prone (Barrick) [S:ind-ss-barrick] (read).
- Verify impossible figures (e.g. "300%" reductions) with the author before teaching them [S:ind-pres-ammc-2019] (read).

**Open questions**
- Standard downtime/time usage model (TUM) definitions for mining in PI. Flag `verify`.

---
### ind.food-bev: Food and beverage / CPG

**Facts**
- Illovo Sugar Africa tracks 49 form-fill-seal (FFS) packing machines across 5 sites in 3 countries. AF templates define the hierarchy, and template changes cascade to all 49 machine elements [S:ind-ss-illovo] (read).
- Illovo's AF templates provide OEE broken into availability, performance and quality. Captured variables include bags-per-minute, shifts and downtime-reason codes [S:ind-ss-illovo] (read).
- Illovo uses PI Server event frames for predefined reporting periods. Reports are analysed by machine, by shift and by downtime event, with hourly, daily and weekly downtime reporting [S:ind-ss-illovo] (read).
- Illovo reported, in an AVEVA success story: "50% improvement in performance", "25% improvement in availability", and "30% improvement in OEE in three months" [S:ind-ss-illovo] (read).
- Abbott Nutrition (Granada, Spain) identified critical process parameters and critical quality attributes. It built colour-coded filler dashboards with drill-down for root-cause analysis and reported "Increased OEE by two percent" and "Increased filling speed by ten percent" [S:ind-ss-abbott] (read).
- Coop (Switzerland) connected sensors and assets from "over 3,000 sources" and uses over 70 operational parameters for KPI calculation. It reported starting "over 78 use cases in one year" [S:ind-ss-coop] (read).
- Kellogg's Valls (Spain) targeted OEE in line with the CPG best-in-class rating. It reported:
  - "Achieved CPG best-in-class rating for OEE of 80%"
  - "Reduced CCP by 64%, product failures by 73%, and minor line stops by 67%"
  - "Increased mean time between failures rate by 180%" [S:ind-ss-kelloggs] (read)
- Tyson Foods' Jimmy Dean sausage plant (over 150 million pounds per year) tracks weight by line, uptime percentage, saleable chubs, yield and giveaway. It reported waste and giveaway reduced by 50% and a 0.1% yield improvement that paid back within six months [S:ind-ss-tyson] (read).
- Tyson's plant used Rockwell FactoryTalk Historian, which the AVEVA page says is "powered by the AVEVA PI System" [S:ind-ss-tyson] (read).
- Deschutes Brewery applied machine learning to PI data to control fermenter temperature spikes during cooling and predict phase transitions. It reported production time reduced by "up to 72 hours" per batch and $8M in capital upgrades eliminated [S:ind-ss-deschutes] (read).
- Cargill runs PI System at "over 200 plants globally". Smaller sites (feed mills, grain elevators, ships, port terminals) with only a few hundred data streams use AVEVA Edge Data Store to forward data to a central PI Server [S:ind-ss-cargill] (read).
- Cargill's lab robot protein and fat results are sent as structured JSON through an AVEVA adapter to the central PI Server [S:ind-ss-cargill] (read).
- OSIsoft's event frames deck uses Clean-In-Place (CIP) as a demo. CIP phases are pre-rinse, caustic main wash, final rinse and acid second wash, with KPIs for protocol adherence and cost/duration deviations [S:ind-pres-ef-bajoll-2016] [S:ind-pres-batch-ef-2017] (read).
- UC Davis' Robert Mondavi Institute uses PI System as the research data historian to monitor wine fermentation [S:ind-ss-uc-davis-winery] (read).

**Typical AF hierarchy (synthesis)**
- Company > Site/Plant > Production line > Machine (filler, FFS packer, oven) with an OEE template (Availability, Performance, Quality, OEE, Rate e.g. bags/min, State, Downtime Reason). Event frames cover downtime, shifts and batches/CIP [S:ind-ss-illovo] [S:ind-pres-batch-ef-2017] (inferred structure from read facts).

**Terms**
- OEE: Overall Equipment Effectiveness, the product of availability, performance and quality [S:ind-ss-illovo]
- FFS: form-fill-seal packaging machine [S:ind-ss-illovo]
- Giveaway: product overfilled beyond declared weight [S:ind-ss-tyson]
- CIP: Clean-In-Place, an automated cleaning cycle for process equipment [S:ind-pres-ef-bajoll-2016]
- MTBF: mean time between failures [S:ind-ss-kelloggs]

**Worked-example material**
- OEE analysis (standard): Availability = Run time / Planned production time. Performance = (Ideal cycle time x Total count) / Run time. Quality = Good count / Total count. OEE = A x P x Q. Downtime event frames are generated when Machine State != Running, with reason-code attributes. The OEE structure is per [S:ind-ss-illovo]; the formula details are standard and inferred.

**Common mistakes / pitfalls**
- Relying on shift log sheets gives little reliable machine data (Illovo's starting point) [S:ind-ss-illovo] (read).
- Do not cite Nestlé (Waverly) or General Mills as PI examples. Those AVEVA stories use AVEVA Historian/CONNECT and System Platform respectively, not PI System [S:ind-ss-nestle] [S:ind-ss-general-mills] (read).

**Open questions**
- Food-safety regulation (FSMA, HACCP CCP logging) in PI deployments. Kellogg's "CCP" is not expanded on the page. Flag `verify`.

---

### ind.data-centres: Data centres

**Facts**
- The Green Grid defines PUE as "energy entering the facility divided by the energy used by the IT equipment". Equal overhead and IT energy gives PUE 2.0. Partial PUE breaks overhead into specific functions such as cooling [S:ind-greengrid-pue] (read).
- Digital Realty's 2017 OSIsoft UC talk defined PUE as Total Facility Load / IT Load. It cited federal targets: report PUE below 1.4 by 2018, with below 1.2 encouraged [S:ind-pres-digitalrealty-2017] (read).
- Digital Realty noted that "PUE calculations become very complex when power crosses a boundary into or out of a system" [S:ind-pres-digitalrealty-2017] (read).
- Digital Realty's data-centre AF model (with Casne Engineering) covered utility feed, UPS, PDU, RPP, BCM, cabinets and cages, kW models, breakers, panels, channels and customers. It used a templated AF model "to enforce tag consistency" [S:ind-pres-digitalrealty-2017] (read).
- Digital Realty KPIs: PUE, customer usage, circuit allocation and capacity planning, and real-time load monitoring with alerts on sudden load changes. Reported outcome: time savings of over 50% in viewing reports [S:ind-pres-digitalrealty-2017] (read).
- Equinix (with DST Controls) converted 15,000 tags and 115 HMI screens to PI, connected 108 controllers, and reorganised about 2,000 alarms and notifications. This covered a 54,488 sq ft Silicon Valley site in 6 weeks [S:ind-pres-equinix-2011] (read).
- Equinix reported going from 6 software vendors to 1 and from 2 SCADA servers to 1 PI server [S:ind-pres-equinix-2011] (read).
- Microsoft (2009) listed ten data-centre power measurement points, M1 to M10:
  - M1: utility total load
  - M2: non-critical load
  - M3: HVAC/mechanical
  - M4: critical systems
  - M5: cooling tower
  - M6: chiller and air handler
  - M7: CRAC
  - M8: UPS
  - M9: pole/circuit/rack
  - M10: IT asset power [S:ind-pres-microsoft-2009-stl] (read)
- Microsoft's Technology Center dashboards (2009) showed PUE, energy costs, carbon footprint, and PDU, UPS and rack detail (power, temperature, humidity, capacity). Units were kVA for UPS and kW for cooling [S:ind-pres-microsoft-2009-nyc] (read).
- Skanska/Infozone (2011) overlaid PI AF data on a 3-D BIM model of a data centre. KPIs were rack temperature, kW per rack and PUE. A scenario comparison showed PUE 1.70 vs 1.15 for 20,000 servers [S:ind-pres-skanska-2011] (read).
- eBay consolidated its PI Servers and rebuilt its asset framework "from the ground up". It collects 3 million data points in PI and uses the Clarity DCIM platform for dashboards on power allocation, busway loading, rack power demand and temperature/cooling [S:ind-ss-ebay] (read).
- PayPal separated about 20 years of shared data from eBay's PI System. It built its own PI System, migrated "millions of data tags" plus AF and notification data, and generates ServiceNow tickets from PI alerts across 33 data centres [S:ind-ss-paypal] (read).
- PayPal's PI sources are power management systems, building automation systems and Raritan power strips [S:ind-ss-paypal] (read).
- Aligned Energy models asset relationships in AF and builds billing "charge points" at busway level for shared PDUs and at PDU-output level for dedicated PDUs. It plans customer access via PI Web API [S:ind-ss-aligned] (read).
- Dell EMC's micro modular data centres each run a Dell IoT gateway with PI Server. PI Connector for Redfish pulls server data, and a Modbus connector is also used [S:ind-ss-dell-emc] (read).
- Dell EMC's story reports, for eBay's hyperscale modules, "Reduced asset configuration time from two weeks to four hours" and "~50%" less commissioning time [S:ind-ss-dell-emc] (read).

**Typical AF hierarchy (synthesis)**
- Portfolio > Data centre (site) > Building/Floor/Suite (hall) > Power chain (Utility feed > Switchgear > UPS > PDU > RPP/Busway > Rack/Cabinet > Customer circuit) and Cooling (Chiller > CRAC/CRAH > Cooling tower). PUE is calculated at site level from M1 and M10-type meters [S:ind-pres-digitalrealty-2017] [S:ind-pres-microsoft-2009-stl] [S:ind-ss-aligned] (inferred).

**Terms**
- PUE: Power Usage Effectiveness, total facility energy / IT equipment energy. 1.0 is the theoretical ideal [S:ind-greengrid-pue]
- Partial PUE: PUE-style ratio for one subsystem (e.g. cooling) [S:ind-greengrid-pue]
- DCIM: Data Centre Infrastructure Management software [S:ind-ss-ebay]
- PDU / RPP: Power Distribution Unit / Remote Power Panel [S:ind-pres-digitalrealty-2017]
- CRAC: Computer Room Air Conditioner [S:ind-pres-microsoft-2009-stl]
- Colocation: a data centre renting space/power to multiple customers, requiring per-customer billing [S:ind-ss-aligned]
- Redfish: a DMTF standard REST API for server hardware management, read by PI Connector for Redfish [S:ind-ss-dell-emc]

**Worked-example material**
- PUE analysis: `PUE = TagTot('Site|Utility Total kW',...) / TagTot('Site|IT Load kW',...)` over the same period. Use energy (kWh) totals rather than instantaneous kW for reportable PUE. The definition is from [S:ind-greengrid-pue]; the expression shape is illustrative only (inferred).
- Rack density example from Aligned Energy: 7 kW per rack rising to 22 kW after server refresh. Customer capacity is up to 8 MW [S:ind-ss-aligned] (read).

**Common mistakes / pitfalls**
- Too many software vendors caused tag errors at Equinix. Several small integration projects were easier to justify and cheaper than one big IT project [S:ind-pres-equinix-2011] (read).
- Landlord-owned facilities limit data visibility. Digital Realty also hit IT security restrictions and gaps in context data [S:ind-pres-digitalrealty-2017] (read).
- Separating a shared PI System on divestiture (eBay/PayPal) means "untangling" tags, AF and notifications. Plan namespaces for that [S:ind-ss-paypal] (read).

**Open questions**
- Barghest Building Performance (data centres/buildings) is NOT a PI story (it uses System Platform) [S:ind-ss-barghest] (read).
- No source gave typical PI tag counts per MW of IT load. Flag `verify`.

---

### ind.pulp-paper: Pulp, paper and forest products

**Facts**
- Klabin (Brazil's largest paper and pulp producer and exporter) collects data from over 25,000 assets. Its integrator says "we have 85,000 variables of the various integration systems, and the PI System keeps it all in one place" [S:ind-ss-klabin] (read).
- Klabin built real-time digital models of pulp production from tree harvesting through drying. It reported production up 3,400 air-dry tons per year and maintenance costs cut by nearly $10 million (AVEVA success story) [S:ind-ss-klabin] (read).
- Ence built a control-loop monitoring and diagnostics tool for its pulp mills from PI Server asset framework and event frames, visualised in PI Vision [S:ind-ss-ence] (read).
- Ence contextualises water-usage data with AF and publishes it to CONNECT, where deep-learning models predict river flow to plan water consumption [S:ind-ss-ence] (read).
- Ence reported, in an AVEVA success story:
  - 15% emissions reduction (pulp mills)
  - 1,500 MWh saved per pulp mill
  - summer water-shortage downtime from 15 days to zero
  - €150,000/year biomass savings
  - nearly 900 manual interventions avoided per day [S:ind-ss-ence] (read)
- Sappi Fine Paper's Somerset mill uses PI System to decide whether to buy more grid energy or raise steam production in its own boiler, balancing generated and purchased power [S:ind-ss-sappi] (read).
- Sappi states over 80 percent of total energy use comes from renewable sources [S:ind-ss-sappi] (read).
- OSIsoft's company overview claimed "400+ pulp and paper sites deployed worldwide" (label pairing uncertain) [S:ind-osisoft-overview] (read).

**Typical AF hierarchy (synthesis)**
- Company > Mill > Area (Woodyard, Digester/Fibreline, Bleaching, Recovery boiler, Power/Steam plant, Paper machine, Water/Effluent) > Equipment/Control loop. Control-loop elements carry PV, SP, OP and mode attributes, with event frames for poor-performance periods [S:ind-ss-ence] [S:ind-ss-klabin] (inferred).

**Terms**
- ADt (air-dry tonne): the standard pulp production unit, used in Klabin's 3,400 air-dry tons/year [S:ind-ss-klabin]
- Control-loop monitoring: tracking PID loop performance (e.g. time in manual, oscillation) to find poorly tuned loops [S:ind-ss-ence]

**Common mistakes / pitfalls**
- Evaluating proposed production changes took hours without integrated models at Klabin [S:ind-ss-klabin] (read).
- Regulatory and shareholder pressure on energy reporting drives PI adoption. Without visibility, buy-vs-generate decisions cannot be optimised (Sappi) [S:ind-ss-sappi] (read).

**Open questions**
- Paper-machine KPIs (basis weight, moisture CD/MD profiles, breaks, machine efficiency) in PI. No readable source was found because the search budget ran out. Flag `verify`.

---

### ind.buildings: Buildings, campuses and facilities

**Facts**
- UC Davis (1,000 buildings) uses PI System, PI Vision and AVEVA System Platform. The AVEVA success story reports:
  - "46% reduction in energy-use intensity since 2009, a cost savings of $15 million"
  - "62% reduction in gas usage from heating system retrofit"
  - "Expected annual savings of $150,000 from chilled water optimization" [S:ind-ss-uc-davis] (read)
- UC Davis' projects include chilled water system optimisation, HVAC scheduling, and switching district steam to low-temperature hot water, with "Projected savings of $197M over 60 years" [S:ind-ss-uc-davis] (read).
- University of Maryland, College Park centralised electrical distribution data on PI System with partner Data Systems Analysts, Inc. The AVEVA results section reports savings of 30% of HVAC energy expenses; the headline says "up to 30%" of energy expenses [S:ind-ss-umd] (read).
- The 2018 PI World Water/Energy/Facilities track included data-centre colocation portfolios, so OSIsoft grouped facilities with data centres [S:ind-pres-aligned-2018] (read).
- OSIsoft's company overview listed "facilities" and "data centers" among growth markets [S:ind-osisoft-overview] (read).
- Pfizer Groton runs a second PI server set for utilities and building automation (8 to 12 systems/historians), with a PI Vision floor-plan dashboard overlaying environmental and process data by room. It reported "50% reduction in BMS reporting" [S:ind-ss-pfizer] (read).
- City of Bremen's building management story (energy down 15% to 18%) uses AVEVA InTouch and Historian, not PI System [S:ind-ss-bremen] (read).

**Typical AF hierarchy (synthesis)**
- Campus/Portfolio > Building > Floor/Zone/Room > System (AHU, VAV, chiller, boiler, meter). Building elements carry Electricity kWh, Gas, Chilled water and Steam/Hot water meters plus floor area, giving EUI (energy-use intensity) [S:ind-ss-uc-davis] [S:ind-ss-pfizer] (inferred).

**Terms**
- EUI (energy-use intensity): energy per unit floor area per year, the KPI UC Davis cut 46% since 2009 [S:ind-ss-uc-davis]
- BMS/BAS: building management/automation system, a common PI data source [S:ind-ss-pfizer] [S:ind-ss-paypal]

**Common mistakes / pitfalls**
- Electrical distribution data spread across disparate, isolated systems limits outage response (UMD) [S:ind-ss-umd] (read).
- Mixing multi-vendor BMS without a common model makes cross-building benchmarking hard (Toyota made the same point for plants) [S:ind-ss-toyota] (inferred analogy).

**Open questions**
- No readable PI World deck with a building AF template was obtained (search budget exhausted). Flag `verify`.

---

### ind.manufacturing: Discrete and general manufacturing

**Facts**
- Toyota Motor Europe built a single centralised energy monitoring system (EnMS) on PI System to standardise data models across European plants. Validating and sharing data now takes "less than one minute" [S:ind-ss-toyota] (read).
- Michelin collects and standardises energy data from 15 production sites. It reported "Up to 10% savings in the initial few months" and energy reduced "by as much as 16%" through best-practice sharing [S:ind-ss-michelin] (read).
- Syensqo reported a 25% maintenance cost reduction, a 50% reduction in OEE breakdown losses (both under one year), and a 60% reduction in batch duration variability (three months) [S:ind-ss-syensqo] (read).
- dsm-firmenich uses OEE as its day-to-day KPI, contextualises PI data in Shiftconnector, and added an AI copilot for troubleshooting and onboarding [S:ind-pres-dsm-firmenich-2024] (read).
- IBM cut water and energy costs by $10 million a year at its Burlington, Vermont fab (as reported in OSIsoft's company overview) [S:ind-osisoft-overview] (read).
- Event categories used in manufacturing per OSIsoft: Batch, Downtime and Excursion. Event frames support S88/S95 downtimes and excursions [S:ind-pres-batch-ef-2017] (read).
- The OSIsoft example event frame "on asset Boiler-352, type 'High Violation', lasting 12 min 24 sec" uses attributes such as Fuel Gas Flow.Avg [S:ind-pres-batch-ef-2017] (read).

**Typical AF hierarchy (synthesis)**
- ISA-95 equipment hierarchy: Enterprise > Site > Area > Work centre/Production line > Work unit/Machine, with energy meters per area for an EnMS (ISO 50001 context) [S:ind-ss-toyota] [S:ind-pres-batch-ef-2017] (inferred).

**Terms**
- EnMS: Energy Management System, a centralised energy monitoring system [S:ind-ss-toyota]
- Excursion: a period when a value is outside limits, captured as an event frame [S:ind-pres-batch-ef-2017]

**Common mistakes / pitfalls**
- Large differences in plant monitoring capability and no standard data model block benchmarking [S:ind-ss-toyota] (read).
- Henkel's OEE/energy story (OEE +15%) and P&G's 90-plant standardisation use AVEVA MES/System Platform, not PI. Do not cite them as PI cases [S:ind-ss-henkel] [S:ind-ss-pg] (read).

**Open questions**
- Automotive/semiconductor PI deployments beyond Toyota and IBM were not read. Flag `verify`.

---

### ind.marine-transport: Marine, shipping and transport

**Facts**
- Caterpillar's CAT Asset Intelligence "whole-ship monitoring" is powered by PI System, with PI Servers onboard and onshore and PI connectors [S:ind-ss-caterpillar] (read).
- Caterpillar reported, in an AVEVA success story:
  - about $450,000 per vessel per year from timing barnacle removal (hull fouling)
  - about $10,000 saved in 2018 by catching an abnormal cylinder temperature on a cruise liner [S:ind-ss-caterpillar] (read)
- Caterpillar notes fuel is nearly 70% of a RORO vessel's lifetime cost, and vessels may operate for about 50 years [S:ind-ss-caterpillar] (read).
- Variable weather and ocean conditions create operational data "noise" that complicates marine analytics [S:ind-ss-caterpillar] (read).
- CSL Group (self-unloading bulk fleet) uses AVEVA PI Data Infrastructure across over 40 vessels. AVEVA Edge Data Store captures data onboard, sends critical data by satellite in near real time and uploads non-critical data later [S:ind-ss-csl] (read).
- CSL enriches vessel data with voyage, weather, traffic, geofencing and compliance context for just-in-time speed optimisation, outlier detection and predictive maintenance [S:ind-ss-csl] (read).
- CSL reported:
  - 8,233 mt CO2e avoided across 11 vessels in a year (third-party verified)
  - 29% carbon intensity reduction
  - "over 300" anomaly detections
  - up to 50% upload bandwidth reduction ship-to-shore [S:ind-ss-csl] (read)
- CSL found biofuel energy content 12-15% lower than conventional fuel, requiring more fuel per unit of performance [S:ind-ss-csl] (read).
- Cargill ships store data locally when out of network range, using Edge Data Store and an AVEVA Adapter for Modbus [S:ind-ss-cargill] (read).
- Delfi ILS Solutions' ShipView, built on PI System, feeds live ship automation data into 3D crew-training simulations [S:ind-ss-delfi] (read).
- OSIsoft listed transportation (railroads, light rail, shipping, car fleets) as a growth market [S:ind-osisoft-overview] (read).

**Typical AF hierarchy (synthesis)**
- Fleet > Vessel > System (Main engine, Auxiliary engines/gensets, Boilers/thermal oil, Hull, Cranes/self-unloader, Navigation) > Equipment (e.g. Cylinder 1..n). Vessel-level KPIs: fuel consumption (t/day), speed over ground (knots), CO2 and carbon intensity [S:ind-ss-caterpillar] [S:ind-ss-csl] (inferred).

**Terms**
- Ship-to-shore: data transfer from vessel to onshore servers over satellite, often store-and-forward [S:ind-ss-csl]
- Edge Data Store: AVEVA's lightweight edge storage that buffers and forwards data to PI Server or CONNECT [S:ind-ss-csl] [S:ind-ss-cargill]
- RORO: roll-on/roll-off cargo vessel [S:ind-ss-caterpillar]
- Hull fouling: marine growth (e.g. barnacles) increasing drag and fuel burn [S:ind-ss-caterpillar]
- Carbon intensity: CO2 emitted per unit of transport work [S:ind-ss-csl]

**Common mistakes / pitfalls**
- Limited, unreliable bandwidth needs prioritised critical vs non-critical data paths [S:ind-ss-csl] (read).
- Frequent crew turnover causes inconsistent data [S:ind-ss-csl] (read).
- Onboard data silos prevent cross-fleet learning [S:ind-ss-caterpillar] (read).

**Open questions**
- IMO CII/EEXI and EU MRV regulatory reporting with PI was not found in a readable source. Flag `verify`.
- Rail and port PI cases were not read. Flag `verify`.

---

### Deployment planner data (cross-industry; only source-stated sizes)

| Size signal | Example | Figure (as stated) | Source |
|---|---|---|---|
| Small edge site | Cargill feed mills, grain elevators, ships | "only a few hundred data streams"; Edge Data Store forwarding to a central PI Server | [S:ind-ss-cargill] (read) |
| Small regulated plant | Biotech start-up (E Tech Group) | 3,000-tag licence, designed for 100,000; 4 VMs; 26 skids | [S:ind-etech-biotech] (read) |
| Small/mid utility | Halifax Water (2013) | single PI 2010 server, 5,000 tags, 10 OPC interfaces | [S:ind-pres-halifax-2013] (read) |
| Mid utility | Compesa (2020) | 5,300 telemetered variables; 238 sources, 200 wells, 234 pumping stations, 500 treatment stations, 519 reservoirs | [S:ind-webinar-compesa-2020] (read) |
| Single data-centre site | Equinix (2011) | 15,000 tags, 108 controllers, 1 PI server | [S:ind-pres-equinix-2011] (read) |
| Pharma machine | Pfizer PCMM | over 2,000 tags on one machine | [S:ind-ss-pfizer] (read) |
| Single large plant | Longannet | 22,739 tags (within a ~50k-tag, 10-station collective) | [S:ind-pres-longannet-2014] (read) |
| Biotech site migration | Genentech | 27,000 tags, 130 billion events | [S:ind-ss-genentech] (read) |
| Nuclear station | Bruce Power | 40,000 PI tags | [S:ind-ss-bruce-power] (read) |
| Chemical division | Syensqo | 4,000+ elements, 600 templates, 60,000 data points | [S:ind-ss-syensqo] (read) |
| LNG facility | Cameron LNG | ~70,000 tags, 5,000+ AF elements | [S:ind-ss-cameron-lng] (read) |
| Pulp & paper mill | Klabin | 85,000 variables; 25,000+ assets | [S:ind-ss-klabin] (read) |
| Integrated mine | ArcelorMittal Mining Canada | ~140,000 points on 2 PI Servers; 50+ interface instances | [S:ind-pres-ammc-2019] (read) |
| T&D utility | Dominion Energy | ~28,000 AF elements; 135,000+ analyses | [S:ind-ss-dominion] (read) |
| Pipeline SCADA | Enbridge | 350,000+ tags | [S:ind-ss-enbridge] (read) |
| Large chemical enterprise | Covestro | more than one million real-time data streams | [S:ind-ss-covestro] (read) |
| Large offshore E&P | GOM operator (2015) | 3+M tags from 29 DCS historians, 650 assets | [S:ind-uc15-og-chem] (read) |
| Hyperscale data centres | eBay / PayPal | 3 million data points / "millions of data tags" | [S:ind-ss-ebay] [S:ind-ss-paypal] (read) |
| Multi-site food company | Cargill | PI at "over 200 plants globally" | [S:ind-ss-cargill] (read) |
| Multi-site pharma | Novartis | 25 manufacturing sites | [S:ind-osisoft-overview] (read) |
| Multi-site CPG | Coop | "over 3,000 sources" | [S:ind-ss-coop] (read) |

- Pattern seen in sources (inferred): small sites use edge collection (Edge Data Store) feeding a central PI Server. Mid-size sites use a single PI Server, or an HA collective, with AF and Analytics. Large enterprises use multiple site PI Servers plus PI-to-PI or a central AF/ODL, standardised templates owned centrally, and cloud sharing via CONNECT [S:ind-ss-cargill] [S:ind-ss-syensqo] [S:ind-uc15-og-chem] [S:ind-ss-agl] (inferred).

---
### cs.library: PI System customer case-study library

How to read these entries:
- Fields: Industry, Products, Region, Year, Summary, Challenge, Solution, Outcomes, Reported by, URL, Source.
- "Year" is the project or presentation year stated in the source. AVEVA success-story pages show only a 2026 "last published" date, which is NOT the project year, so their year is "not stated" unless the text gives one.
- All outcome figures were read on the page. None are snippet-only.
- Where the page itself is inconsistent, both versions are given.

#### Abbott Nutrition: The perfect fill: AVEVA PI System puts Abbott Nutrition in control of complex processes
- Industry: Food & beverage / nutrition (ind.food-bev). Products: AVEVA PI System. Region: Granada, Spain. Year: initiative launched 2018; PI used since 1999.
- Summary: Real-time filler and process-stage dashboards with drill-down for root-cause analysis. Paper records moved to a central system.
- Challenge: "Data collection spread across multiple tools and systems"; high product-to-product variability; decisions not data-driven.
- Solution: QA and engineers identified CPPs and CQAs, then built colour-coded dashboards for filling machines and process stages.
- Outcomes: "Increased OEE by two percent"; "Increased filling speed by ten percent" (the body text says an "opportunity to increase the speed of the filler by more than ten percent").
- Reported by: AVEVA (customer success story PDF).
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_AbbottNutrition.pdf [S:ind-ss-abbott]

#### ENTEGA: Going green with AVEVA PI System
- Industry: Power, renewables (ind.power). Products: AVEVA PI System, PI Server, PI Interfaces; Cogent (in-house tool). Region: Darmstadt, Germany. Year: PI adopted 2015.
- Summary: Site PI Interfaces feed a central PI Server covering 11 wind parks, 3 solar parks, 2 biogas plants and 130 PV plants.
- Challenge: Many SCADA systems and manufacturers; slow, "very inefficient and time consuming" reporting.
- Solution: A single source of truth in PI. Cogent shows online values, KPIs and forecasts, with turbines colour-coded red/yellow/green and theoretical vs actual power per turbine.
- Outcomes: No measured PI outcome figures are stated. Scale figures only: "over 600,000 customers", "€850M" invested in renewables.
- Reported by: AVEVA.
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_Entega.pdf [S:ind-ss-entega]

#### Coop: Delicious production KPIs: Coop uses AVEVA PI System to reduce production costs and increase availability
- Industry: Food & beverage / retail manufacturing (ind.food-bev). Products: AVEVA PI System, AVEVA PI Vision (Power BI connected). Region: Switzerland (Schafisheim). Year: not stated.
- Summary: PI became the OT data layer across Coop's bakery, chocolate, grain and other plants.
- Challenge: "No existing layer for operations data and calculation of solid operations KPIs".
- Solution: PI System and PI Vision to remove data silos.
- Outcomes: "Started over 78 uses cases in one year"; over 70 operational parameters used for KPIs; sensors and assets connected from "over 3,000 sources"; OEE increased (no figure given).
- Reported by: AVEVA.
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_COOP.pdf [S:ind-ss-coop]

#### Caterpillar: AVEVA PI System creates smooth sailing for Caterpillar's marine operations
- Industry: Marine (ind.marine-transport). Products: AVEVA PI System, PI Servers onboard and onshore, PI connectors, CAT Asset Intelligence. Region: not stated. Year: not stated (cites a 2018 incident).
- Summary: "Whole-ship monitoring" for remote condition checks, predictive maintenance and compliance support.
- Challenge: Complex vessels, weather and ocean "noise" in the data, onboard data silos.
- Solution: CAT Asset Intelligence powered by PI System.
- Outcomes: about $450,000 per vessel per year from timing barnacle removal; about $10,000 saved in 2018 by catching an abnormal cylinder temperature on a cruise liner; "hundreds of thousands of dollars" from reduced downtime and fuel burn.
- Reported by: AVEVA.
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_Caterpillar.pdf [S:ind-ss-caterpillar]

#### Pfizer: Accessible anywhere: Pfizer uses AVEVA PI System for production analysis
- Industry: Pharma (ind.pharma). Products: PI Server, AF, PI Vision, PI Integrator for Business Analytics, PI DataLink, PI to PI Interface; AWS; Tibco Spotfire. Region: Groton, Connecticut, US. Year: not stated.
- Summary: AF models per production room and equipment, published to AWS for Spotfire. A PI Vision floor-plan dashboard. A second PI server set for utilities and BMS.
- Challenge: Siloed data; manual CSV export to Excel; 8-12 utility/BAS systems with mismatched timestamps.
- Solution: AF equipment and process models. Analyses compute yield and capture event frame snapshots at batch start and end. GMP, non-GMP, GLP and GCP data are held on local servers.
- Outcomes: "50% faster compliance reporting"; "90% faster alarm resolution"; "50% reduction in BMS reporting"; root cause analysis 30% faster; SMEs save five to 10 hours per week.
- Reported by: AVEVA.
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_PfizerUsesAVEVAPISystem.pdf [S:ind-ss-pfizer]

#### Illovo Sugar Africa: AVEVA PI System sweetens the production process at Illovo Sugar Africa
- Industry: Food & beverage (ind.food-bev). Products: PI Server (AF templates, event frames), PI DataLink, PI Vision. Region: five sites in three countries (Africa). Year: not stated.
- Summary: Real-time OEE and downtime reporting on 49 FFS packing machines.
- Challenge: Inconsistent product weights; little reliable machine data; shift log sheets.
- Solution: AF templates (changes cascade to all 49 machine elements); event frames for reporting periods; a PI Vision dashboard per machine; Excel reports.
- Outcomes: "50% improvement in performance"; "25% improvement in availability"; "30% improvement in OEE in three months".
- Reported by: AVEVA.
- URL: https://www.aveva.com/content/dam/aveva/documents/perspectives/success-stories/SuccessStory_IllovoSugar.pdf [S:ind-ss-illovo]

#### Covestro: Covestro uses AVEVA PI System to achieve sustainable growth
- Industry: Chemicals (ind.chemicals). Products: AVEVA PI System, AVEVA Predictive Analytics. Region: not stated (global). Year: not stated.
- Summary: The Covestro Monitoring Platform on PI unifies more than one million real-time data streams.
- Challenge: Standardise and share energy and production data; overlooked notifications and unplanned shutdowns.
- Solution: PI System plus AI anomaly detection.
- Outcomes: energy consumption reduced by 30%; CO2 emissions reduced by 39% per ton of product; on track for a 50% reduction by 2030.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/covestro-pi-system/ [S:ind-ss-covestro]

#### San Jose Water: San Jose Water optimizes pump performance with AVEVA PI System
- Industry: Water (ind.water). Products: AVEVA PI System, PI Vision, System Platform, InTouch HMI, AVEVA Historian. Region: not stated. Year: not stated.
- Summary: Pump efficiency and relative cost monitoring across groundwater and booster stations.
- Challenge: Expensive, slow field efficiency tests; unexpected failures.
- Solution: Consolidated data. Pumps run when energy rates are lowest.
- Outcomes: energy savings "$143,000 annually"; "206 tons per year" carbon reduction; ROI in less than one year (estimated).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/san-jose-water-optimizes-pump-performance-with-aveva-pi-system/ [S:ind-ss-sjw]

#### Xcel Energy: Xcel Energy uses AVEVA PI System to improve wind forecasting
- Industry: Power / renewables (ind.power). Products: AVEVA PI System, PI Server. Region: not stated (US utility). Year: not stated.
- Summary: Predict wind lulls hours ahead so coal and gas units can ramp up.
- Challenge: Unexpected wind drops forced costly fast starts of thermal plants.
- Solution: PI-based forecasting.
- Outcomes: "Savings and efficiencies are roughly estimated over the last six years at $46 million"; more than $7 million per year.
- Reported by: Kasen Huwa, Xcel Energy, in an AVEVA success story. The OSIsoft overview also cites $46 million over six years [S:ind-osisoft-overview].
- URL: https://www.aveva.com/en/perspectives/success-stories/xcel-energy-uses-aveva-pi-system-to-improve-wind-forecasting/ [S:ind-ss-xcel]

#### Fingrid Oyj: Fingrid Oyj increases innovation with AVEVA PI System
- Industry: Power transmission (ind.power). Products: AVEVA PI System, PI Vision. Region: Finland. Year: not stated.
- Summary: Automated analysis and visualisation of grid measurement data.
- Challenge: Develop algorithms that use measurement data efficiently.
- Solution: PI System with PI Vision; automatic fault processing and live-data modelling.
- Outcomes: prevented "numerous potential faults across three 400 megavolt amperes transformers" (no other figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/fingrid-oyj/ [S:ind-ss-fingrid]

#### Sappi Fine Paper: Real-time resource management improves reliability and efficiency for Sappi Fine Paper
- Industry: Pulp & paper (ind.pulp-paper). Products: AVEVA PI System. Region: not stated (Somerset Mill). Year: not stated.
- Summary: Buy-vs-generate power decisions using PI data.
- Challenge: No visibility into operations data; regulatory and shareholder pressure on energy.
- Solution: PI System informs whether to buy grid energy or raise boiler steam.
- Outcomes: optimised grid purchases (no figure); "over 80 percent of total use comes from renewable sources".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/real-time-resource-management-improves-reliability-and-efficiency-for-sappi-fine-paper/ [S:ind-ss-sappi]

#### Los Angeles Department of Water and Power: Los Angeles DWP uses AVEVA PI System to unify utility data
- Industry: Water and power utility (ind.water / ind.power). Products: AVEVA PI System, PI Vision. Region: Los Angeles, USA. Year: not stated.
- Summary: Automated data collection from disparate sources.
- Challenge: Aging infrastructure; drought and wildfire.
- Solution: PI System and PI Vision.
- Outcomes: qualitative only (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/los-angeles-department-of-water-and-power/ [S:ind-ss-ladwp]

#### GlaxoSmithKline: GlaxoSmithKline improves sustainability with AVEVA PI System
- Industry: Pharma (ind.pharma). Products: AVEVA System Platform, AVEVA Reports, AVEVA PI System. Region: not stated. Year: not stated.
- Summary: PI plus System Platform as the foundation of the GSK "Factory of the Future".
- Challenge: Efficiency, standardisation, faster tech transfer.
- Solution: An integrated platform for operational information.
- Outcomes: qualitative only (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/glaxosmithkline-uses-aveva-system-platform-in-conjunction-with-pi-system/ [S:ind-ss-gsk]

#### Dr. Reddy's Laboratories: AVEVA PI System is at the heart of Dr. Reddy's Laboratories' digital transformation
- Industry: Pharma (ind.pharma). Products: AVEVA PI System. Region: India-headquartered, global plants. Year: not stated.
- Summary: Real-time streaming analytics that monitor processes against specification limits.
- Challenge: Equipment efficiency, downtime and batch failures, paper-based outputs.
- Solution: PI System as the digital-transformation core.
- Outcomes: "Nearly 90% improvement in productivity"; "40% reduction in quality-related costs" at its flagship site; WEF lighthouse recognition.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/drl/ [S:ind-ss-drreddys]

#### White House Utility District: AVEVA PI System helps White House Utility District build resilience
- Industry: Water (ind.water). Products: AVEVA PI System. Region: Tennessee, USA. Year: not stated.
- Summary: DMA flow monitoring, leak isolation and pressure analysis over 600+ miles of pipe.
- Challenge: Rural, isolated infrastructure; legacy procedures.
- Solution: PI to isolate pipeline sections and find pressure differentials.
- Outcomes: "saved US $2M"; "recovered US $30,000 in employee time"; "Deferred US $15-20M capital expansion for 11 years".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/aveva-pi-system-helps-white-house-utility-district-build-resilience/ [S:ind-ss-whud]

#### PJM Interconnection: PJM uses AVEVA PI System to visualize the electric grid in real time
- Industry: Power / grid operator (ind.power). Products: AVEVA PI System; Esri ArcGIS. Region: North America (13 states + DC). Year: not stated.
- Summary: The Dispatch Interactive Map Application (DIMA) overlays line status and weather radar.
- Challenge: Combine geographic and grid data; display 1.6 million pieces of information.
- Solution: PI data integrated with ArcGIS.
- Outcomes: improved dispatcher situational awareness (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/pjm-uses-aveva-pi-system-to-visualize-the-electric-grid-in-real-time/ [S:ind-ss-pjm]

#### Colorado Springs Utilities: Colorado Springs Utilities reduces overtime with AVEVA PI System
- Industry: Water (ind.water). Products: AVEVA PI System, PI Vision. Region: Colorado, USA (implied by the name). Year: not stated.
- Summary: Real-time water quality monitoring covering 14,000 samples and 80,000 analytes per year.
- Challenge: Reliance on SCADA operators; unintegrated systems; large service area.
- Solution: PI gathers real-time water quality data.
- Outcomes: "Analysis reporting time decreased from three weeks to fifteen minutes"; overtime reduced by 58%; vehicle usage reduced by 30%; effluent chlorine costs reduced by 10%.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/colorado-springs-utilities/ [S:ind-ss-csu]

#### Alectra Utilities: Alectra improves utility maintenance with AVEVA PI System monitoring
- Industry: Power distribution (ind.power). Products: AVEVA PI System, PI Vision. Region: Ontario, Canada (north of Toronto). Year: not stated.
- Summary: A reliability-centred maintenance (RCM3) strategy built on PI monitoring.
- Challenge: Scheduled maintenance did not scale with a growing transformer fleet.
- Solution: PI-based condition monitoring.
- Outcomes: transformer issue repaired for $100,000, avoiding a potential $3 million replacement; hydrogen monitor repaired before failure.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/alectra-utilities/ [S:ind-ss-alectra]

#### AGL Energy: AGL uses AVEVA PI System data to prevent failures and cut maintenance
- Industry: Power / renewables (ind.power). Products: AVEVA PI System, CONNECT data services. Region: Australia. Year: not stated (cites capacity growth from 300 MW in 2012 to 10,000+ MW in 2021).
- Summary: Centralised SCADA data and cloud sharing of wind and solar data with partners.
- Challenge: Rapid energy transition; scattered SCADA data.
- Solution: PI System plus CONNECT.
- Outcomes: "Saved millions in avoided failures and maintenance costs"; data capture time from 10 mins to 1 sec across 200 wind turbines.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/agl-energy/ [S:ind-ss-agl]

#### Eni: Eni uses AVEVA PI Vision to improve real-time oil field monitoring
- Industry: Oil & gas upstream (ind.oil-gas). Products: AVEVA PI System, PI Server, PI Vision. Region: Italy (Southern District). Year: not stated.
- Summary: PI data feeds simulation models as an oil-field digital twin.
- Challenge: No real-time data for modelling; slow data collection.
- Solution: PI data driving the digital twin.
- Outcomes: no Eni-specific figures. CAUTION: the page also shows a DCP Midstream "$25M" figure, which belongs to DCP, not Eni.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/eni/ [S:ind-ss-eni]

#### Eni Global E&P: Global E&P AF data object model (OSIsoft EMEA UC 2015)
- Industry: Oil & gas (ind.oil-gas). Products: PI AF collectives, PI-to-PI, PI Analytics. Region: global. Year: 2015 (presentation).
- Summary: AF collectives on all major production assets with a global template repository.
- Challenge: Diverse E&P assets, no standardisation, reactive decisions.
- Solution: Global E&P AF data object model with extensive templates.
- Outcomes: improvements in preventable lost production, lifting cost and reliability are described as estimated, with no figures.
- Reported by: OSIsoft (EMEA UC 2015 deck).
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2015/EMEA2015/PDF/UC15EU02OG01_OSIsoft_HarclerodeMichaelGravesCindyCrow_UsingthePISysteminOGandIndustrialChemicalstoDeliverBusinessValueinthe21stCenturyEnergysNewWorld.pdf [S:ind-uc15-og-chem]

#### MOL Downstream: New Downstream Program on PI (OSIsoft EMEA UC 2015)
- Industry: Oil & gas downstream / chemicals (ind.oil-gas, ind.chemicals). Products: PI System across the fuels value chain, PI-based energy and reliability apps. Region: Central Europe (6 refineries). Year: 2015 (presentation).
- Summary: PI-based applications for energy and reliability across 6 refineries.
- Challenge: Low cultural alignment, limited data-based decisions.
- Solution: The New Downstream Program (NDSP).
- Outcomes: yield increase 5%; energy consumption decreased 2% YOY; HC loss -30%; utilization 1.1%; EBITDA improvement $500M-550M.
- Reported by: OSIsoft in a 2015 user conference deck (MOL speaker Tibor Komróczki). The separate OSIsoft overview figure "$1 billion in EBITA since 2010" [S:ind-osisoft-overview] is a different claim.
- URL: (same PDF as above) [S:ind-uc15-og-chem]

#### YASREF: PI System as refinery integration infrastructure (OSIsoft EMEA UC 2015)
- Industry: Oil & gas downstream (ind.oil-gas). Products: PI System, PI AF. Region: Yanbu, Saudi Arabia (implied by the name). Year: 2015 (presentation).
- Summary: A grassroots refinery used PI as the infrastructure for 23 applications.
- Challenge: 23 separate applications from multiple vendors on an aggressive schedule.
- Solution: Standalone apps migrated onto PI AF; calculations run once in the infrastructure.
- Outcomes: smooth startup; "reduction of over 50% in standard applications".
- Reported by: OSIsoft (deck citing a YASREF speaker).
- URL: (same PDF as above) [S:ind-uc15-og-chem]

#### Newcrest Mining: Real-time data analysis to cut downtime at gold mines
- Industry: Mining (ind.mining). Products: AVEVA PI System (redundant servers, model-driven virtual sensors). Region: not stated (Cadia). Year: not stated.
- Summary: Virtual sensors keep the crushing circuit running through sensor failure.
- Challenge: No real-time data; hard-to-maintain underground sensors.
- Solution: Scalable, redundant PI architecture.
- Outcomes: throughput up 650,000 tons in the first six months; crushing-circuit downtime down 50%.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/newcrest-mining/ [S:ind-ss-newcrest]

#### Ok Tedi Mining: Striking Copper and Gold: How Data increased Ok Tedi's recovery rates
- Industry: Mining (ind.mining). Products: AVEVA PI System, AVEVA Production Management, AVEVA Plant SCADA. Region: Papua New Guinea. Year: 2025.
- Summary: A data-driven recovery strategy with integrator Mipac.
- Challenge: Declining ore grades, instability, low trust in process control.
- Solution: PI-based process improvement.
- Outcomes: copper recovery +2.4%; gold recovery +7.4%.
- Reported by: Mipac (integrator article on a talk by Daniel Qiao).
- URL: https://www.mipac.com.au/insights/ok-tedis-aveva-pi-system-journey-with-mipac/ [S:ind-mipac-oktedi]

#### Hindustan Zinc (HZL): Remote monitoring and Data Analytics using the PI System at HZL
- Industry: Mining & metals (ind.mining). Products: PI System, PI Integrator, PI Web API, PI DataLink, PI Vision, Event Frames; Power BI; LIMS. Region: India. Year: 2021 (AVEVA PI World).
- Summary: Soft sensors for P80 and sulphide sulphur, deviation event frames, and fleet health.
- Challenge: "very unique challenges" (unspecified); lab and analyser dependence.
- Solution: ML soft sensors written back to PI and the DCS every 5 minutes.
- Outcomes: P80 soft sensor about 95% accuracy, eliminating 6 online particle size analysers; S/S soft sensor about 90% accuracy.
- Reported by: the company (Pradeep Mahajan, HZL) in an AVEVA PI World 2021 presentation.
- URL: https://www.aveva.com/en/perspectives/presentations/2021/remote-monitoring-and-data-analytics-using-the-pi-system-at-hzl/ [S:ind-pres-hzl-2021] [S:ind-pres-hzl-2021-pdf]

#### ArcelorMittal Mining Canada: The PI System at the heart of a Mining Integrated Remote Operations Center
- Industry: Mining (ind.mining). Products: 2 PI Servers (~140,000 points), AF, Analytics, Event Frames, Notifications, PI Vision, DataLink, Manual Logger, OLEDB. Region: Quebec North Shore, Canada. Year: 2019 (PI World San Francisco).
- Summary: A 3-level OMS from mine view to equipment dashboards.
- Challenge: Integrating fleet, mine plan, DCS/PLC, rail and port data.
- Solution: PI as the IROC data hub, with a 90-day optimisation sprint.
- Outcomes: mine plan conformity increased by an additional 5%. Concentrator slowdowns from low crusher feed were "reduced by 300%", a figure that is mathematically unclear and should be verified.
- Reported by: the company (Plourde, AMMC) in a PI World 2019 presentation.
- URL: https://cdn.osisoft.com/osi/presentations/2019-uc-san-francisco/US19NA-D2MM07-ArcelorMittalMinesCanada-Plourde-The-PI-system-at-the-heart-of-a-Mining-Integrated.pdf [S:ind-pres-ammc-2019]

#### Barrick Goldstrike: Improving environmental regulation compliance with better data management
- Industry: Mining (ind.mining). Products: PI AF and Analytics, Data Archive, Notifications, PI DataLink, PI Coresight, PI System Explorer. Region: Nevada, USA. Year: not stated.
- Summary: Automated air-quality permit reporting.
- Challenge: Three Air Quality Operating Permits; manual field logs; interdependent spreadsheets.
- Solution: AF and Analytics compute hourly max/min averages.
- Outcomes: interim spreadsheets removed (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/barrick-goldstrike/ [S:ind-ss-barrick]

#### Vale: Responsible mining with data
- Industry: Mining (ind.mining). Products: AVEVA PI System, PI Vision, PI DataLink (with Accenture). Region: not stated (Brazil-based company). Year: not stated.
- Summary: 35 environmental monitoring stations centralised in PI.
- Challenge: Environmental compliance reporting; field risk.
- Solution: PI Vision dashboards and DataLink compliance reports.
- Outcomes: field trips from 600km to 200km average per month; air quality reporting from 5h20 to two minutes; data updates from seven days to five minutes; station integration from one month to three days.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/vale-sa/ [S:ind-ss-vale]

#### Alcoa: Alcoa transforms its approach to maintenance
- Industry: Metals (ind.mining). Products: AVEVA PI System; Oracle eAM; Senseye. Region: not stated. Year: not stated.
- Summary: Remaining-useful-life prediction from PI plus maintenance records.
- Challenge: Integrate PI history with Oracle eAM.
- Solution: Match sensor data with maintenance history.
- Outcomes: "20% decrease in unplanned downtime"; "10% decrease in maintenance work-hours".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/alcoa-transforms-its-approach-to-maintenance/ [S:ind-ss-alcoa]

#### Rio Tinto: Streamlining data at every stage of the mining value chain
- Industry: Mining (ind.mining). Products: AVEVA PI System, Production Management, AIM, System Platform, Plant SCADA. Region: not stated (Australia mentioned). Year: not stated.
- Summary: Production Management layered on PI to track downtime and losses.
- Challenge: The in-house downtime tracking system had fallen out of use.
- Solution: Production Management on PI.
- Outcomes: no figures. The "100% availability / 80% utilization" numbers in the page are illustrative quotes, NOT results.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/rio-tinto/ [S:ind-ss-rio-tinto]

#### BPX Energy: From Data to Dollars: The Rapid Integration of AVEVA PI System into BPX Energy Upstream Operations
- Industry: Oil & gas upstream (ind.oil-gas). Products: AVEVA PI System, PI AF. Region: US (not stated in the abstract). Year: 2023 (AVEVA World San Francisco).
- Summary: An enterprise-wide PI rollout in 12 months.
- Challenge: not stated.
- Solution: PI AF-centred rollout; ESP optimisation; compressor run-time use cases.
- Outcomes: "shift in mindset" and value across the organisation (no figures).
- Reported by: the company (John Burroughs, BPX) in an AVEVA World 2023 presentation abstract.
- URL: https://www.aveva.com/en/perspectives/presentations/2023/bpx--from-data-to-dollars--the-rapid-integration-of-aveva--pi-system--into-bpx-energy-upstream-operations/ [S:ind-pres-bpx-2023]

#### Pertamina (2023): Journey to Operational Excellence: AVEVA PI System Transformative Influence at Pertamina
- Industry: Oil & gas downstream (ind.oil-gas). Products: PI AF, PI Vision, AVEVA Production Accounting, AVEVA Predictive Analytics. Region: Indonesia. Year: 2023.
- Summary: PI AF as the "core pillar" of the refinery data strategy.
- Challenge: "translating the vast volume of data into useful insight".
- Solution: AF plus mobile PI Vision apps plus loss accounting.
- Outcomes: no figures in the abstract.
- Reported by: the company (PT Kilang Pertamina Internasional speakers) in an AVEVA World 2023 abstract.
- URL: https://www.aveva.com/en/perspectives/presentations/2023/pertamina--journey-to-operational-excellence---aveva--pi-system--transformative-influence-at-pertamina/ [S:ind-pres-pertamina-2023]

#### Pertamina (downstream fuels, c.2014): Integrated downstream dashboard
- Industry: Oil & gas downstream (ind.oil-gas). Products: PI System. Region: Indonesia. Year: 2014 (seminar).
- Summary: The fuels value chain from crude source to distribution integrated on PI, with a central operations centre.
- Challenge: Conflicting data, stock-outs, high demurrage.
- Solution: All downstream solutions migrated onto a common PI infrastructure.
- Outcomes: critical depot stock-outs reduced by 60%; demurrage reduced by 40%; overall savings of "10s of Millions".
- Reported by: OSIsoft (Graves) at a 2014 São Paulo regional seminar.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2014/RegionalSeminars/RS2014_SaoPaulo/PDF/RS2014_SaoPaulo_OSIsoft_Graves_StudyCasesUsingaDataInfrastructure.pdf [S:ind-pres-graves-2014]

#### PG&E: Predictive and proactive gas T&D
- Industry: Oil & gas midstream / gas utility (ind.oil-gas). Products: PI System, PI AF. Region: California, USA. Year: 2014 (seminar).
- Summary: AF-based alarm management and CBM after the 2010 explosion.
- Challenge: NTSB/PHMSA 49 CFR 192 mandate; unintegrated systems.
- Solution: PI AF for alarm management, notification, CBM and mobility.
- Outcomes: qualitative (safer, more reliable T&D; no figures).
- Reported by: OSIsoft (seminar deck quoting a PG&E engineer).
- URL: (same PDF as above) [S:ind-pres-graves-2014]

#### Noble Energy: Noble Energy's path to Operations Excellence
- Industry: Oil & gas upstream (ind.oil-gas). Products: PI System, PI AF. Region: Gulf of Mexico, Eastern Mediterranean, West Africa, US onshore. Year: 2014-2015 (OSIsoft regional seminar).
- Summary: PI replaced Cygnet in phases.
- Challenge: Replace legacy monitoring; prove ROI for an enterprise agreement.
- Solution: PI AF structure across departments; PI before the Aseng FPSO startup.
- Outcomes: PI during the Aseng startup helped engineers increase production by an estimated 10,000 barrels of oil per day.
- Reported by: the company (Joe Hill, Shawn Cole) in an OSIsoft seminar presentation.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2014/RegionalSeminars/RS2014_Pittsburgh/PDF/RS2014_Pittsburgh_NobleEnergyInc_HillShawnCole_NobleEnergyspathtoOperationsExcellence.pdf [S:ind-pres-noble-2015]

#### DCP Midstream: Gaining critical visibility into systems and assets with AVEVA PI System
- Industry: Oil & gas midstream (ind.oil-gas). Products: AVEVA PI System, PI Vision. Region: not stated (US). Year: FY2017 outcome.
- Summary: Remote monitoring across 57,000 miles of gathering pipeline.
- Challenge: Systems not designed for analytics; long field rounds.
- Solution: A single PI view of operations.
- Outcomes: "$25M saved in fiscal year 2017 from improved plant operations".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/dcp-midstream/ [S:ind-ss-dcp]

#### PETRONAS: Reducing equipment downtime and saving millions with early failure detection
- Industry: Oil & gas (ind.oil-gas). Products: AVEVA PI System, AVEVA Predictive Analytics. Region: Malaysia. Year: implemented 2019.
- Summary: A cloud-enabled early-warning system for rotating equipment.
- Challenge: Undetected rotating equipment failures; dispersed experts.
- Solution: Predictive Analytics on PI data.
- Outcomes: $33 million saved from reduced unplanned downtime, based on 51 warnings including 12 high-risk ones (stated as 20x ROI); asset utilisation up 0.1% per plant.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/petronas/ [S:ind-ss-petronas]

#### TC Energy: Intelligent midstream solutions digitally transform pipeline operations
- Industry: Oil & gas midstream (ind.oil-gas). Products: AVEVA PI System/PI AF, AVEVA Enterprise Pipeline Management/SCADA, AWS. Region: not stated (North America). Year: not stated.
- Summary: ML linepack forecasting and gas-control dashboards.
- Challenge: Slow scenario planning.
- Solution: AWS ML models integrated with PI AF.
- Outcomes: "$8 million in demonstrated value from strategic dashboards".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/tc-energy/ [S:ind-ss-tc-energy]

#### Cameron LNG: World-scale LNG facility boosts field efficiency and safety
- Industry: Oil & gas / LNG (ind.oil-gas). Products: PI Server, PI Vision, AVEVA Mobile Operator; Seeq; LoRaWAN; private LTE. Region: Louisiana, USA. Year: not stated (1,000th cargo in 2025).
- Summary: Mobile rounds plus wireless sensors into PI (~70,000 tags; 5,000+ AF elements).
- Challenge: Operators lost 30-60 minutes per day travelling for data.
- Solution: Field data in PI; PI Vision DCS graphics.
- Outcomes: avoided "millions in potential instrumentation costs" (no exact figure).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/cameron-lng/ [S:ind-ss-cameron-lng]

#### Enbridge: Using AVEVA pipeline solutions to operate one of the world's largest SCADA systems
- Industry: Oil & gas pipelines (ind.oil-gas). Products: AVEVA Enterprise SCADA, AVEVA PI Server, Pipeline Operations for Liquids. Region: North America. Year: 50% complete in 2024.
- Summary: 37 SCADA systems consolidated; PI Server for analytics and ESG reporting.
- Challenge: Aging, diverging legacy SCADA.
- Solution: COTS SCADA plus PI.
- Outcomes: 37 proprietary SCADA systems replaced with one; more than 350,000 tags integrated.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/enbridge/ [S:ind-ss-enbridge]

#### Luminant: Thermal Performance Analysis with PI Asset Framework
- Industry: Power (ind.power). Products: PI AF, AF analyses, PI Vision. Region: Texas, USA. Year: 2017 (OSIsoft regional seminar, Austin).
- Summary: 13 thermal performance applications consolidated into PI AF templates.
- Challenge: Three tools and 13 applications, each needing its own expertise.
- Solution: Templates with substitution parameters; Excel calcs converted to analyses with backfill.
- Outcomes: saved $160K on its most recent combined-cycle unit (versus third-party apps at "$100K+ per unit").
- Reported by: the company (Jackson, Luminant) in a 2017 OSIsoft regional seminar.
- URL: https://cdn.osisoft.com/osi/presentations/2017-rs-austin/2017-rs-austin-080-Luminant-Jackson-Thermal-Performance-Analysis-with-PI-Asset-Framework.pdf [S:ind-pres-luminant-2017]

#### ScottishPower (Longannet Power Station): Using the Power of PI AF to Create Centralised Management Reporting at Longannet
- Industry: Power (ind.power). Products: PI Server 2010 collective, PI AF, PI ACE, PI OLEDB. Region: Scotland, UK. Year: 2014 (OSIsoft EMEA UC; integrator Capula).
- Summary: 83 metrics, of which 24 are calculated by PI ACE every 10 minutes, in a site/unit AF model.
- Challenge: Spreadsheet metrics; life extension beyond 2020.
- Solution: An AF metrics model with AF tables for shifts, coal diet and outages.
- Outcomes (2014 YTD vs 2013): availability up 12.4%; tube leaks down 0.14 per 1000 running hours; NOx reduced by 0.1 t/GWh.
- Reported by: Capula Ltd in an OSIsoft EMEA 2014 presentation.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2014/EMEA2014/PDF/EMEA14_CapulaLtd_BradleyLisaMoir_UsingThePowerofPIAFtoCreateCentralisedManagementReportingatLongannetPowerStation.pdf [S:ind-pres-longannet-2014]

#### Tenaga Nasional Berhad: PI as a unifying data layer across a generation fleet
- Industry: Power (ind.power). Products: PI System. Region: Malaysia. Year: 2015 (seminar).
- Summary: PI deployed in-house across a diverse fleet.
- Challenge: A diverse fleet with no common data layer.
- Solution: PI as the unifying data layer; TNB also sells PI deployment services.
- Outcomes: over USD 7 million savings from in-house implementation; over USD 10 million tangible savings from plant analysis and optimisation.
- Reported by: OSIsoft in a 2015 São Paulo seminar deck.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2015/RegionalSeminars/RS2015_SaoPaulo/PDF/RS2015_SaoPaulo_OSIsoft_ThomasonKevinWalsh_TrendsinthePowerIndustry.pdf [S:ind-pres-power-trends-2015]

#### DONG Energy: PI with Esri ArcGIS for offshore wind
- Industry: Power / offshore wind (ind.power). Products: PI System, Esri ArcGIS. Region: Denmark/Northern Europe (not stated). Year: 2015 (seminar).
- Summary: Asset integrity and logistics for 1,800 offshore turbines.
- Challenge: Offshore work about 15 times more expensive than onshore.
- Solution: Condition-based and predictive monitoring.
- Outcomes: could "cut OPEX by up to about €20M per year (NPV)". This is an expectation, not a measured result.
- Reported by: OSIsoft (2015 seminar deck; the overview also cites €20 million [S:ind-osisoft-overview]).
- URL: (same PDF as above) [S:ind-pres-power-trends-2015]

#### Dominion Energy: Building a cloud-enabled, unified asset environment
- Industry: Power and T&D (ind.power). Products: PI System, AF SDK, PI Server, PI Vision, CONNECT. Region: US. Year: not stated (webinar CY24 Q2).
- Summary: An "evergreen" AF model of ~28,000 elements and 135,000+ analyses built automatically from SCADA, EMS, ADMS, SAP and GIS.
- Challenge: Thousands of assets added or retired weekly; siloed data.
- Solution: An AF SDK auto-builder; CONNECT sharing.
- Outcomes: 50% increase in speed-to-market for environmental data; 42 potential equipment failures identified and prevented in one year; new use cases in days instead of months.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/dominion-energy/ [S:ind-ss-dominion]

#### Ontario Power Generation: Delivering safe, reliable, and sustainable power
- Industry: Power, nuclear and hydro (ind.power). Products: AVEVA PI System, AVEVA Predictive Analytics. Region: Ontario, Canada. Year: not stated.
- Summary: AI condition-based maintenance across the nuclear and hydro fleet.
- Challenge: High-risk environment; reactive culture.
- Solution: 1,200+ predictive models fed from PI.
- Outcomes: up to $4 million (USD) efficiency savings in the first 24 months; $400,000 from one nuclear catch; $200,000 from one hydro catch; 3,000 annual maintenance hours redirectable.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/ontario-power-generation/ [S:ind-ss-opg]

#### Bruce Power: The world's largest nuclear facility powers digital transformation with data-centric processes
- Industry: Power, nuclear (ind.power). Products: AVEVA PI System/PI Vision, Asset Information Management, Point Cloud Manager, CONNECT. Region: Ontario, Canada. Year: not stated.
- Summary: 40,000 PI tags plus documents and equipment codes consolidated into AIM.
- Challenge: Document-centric processes.
- Solution: Live PI Vision data embedded in AIM workflows.
- Outcomes: 1000 employee hours saved; 15% savings in avoided repeat walkdowns; 30% execution savings; 50% savings at engineering change closeout.
- Reported by: AVEVA. These outcomes are mostly attributable to AIM/engineering tools rather than PI alone.
- URL: https://www.aveva.com/en/perspectives/success-stories/bruce-power/ [S:ind-ss-bruce-power]

#### Kansai Electric Power: The power of communication: How Kansai used the PI System to transform its power plants
- Industry: Power (ind.power). Products: AVEVA PI System, AF digital twins. Region: Japan. Year: not stated (post-2011 reforms).
- Summary: All nine power plants brought into PI.
- Challenge: Market deregulation ending its regional monopoly.
- Solution: PI plus AF equipment twins.
- Outcomes: "Savings of $3 million a year in one plant alone".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/kansai/ [S:ind-ss-kansai]

#### Halifax Water: Leveraging the PI System in Water Loss Control
- Industry: Water (ind.water). Products: PI 2010 server (5,000 tags), 10 OPC interfaces, ProcessBook, DataLink, WebParts. Region: Halifax, Nova Scotia, Canada. Year: 2013 (OSIsoft UC Paris).
- Summary: 70 DMAs with night-flow monitoring.
- Challenge: The IWA audit showed worse performance than expected; no capable SCADA in former municipalities.
- Solution: DMAs, MNF trending, DataLink "White Boards".
- Outcomes: system inputs from 168 MLD (2000) to 131 MLD (2012); $600,000 direct annual savings; main breaks from 23 to 12 per year (2015 deck).
- Reported by: the company (Carl Yates, GM) in an OSIsoft UC 2013 presentation, and by OSIsoft (2015 water deck).
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2013/EMEA2013/PDF/EMEA13_HalifaxWater_Yates_LeveragingThePISystemInWaterLossControl.pdf [S:ind-pres-halifax-2013] [S:ind-pres-water-2015]

#### Detroit Water & Sewerage Department: Operational intelligence for water supply
- Industry: Water (ind.water). Products: PI System, event frames, notifications. Region: Detroit, USA. Year: 2015 (deck).
- Summary: Automated reporting and flow monitoring with event frames.
- Challenge: Costly software and manual reporting.
- Solution: PI automated reports, notifications and EFs.
- Outcomes: "$500,000" savings 2012-2015; "Expected $2,000,000" savings over the next 5 years (expectation).
- Reported by: OSIsoft (2015 London water deck).
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2015/RegionalSeminars/IF2015_London/PDF/IF2015_London_OSIsoft_Wong_OverviewofOSIsoftintheGlobalWaterIndustry_v2.pdf [S:ind-pres-water-2015]

#### Yorkshire Water: With AVEVA PI System, Yorkshire Water predicts leaks four and a half days earlier
- Industry: Water (ind.water). Products: PI Data Archive, AF, PI Vision (integrator Capula). Region: UK (inferred). Year: not stated.
- Summary: Automated leak prediction on an AF data structure.
- Challenge: Aging infrastructure; new regulations; fines.
- Solution: AF-driven automated analytics.
- Outcomes: leak prediction "four and a half days earlier". Separately, an OSIsoft 2020 webinar reports leak repair turnaround "from 30 days to under 10 days" [S:ind-webinar-compesa-2020].
- Reported by: AVEVA; OSIsoft webinar.
- URL: https://www.aveva.com/en/perspectives/success-stories/yorkshire-water/ [S:ind-ss-yorkshire]

#### Evides Waterbedrijf: Dutch water company improves situational awareness with data from AVEVA PI System
- Industry: Water (ind.water). Products: AVEVA PI System, PI Server, PI DataLink, PI Vision. Region: Netherlands. Year: not stated.
- Summary: GAMEs, a geographic asset management system on PI.
- Challenge: Large network, orphan datasets.
- Solution: PI data combined with GIS.
- Outcomes: "Fifty functionalities developed in twelve months".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/evides-waterbedrijf/ [S:ind-ss-evides]

#### Compesa: O uso do PI System na Indústria de Águas & Saneamento
- Industry: Water (ind.water). Products: PI Data Archive, AF, Notifications, Event Frames, Asset Analytics. Region: Pernambuco, Brazil. Year: 2020 (OSIsoft webinar).
- Summary: 5,300 telemetered variables across about 1,700 water facilities.
- Challenge: A semi-arid region; safety and operational control.
- Solution: Real-time monitoring, alarms, dam monitoring, BI and GIS integration.
- Outcomes: no Compesa outcome figures. Other utilities cited: Sabesp energy use down 9%; MPWiK 500,000 litres saved in 6 months.
- Reported by: OSIsoft webinar (Muller, Squassoni).
- URL: https://cdn.osisoft.com/osi/webinars/20.10.15-webinar-Compesa-Lucena.pdf [S:ind-webinar-compesa-2020]

#### Digital Realty: Demystifying the Data Center
- Industry: Data centres (ind.data-centres). Products: PI Data Archive, PI AF (templated model); integrator Casne Engineering. Region: US (20+ colocation sites). Year: 2017 (OSIsoft UC San Francisco).
- Summary: Hosted PI/AF for PUE, capacity and customer usage.
- Challenge: Weekly manual data pulls; Excel tracking; landlord-owned sites.
- Solution: An AF template model enforcing tag consistency.
- Outcomes: "Time savings of over 50% in viewing reports".
- Reported by: the company (Gupana, Lake) in an OSIsoft UC 2017 presentation.
- URL: https://cdn.osisoft.com/osi/presentations/2017-uc-san-francisco/UC1702NAFW05_DigitalRealty_SGupana_BLake_DemystifyingtheDataCenter.pdf [S:ind-pres-digitalrealty-2017]

#### Equinix: SCADA replacement with the PI System (with DST Controls)
- Industry: Data centres (ind.data-centres). Products: PI Server, PI Notifications. Region: Silicon Valley, USA. Year: 2011 (OSIsoft UC).
- Summary: Legacy SCADA replaced by PI in 6 weeks: 15,000 tags, 115 screens, 108 controllers.
- Challenge: Unsupported SCADA; weak capacity planning and outage notification.
- Solution: PI with a capacity view, automated monthly energy summaries, and reorganised alarms.
- Outcomes: software vendors from 6 to 1; servers from 2 SCADA to 1 PI.
- Reported by: Equinix and DST Controls in an OSIsoft UC 2011 presentation.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2011/UsersConference2011/PDF/BRS1524_DST_Equinix_Dumas-Brigham.pdf [S:ind-pres-equinix-2011]

#### eBay: eBay enhances data center visibility and forecasting at scale
- Industry: Data centres (ind.data-centres). Products: AVEVA PI System; Clarity DCIM. Region: not stated. Year: presented at PI World 2018.
- Summary: Consolidated PI Servers and a rebuilt AF; 3 million data points.
- Challenge: No holistic real-time view; spreadsheets.
- Solution: A cockpit view of power, busway, rack and cooling.
- Outcomes: qualitative ("Faster, data-driven decisions on million-dollar infrastructure investments").
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/ebay/ [S:ind-ss-ebay]

#### PayPal: Gaining real-time control of data center operations
- Industry: Data centres (ind.data-centres). Products: AVEVA PI System, PI Server (AF, notifications), PI Vision; ServiceNow. Region: global (33 data centres). Year: not stated.
- Summary: An independent DCIM after separating from eBay's PI System.
- Challenge: "Untangle 20 years' worth of data".
- Solution: Own PI System; millions of tags migrated; alerts create ServiceNow tickets.
- Outcomes: executive reporting "in seconds instead of weeks" (a quote elsewhere on the page says "instead of 40 days later").
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/paypal/ [S:ind-ss-paypal]

#### Aligned Energy: Making data center billing more flexible and transparent
- Industry: Data centres, colocation (ind.data-centres). Products: AVEVA PI System, AF, PI Web API (planned). Region: not stated (US). Year: presented at PI World 2018.
- Summary: AF "charge points" for per-customer billing.
- Challenge: Varying client load demands; billing transparency.
- Solution: An AF model of asset relationships; customer portals.
- Outcomes: "Customers can monitor their own energy usage and unused capacity"; "Improved billing transparency".
- Reported by: AVEVA; also a PI World 2018 talk by Energy Metrics [S:ind-pres-aligned-2018].
- URL: https://www.aveva.com/en/perspectives/success-stories/aligned-energy/ [S:ind-ss-aligned]

#### Dell EMC: Dell EMC gains real-time visibility and streamlines micro data centers management
- Industry: Data centres (ind.data-centres). Products: PI Server on IoT gateways, PI Vision, PI Connector for Redfish, Modbus connector. Region: global. Year: presented at the OSIsoft 2017 UC.
- Summary: The MDCi platform for unstaffed micro modular data centres.
- Challenge: Thousands of remote MDCs with no staff.
- Solution: PI as a "single pane of glass".
- Outcomes: for eBay's hyperscale modules, "Reduced asset configuration time from two weeks to four hours" and "~50%" less commissioning time.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/dell-emc/ [S:ind-ss-dell-emc]

#### Genentech (2016): Migrating a Pharmaceutical Facility to Event Frames
- Industry: Pharma (ind.pharma). Products: PI Server 2015 R2, AF Server 2015 R2, PI Coresight 2015, EMDVB interface, PI-to-PI. Region: US. Year: 2016 (OSIsoft UC; integrator CSI).
- Summary: 7.2 million batch events (since April 2006) migrated to Event Frames in a validated system.
- Challenge: Spreadsheet KPIs; not all data linked to PI Batch.
- Solution: Virtual dev environment; EF templates from user requirements.
- Outcomes: user-reported time savings and data confidence (no figures); 3 days of downtime affecting batch data only.
- Reported by: Genentech and Control Systems Integration in an OSIsoft UC 2016 presentation.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2016/UsersConference2016/PDF/PH162060_GenentechControlSystemsIntegration_SumlinLewisCain_MigratingaPharmaceuticalFacilitytoEventFrames.pdf [S:ind-pres-genentech-ef-2016]

#### Genentech (historian migration): Migrated and validated billions of data points to AVEVA PI System
- Industry: Pharma / biotech (ind.pharma). Products: AVEVA PI System, PI Vision (with RoviSys). Region: not stated. Year: not stated.
- Summary: About 20 years of legacy historian data migrated with zero downtime.
- Challenge: No downtime allowed; data integrity proof needed.
- Solution: Migration and validation with RoviSys.
- Outcomes: "Moved 130 billion events across 27,000 AVEVA PI System tags".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/genentech/ [S:ind-ss-genentech]

#### Janssen Pharmaceutical (Cork): Combining Laboratory and Process Data on the PI System
- Industry: Pharma (ind.pharma). Products: PI Collective, PI AF, PI ACE, RtReports, PI Batch, BatchView, DataLink, ProcessBook; ELIMS. Region: Cork, Ireland. Year: 2013 (OSIsoft UC).
- Summary: S88-based AF linking CQAs (lab) to CPPs (process) for CPV.
- Challenge: Separate lab and process systems.
- Solution: AF element per process, CQA sub-elements, CPP child elements; ACE writes to SQL.
- Outcomes: qualitative (CPV extended to a broad user base; no figures).
- Reported by: the company (Kevin Crean) in an OSIsoft UC 2013 presentation.
- URL: https://cdn.osisoft.com/corp/en/media/presentations/2013/UsersConference2013/PDF/UC2013_JJ_KevinCrean_CombiningLaboratoryAndProcessDataOnThePISystem.pdf [S:ind-pres-janssen-cork-2013]

#### F. Hoffmann-La Roche: GxP Compliant Alarm Handling with Event Frames and AF
- Industry: Pharma (ind.pharma). Products: PI Event Frames, PI AF, PI Coresight; RIPIN (OctaveSoft). Region: Switzerland. Year: 2016 (OSIsoft UC Berlin).
- Summary: A GxP-compliant EF alarm interface replacing PI AlarmView.
- Challenge: Replace legacy AlarmView in a GxP context.
- Solution: Standard EF templates; AF as meta database; web acknowledge and annotate.
- Outcomes: none quantified.
- Reported by: Roche and OctaveSoft in an OSIsoft UC 2016 abstract.
- URL: https://wwwtest.osisoft.com/presentations/f--hoffmann-la-roche--gxp-compliant-alarm-handling-with-event-frames-and-af [S:ind-pres-roche-ripin-2016]

#### Biogen: Bringing Alzheimer's drug within reach with AVEVA PI System
- Industry: Pharma / biotech (ind.pharma). Products: AVEVA PI System. Region: not stated. Year: not stated.
- Summary: Real-time review by exception before batches advance.
- Challenge: No real-time visibility; strict regulation.
- Solution: Contextualised PI data on the plant floor.
- Outcomes: no measured figures. Goals only: reduce costs "from $10,000 to $100-150 per gram"; enough drug for one million patients.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/biogen/ [S:ind-ss-biogen]

#### Bristol-Myers Squibb: Empowering operators with real-time fault detection
- Industry: Pharma (ind.pharma). Products: AVEVA PI System (AF, event frames). Region: not stated. Year: not stated (PI World 2019 talk by the same team [S:ind-pres-ls-2019]).
- Summary: Real-time multivariate monitoring built with AF.
- Challenge: Batch data latency; lack of context.
- Solution: "built with out-of-the-box tools in the asset framework".
- Outcomes: qualitative (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/bristol-myers-squibb/ [S:ind-ss-bms]

#### Unnamed biotech (E Tech Group): Biotech Scale-Up Uses FTView and AVEVA PI Historian
- Industry: Pharma / biotech (ind.pharma). Products: PI Data Archive, AF, PI Vision, Notifications and Analysis, PI Buffering, PI SMT, PI ICU; FactoryTalk ViewSE; Kepware; Dream Report. Region: not stated. Year: not stated.
- Summary: A cGMP scale-up with the audit trail enabled on PI Server.
- Challenge: Islands of automation, some predating Part 11.
- Solution: URS/FS/SDS validation lifecycle; FAT/SAT; AD-integrated access.
- Outcomes: automatic batch reports; no quantified results.
- Reported by: E Tech Group (integrator case study).
- URL: https://etechgroup.com/case-studies/biotech-manufacturing-scale-up-rockwell-ft-view-and-osi-historian-21cfr-part-11-compliant/ [S:ind-etech-biotech]

#### dsm-firmenich: Driving manufacturing excellence at dsm-firmenich with AI and standardized PI Server data
- Industry: Chemicals / manufacturing (ind.chemicals, ind.manufacturing). Products: PI Server, PI AF; Shiftconnector. Region: global. Year: 2024 (AVEVA World Paris).
- Summary: A global Operations Data Layer with OEE and an AI copilot.
- Challenge: Manual reports and contextualisation across a global network.
- Solution: A standardised ODL on PI Server and AF.
- Outcomes: ODL supports 3,500 users (no other figures).
- Reported by: the company (Jens Tuexen) in an AVEVA World 2024 abstract.
- URL: https://www.aveva.com/en/perspectives/presentations/2024/driving-manufacturing-excellence-at-dsm-firmenich-with-ai-and-standardized-pi-server-data/ [S:ind-pres-dsm-firmenich-2024]

#### Syensqo: Structuring manufacturing data at scale
- Industry: Chemicals (ind.chemicals). Products: PI Server/AF, PI Vision, PI Data Infrastructure; Seeq; Ekhosoft. Region: global (60+ sites). Year: transformation since 2016.
- Summary: A central-to-local AF template model across about 30 polymer plants.
- Challenge: Replicate solutions without removing site autonomy.
- Solution: Central templates and hierarchies; local solutions.
- Outcomes: maintenance costs 25% reduction; OEE breakdown losses 50% reduction; batch duration variability 60% reduction; OEE rollout from 26 weeks to 5 weeks; batch watcher from 11 weeks to 4 weeks.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/syensqo/ [S:ind-ss-syensqo]

#### Nutrien: Digital transformation of agribusiness operations using PI System and Unified Operations Center
- Industry: Chemicals / fertiliser (ind.chemicals). Products: AVEVA PI System, AVEVA UOC. Region: North America. Year: not stated.
- Summary: A central monitoring centre for nitrogen production.
- Challenge: Integrate site data for engineering-operations collaboration.
- Solution: PI data in UOC.
- Outcomes: qualitative only.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/nutrien/ [S:ind-ss-nutrien]

#### Kellogg's: Improving product consistency and maintenance strategy with AVEVA PI System
- Industry: Food & beverage (ind.food-bev). Products: AVEVA PI System. Region: Valls, Spain. Year: not stated.
- Summary: Weight control and OEE improvement.
- Challenge: Manual weight data; non-conformity.
- Solution: PI for variability and reliability.
- Outcomes: "Reduced CCP by 64%, product failures by 73%, and minor line stops by 67%"; "Achieved CPG best-in-class rating for OEE of 80%"; "Increased mean time between failures rate by 180%".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/kelloggs/ [S:ind-ss-kelloggs]

#### Tyson Foods: Reducing waste and improving yield with AVEVA PI System
- Industry: Food & beverage (ind.food-bev). Products: AVEVA PI System (via FactoryTalk Historian). Region: not stated. Year: not stated.
- Summary: Jimmy Dean sausage plant line monitoring.
- Challenge: Waste; undetected line flaws.
- Solution: PI monitoring of weight, uptime and yield.
- Outcomes: waste and giveaway reduced by 50%; 0.1% yield improvement paid back in six months (the page metadata says ".01%", which conflicts); 8 worker hours saved per day.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/tyson-foods/ [S:ind-ss-tyson]

#### Deschutes Brewery: Using AVEVA PI System to apply machine learning and advanced analytics to brewery data
- Industry: Food & beverage (ind.food-bev). Products: AVEVA PI System. Region: not stated (US brewery). Year: not stated.
- Summary: ML on fermentation data.
- Challenge: Fermenter temperature spikes; phase-transition timing.
- Solution: Analytics on PI data.
- Outcomes: production time reduced by "up to 72 hours" per batch; "$8M" in capital upgrades eliminated.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/deschutes-brewery/ [S:ind-ss-deschutes]

#### Cargill: Closing the digital gap at smaller facilities
- Industry: Food & agribusiness (ind.food-bev, ind.marine-transport). Products: PI Server, AVEVA Edge Data Store, OPC UA and Modbus adapters. Region: global (200+ plants). Year: not stated.
- Summary: Edge collection for small sites and ships feeding a central PI Server.
- Challenge: Small sites lack IT for a PI Server; ships have intermittent connectivity.
- Solution: Edge Data Store store-and-forward; JSON lab-robot data.
- Outcomes: qualitative only (no figures).
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/cargill/ [S:ind-ss-cargill]

#### UC Davis (Robert Mondavi Institute): UC Davis uncorks sustainable improvements with AVEVA PI System
- Industry: Food & beverage research (ind.food-bev). Products: AVEVA PI System, PI Vision, System Platform. Region: not stated (California). Year: not stated.
- Summary: Real-time fermentation monitoring.
- Challenge: Poor visibility into fermentation.
- Solution: PI as the research historian.
- Outcomes: qualitative (wine quality). The 62% gas reduction is a campus figure.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/uc-davis-winery/ [S:ind-ss-uc-davis-winery]

#### Klabin: AVEVA PI System gives Klabin a bird's-eye view into paper production
- Industry: Pulp & paper (ind.pulp-paper). Products: AVEVA PI System, PI Vision (integrator IHM). Region: Brazil. Year: not stated.
- Summary: Real-time pulp production models with 85,000 variables.
- Challenge: 25,000+ assets; hours to evaluate changes.
- Solution: Integrated digital models in PI.
- Outcomes: production up 3,400 air-dry tons per year; maintenance costs cut by nearly $10 million.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/klabin/ [S:ind-ss-klabin]

#### Ence: More efficient operations for more sustainable outcomes
- Industry: Pulp & paper and biomass power (ind.pulp-paper). Products: PI Server (AF, event frames, notifications), PI Vision, CONNECT; EcoStruxure APC. Region: Spain. Year: not stated (AVEVA relationship since 2015).
- Summary: Control-loop monitoring and water planning.
- Challenge: Process variability; water-shortage downtime.
- Solution: AF and EF loop diagnostics; deep-learning river-flow prediction.
- Outcomes: 15% emissions reduction; 1,500 MWh saved per pulp mill (the body says "1,500 MWs per hour per year", which is inconsistent); summer downtime from 15 days to zero; €150,000 per year biomass savings; nearly 900 manual interventions avoided per day.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/ence/ [S:ind-ss-ence]

#### UC Davis (campus): UC Davis on track to be carbon neutral by 2025
- Industry: Buildings / campus (ind.buildings). Products: AVEVA PI System, PI Vision, System Platform. Region: not stated (California). Year: not stated.
- Summary: Energy optimisation across 1,000 buildings.
- Challenge: Diverse buildings; aging infrastructure; self-sustaining budget.
- Solution: Chilled water optimisation; HVAC scheduling; steam to low-temperature hot water.
- Outcomes: "46% reduction in energy-use intensity since 2009, a cost savings of $15 million"; "62% reduction in gas usage"; "Expected annual savings of $150,000"; "Projected savings of $197M over 60 years".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/uc-davis/ [S:ind-ss-uc-davis]

#### University of Maryland, College Park: Reducing electrical outages and saving up to 30% of energy expenses with AVEVA PI System
- Industry: Buildings / campus (ind.buildings). Products: AVEVA PI System (with Data Systems Analysts, Inc.). Region: College Park, Maryland. Year: not stated.
- Summary: Centralised electrical distribution data.
- Challenge: Disparate, isolated systems.
- Solution: PI-centred visibility.
- Outcomes: savings of 30% of HVAC energy expenses (the headline says "up to 30%" of energy expenses); significantly reduced outage downtime.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/university-of-maryland-college-park/ [S:ind-ss-umd]

#### Toyota Motor Europe: Dreams of a green new world with AVEVA PI System
- Industry: Discrete manufacturing / automotive (ind.manufacturing). Products: AVEVA PI System. Region: Europe. Year: not stated.
- Summary: A centralised energy monitoring system (EnMS) across plants.
- Challenge: No standard data model; no benchmarks.
- Solution: Standardised PI data models.
- Outcomes: "less than one minute to validate and share data".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/toyota-motor-europe/ [S:ind-ss-toyota]

#### Michelin: Embracing a data-driven approach to energy management
- Industry: Discrete manufacturing / tyres (ind.manufacturing). Products: AVEVA PI System. Region: global (15 sites). Year: not stated.
- Summary: Standardised energy data shared between plants.
- Challenge: Varied sources; large volumes.
- Solution: PI to contextualise energy consumption.
- Outcomes: "Up to 10% savings in the initial few months"; energy reduced "by as much as 16%"; quote: "we save from 3% to 16% in energy consumption".
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/michelin/ [S:ind-ss-michelin]

#### CSL Group: Chartering a course to net zero
- Industry: Marine / shipping (ind.marine-transport). Products: PI Data Infrastructure, PI Server, PI Vision, CONNECT, Advanced Analytics, Edge Data Store. Region: global (Canadian roots). Year: not stated (biofuel trials from 2019).
- Summary: Ship-to-shore data from 40+ vessels.
- Challenge: Target of 35% CO2 cut by 2030; limited bandwidth; crew turnover.
- Solution: Edge Data Store with prioritised satellite transfer; voyage and weather context.
- Outcomes: 8,233 mt CO2e avoided across 11 vessels (third-party verified); 29% carbon intensity reduction; over 300 anomaly detections; up to 50% upload bandwidth reduction; 14,000 tons of marine gas oil substituted.
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/csl-group/ [S:ind-ss-csl]

#### Delfi ILS Solutions: AVEVA PI System helps virtually train maritime crews
- Industry: Marine (ind.marine-transport). Products: AVEVA PI System; ShipView. Region: not stated. Year: not stated.
- Summary: 3D crew training fed by live ship data.
- Challenge: Varied fleet; manuals insufficient.
- Solution: ShipView on PI.
- Outcomes: qualitative ("We reduce the training cost at scale").
- Reported by: AVEVA.
- URL: https://www.aveva.com/en/perspectives/success-stories/aveva-pi-system-helps-virtually-train-maritime-crews/ [S:ind-ss-delfi]

**Checked but NOT PI System stories (do not use as PI examples)**
- Nestlé Waverly (AVEVA Historian, CONNECT, Advanced Analytics) [S:ind-ss-nestle]
- General Mills (System Platform) [S:ind-ss-general-mills]
- Henkel (MES, System Platform) [S:ind-ss-henkel]
- P&G (System Platform) [S:ind-ss-pg]
- Barghest Building Performance (System Platform) [S:ind-ss-barghest]
- City of Bremen (InTouch, Historian) [S:ind-ss-bremen]

These were also checked and found not to be PI System stories, but were not added to the sources file: BASF (XR training), Eastman (E3D/AIM), Ascend (Mobile Operator), Talison Lithium (Production Management, Historian), Lonmin (System Platform), Gwinnett County (Operations Control). Agropur mentions a PI investment across 23 facilities, but its story is about MES and CONNECT (all read via the AVEVA success-story pages).

**Other figures available only from the OSIsoft company overview (reported by OSIsoft; no case page read)**
- Syncrude: "saves $20 million a year through predictive maintenance"
- China National Bluestar: one site saves $200,000 in steam costs
- IBM Burlington fab: $10 million a year water and energy savings
- Maynilad: customers from 6 million to 9 million
- Novartis: 25 manufacturing sites
- Halifax: 38 million litres of water a day saved
[S:ind-osisoft-overview] (read)

---

### Terms (cross-industry)
- Success story: a vendor-published customer case. Outcomes are as reported by AVEVA, not independently audited [S:ind-aveva-ss-index]
- PI World / AVEVA World: the OSIsoft/AVEVA user conference where customers present PI deployments [S:ind-pres-ls-2019]
- Edge Data Store: the AVEVA edge component used where a full PI Server is not justified [S:ind-ss-cargill]
