/**
 * Deployment Planner: turns a company profile into a PI System architecture. Every rule cites its
 * source. `basis: 'stated'` means a source says it directly; `'inferred'` means we combined
 * stated rules (research/adm.md adm.deployment-patterns, research/ops2.md ops2.sizing,
 * research/ind.md deployment planner data).
 */
import type { Industry } from '@/core/schemas/common';
import { diskEstimates, tableSize } from '@/core/tools/sizing';
import { nearestComparables, type Comparable } from './comparables';

export type CompanySize = 'small' | 'mid' | 'large';
export type SecurityModel = 'flat' | 'dmz' | 'one-way';
export type Zone = 'edge' | 'control' | 'dmz' | 'business' | 'cloud';

export const ZONE_LABELS: Record<Zone, string> = {
  edge: 'Remote edge sites',
  control: 'Control network (OT)',
  dmz: 'DMZ',
  business: 'Business network (IT)',
  cloud: 'Cloud',
};

export interface PlannerInput {
  industry: Industry;
  size: CompanySize;
  /** sites with their own PI Server */
  sites: number;
  /** small unmanned sites that only need edge collection */
  edgeSites: number;
  tagsPerSite: number;
  assetsPerSite: number;
  highAvailability: boolean;
  security: SecurityModel;
  cloud: boolean;
}

export interface Claim {
  text: string;
  sources: string[];
  basis: 'stated' | 'inferred';
}

export interface ServerRole {
  name: string;
  hosts: string[];
  zone: Zone;
  runs: string;
  why: Claim;
}

export interface Plan {
  tier: 'single-node' | 'separated' | 'distributed';
  tierTitle: string;
  tierWhy: Claim[];
  servers: ServerRole[];
  collection: Claim[];
  tags: {
    perSite: number;
    total: number;
    centralPoints: number;
    siteArchiveMb: number;
    centralArchiveMb: number | null;
    disk: { label: string; mb: number }[];
    comparables: Comparable[];
    warnings: Claim[];
  };
  security: Claim[];
  compliance: Claim[];
  rollout: { title: string; steps: Claim[] }[];
  diagram: string;
}

export const SIZE_DEFAULTS: Record<CompanySize, Omit<PlannerInput, 'industry' | 'size'>> = {
  small: {
    sites: 1,
    edgeSites: 0,
    tagsPerSite: 5_000,
    assetsPerSite: 500,
    highAvailability: false,
    security: 'dmz',
    cloud: false,
  },
  mid: {
    sites: 3,
    edgeSites: 2,
    tagsPerSite: 25_000,
    assetsPerSite: 3_000,
    highAvailability: true,
    security: 'dmz',
    cloud: false,
  },
  large: {
    sites: 12,
    edgeSites: 20,
    tagsPerSite: 60_000,
    assetsPerSite: 8_000,
    highAvailability: true,
    security: 'dmz',
    cloud: true,
  },
};

const S = {
  growth: 'adm-uc19-architecting-zhimanov',
  arch2024: 'adm-arch-planning-workbook-2024',
  arch2025: 'ops2-arch-workbook-2025',
  vining: 'ops2-rs2012-vining-arch',
  afBatke: 'adm-uc15-af-batke',
  biggins: 'adm-uc23-security-biggins',
  collectives: 'adm-pisquare-piartool-collectives',
  rollout: 'adm-us19-af-rollout-kwan',
  afBatke19: 'adm-uc19-af-batke',
  waterfall: 'adm-waterfall-aveva-pi',
  sick: 'adm-uc23-da-performance-sick',
  adoption: 'adm-implementation-adoption',
  basics: 'adm-pi-system-basics-2017',
  iec: 'adm-iec-62443-background',
  nerc: 'adm-td2014-nerc-cip-ids',
  forescout: 'adm-forescout-cip-005-5',
  hmiWp: 'adm-aveva-hmi-scada-security-wp',
  eds: 'ops2-eds-datasheet',
  cargill: 'ind-ss-cargill',
  connectAgent: 'ops2-pidi-service-description',
  audit: 'ops2-osipi-blog-audit',
  afAudit: 'ops2-pisquare-af-audit-trail',
  auditReporter: 'ops2-audit-reporter-datasheet',
  tipsTrenches: 'da-uc2011-tips-trenches',
} as const;

const stated = (text: string, ...sources: string[]): Claim => ({ text, sources, basis: 'stated' });
const inferred = (text: string, ...sources: string[]): Claim => ({
  text,
  sources,
  basis: 'inferred',
});

/** Every source id the planner can cite, for validation. */
export const PLANNER_SOURCES: string[] = Object.values(S);

const hostList = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`);

function tierFor(i: PlannerInput): Plan['tier'] {
  const small = i.tagsPerSite < 25_000 && i.assetsPerSite < 10_000;
  if (i.sites <= 1 && small && !i.highAvailability) return 'single-node';
  if (i.sites <= 1) return 'separated';
  return 'distributed';
}

/** Safe text for a Mermaid label. */
const lbl = (s: string) => s.replace(/["[\]{}()<>|]/g, ' ');

function diagram(servers: ServerRole[], i: PlannerInput): string {
  const lines = ['flowchart TB'];
  const ids = new Map<string, string>();
  (Object.keys(ZONE_LABELS) as Zone[]).forEach((z) => {
    const inZone = servers.filter((s) => s.zone === z);
    if (!inZone.length) return;
    lines.push(`  subgraph ${z}["${lbl(ZONE_LABELS[z])}"]`);
    inZone.forEach((s, n) => {
      const id = `${z}${n}`;
      ids.set(s.name, id);
      const count = s.hosts.length > 1 ? ` x${s.hosts.length}` : '';
      lines.push(`    ${id}["${lbl(s.name)}${count}"]`);
    });
    lines.push('  end');
  });
  const link = (a: string, b: string, label: string) => {
    const x = ids.get(a);
    const y = ids.get(b);
    if (x && y) lines.push(`  ${x} -->|${lbl(label)}| ${y}`);
  };
  const siteDa = servers.find((s) => s.name.includes('Data Archive') && s.zone === 'control')?.name;
  const replica = servers.find(
    (s) => s.name.includes('Data Archive') && s.zone !== 'control',
  )?.name;
  link('Edge Data Store', siteDa ?? '', 'OMF over HTTPS');
  link('Interface and connector nodes', siteDa ?? '', 'buffered');
  if (replica && siteDa)
    link(siteDa, replica, i.security === 'one-way' ? 'one-way gateway' : 'PI to PI');
  const users = replica ?? siteDa;
  link(users ?? '', 'PI AF and Analysis', 'AF SDK');
  link('PI AF and Analysis', 'SQL Server for AF', 'SQL');
  link(users ?? '', 'PI Vision and PI Web API', 'data');
  link(users ?? '', 'PI to CONNECT Agent', 'data');
  link('PI to CONNECT Agent', 'AVEVA CONNECT', 'HTTPS outbound');
  return lines.join('\n');
}

export function makePlan(i: PlannerInput): Plan {
  const tier = tierFor(i);
  const ha = i.highAvailability;
  const multi = tier === 'distributed';
  const segregated = i.security !== 'flat';
  const userZone: Zone = segregated ? 'business' : 'control';

  const tierTitle = {
    'single-node': 'Single PI Server node',
    separated: 'Separate Data Archive, AF and SQL servers',
    distributed: 'Site PI Servers with central aggregation',
  }[tier];

  const tierWhy: Claim[] = [];
  if (tier === 'single-node') {
    tierWhy.push(
      stated(
        'Small systems (under 10,000 assets and 25,000 tags) can put PI, AF and SQL on one node (2012 guidance).',
        S.vining,
      ),
    );
    tierWhy.push(
      stated(
        'SQL Server Express is limited to one physical CPU and 1 GB of RAM, so use a full SQL Server edition for production.',
        S.arch2025,
        S.afBatke,
      ),
    );
  } else {
    tierWhy.push(
      stated('Larger systems need two nodes at least, with PI and SQL separate.', S.vining),
    );
    tierWhy.push(
      stated(
        'AVEVA recommends installing SQL Server on a different computer from PI Server.',
        S.arch2025,
      ),
    );
  }
  if (ha)
    tierWhy.push(
      stated(
        'Separate AF from the Data Archive when AF is highly available or uses several PI Servers.',
        S.arch2024,
      ),
    );
  if (multi) {
    tierWhy.push(
      inferred(
        'Multi-site companies in the sources run a PI Server per site plus central aggregation, with templates owned centrally.',
        S.cargill,
        S.rollout,
        S.growth,
      ),
    );
  }
  tierWhy.push(
    stated(
      'There is no perfect architecture: plan the target in advance and expand as needed.',
      S.growth,
    ),
  );

  const servers: ServerRole[] = [];
  const sitePrefix = multi ? 'S1-' : '';
  if (i.edgeSites > 0) {
    servers.push({
      name: 'Edge Data Store',
      hosts: [`${i.edgeSites} small gateways`],
      zone: 'edge',
      runs: 'AVEVA Edge Data Store with OPC UA or Modbus TCP collection, forwarding to the site PI Server.',
      why: stated(
        'Small sites with a few hundred data streams can use Edge Data Store forwarding to a central PI Server; it runs on small Linux or Windows hardware.',
        S.cargill,
        S.eds,
      ),
    });
  }
  servers.push({
    name: 'Interface and connector nodes',
    hosts: hostList(`${sitePrefix}PIINT`, ha ? 2 : 1),
    zone: 'control',
    runs: 'PI Interfaces or PI Connectors next to the control systems, with the PI Buffer Subsystem.',
    why: ha
      ? stated(
          "A failover interface pair is the first step on OSIsoft's HA growth path; the PI Buffer Subsystem sends data to every collective member.",
          S.growth,
          S.collectives,
        )
      : stated(
          'Buffer interfaces so data survives a server outage. There is no hardware sizing tool for interface machines.',
          S.collectives,
          S.adoption,
        ),
  });
  if (tier === 'single-node') {
    servers.push({
      name: 'PI Server',
      hosts: ['PISRV01'],
      zone: 'control',
      runs: 'PI Data Archive, PI AF Server, PI Analysis Service and SQL Server for AF on one machine.',
      why: tierWhy[0] as Claim,
    });
  } else {
    servers.push({
      name: multi ? 'Site PI Data Archive' : 'PI Data Archive',
      hosts: hostList(`${sitePrefix}PISRV`, ha ? 2 : 1),
      zone: 'control',
      runs: ha
        ? 'A PI Data Archive collective: one primary and one secondary, identical in hardware and software.'
        : 'PI Data Archive.',
      why: ha
        ? stated(
            'A collective removes the single point of failure; members should be identical and can be in different data centres.',
            S.tipsTrenches,
            S.adoption,
          )
        : stated(
            'Separate the Data Archive from AF and SQL once the system outgrows one node.',
            S.vining,
          ),
    });
  }
  if (segregated) {
    servers.push({
      name: multi ? 'Central PI Data Archive' : 'Business PI Data Archive',
      hosts: hostList(multi ? 'HQ-PISRV' : 'PISRV-IT', ha ? 2 : 1),
      zone: multi ? 'business' : 'dmz',
      runs:
        i.security === 'one-way'
          ? 'A replica Data Archive fed through a unidirectional gateway; users query it, never the control network.'
          : 'A replica Data Archive fed by PI to PI, so only data crosses the boundary and user queries stay outside.',
      why:
        i.security === 'one-way'
          ? stated(
              'One-way gateways can replicate Data Archive and AF to enterprise replicas, which users read and write as normal.',
              S.waterfall,
              S.growth,
            )
          : stated(
              'Security pattern 3: a DMZ with PI to PI carrying data only, so no user queries cross the boundary.',
              S.growth,
            ),
    });
  }
  if (tier !== 'single-node') {
    servers.push({
      name: 'PI AF and Analysis',
      hosts: ha ? ['PIAF01', 'PIAF02', 'PIAN01'] : ['PIAF01'],
      zone: userZone,
      runs: ha
        ? 'Two PI AF Servers behind a network load balancer, plus PI Analysis Service on its own server.'
        : 'PI AF Server and PI Analysis Service.',
      why: ha
        ? stated(
            'For large distributed systems AVEVA recommends two AF Servers behind a load balancer; segregate AF, SQL and Analysis by performance needs.',
            S.arch2024,
            S.afBatke,
          )
        : stated('Hardware should be sized by workload, not AF object count.', S.adoption),
    });
    servers.push({
      name: 'SQL Server for AF',
      hosts: ha ? ['PISQL01', 'PISQL02'] : ['PISQL01'],
      zone: userZone,
      runs: ha
        ? 'SQL Server on separate, redundant computers for the AF database.'
        : 'SQL Server for the AF database.',
      why: stated(
        'Put SQL Server on a separate computer; for HA, on separate redundant computers.',
        S.arch2025,
        S.arch2024,
      ),
    });
  }
  servers.push({
    name: 'PI Vision and PI Web API',
    hosts: ha ? ['PIWEB01', 'PIWEB02'] : ['PIWEB01'],
    zone: segregated && i.industry !== 'power' ? 'dmz' : userZone,
    runs: ha
      ? 'PI Vision and PI Web API on two IIS servers behind a network load balancer.'
      : 'PI Vision and PI Web API on IIS.',
    why:
      i.industry === 'power'
        ? stated(
            'For NERC CIP sites OSIsoft advised keeping web servers and browsing clients out of the DMZ.',
            S.nerc,
          )
        : stated(
            'Security pattern 1 places web-facing PI Vision, Notifications and Web API in a DMZ; pattern 2 adds HA with a load-balanced PI Vision.',
            S.growth,
          ),
  });
  if (i.cloud) {
    servers.push({
      name: 'PI to CONNECT Agent',
      hosts: ['PICON01'],
      zone: userZone,
      runs: 'Sends selected PI Server data to CONNECT data services.',
      why: stated(
        'The PI to CONNECT Agent transfers data from on-premises PI Server to CONNECT data services.',
        S.connectAgent,
      ),
    });
    servers.push({
      name: 'AVEVA CONNECT',
      hosts: ['CONNECT data services'],
      zone: 'cloud',
      runs: 'Cloud copy for sharing with partners, analytics and corporate users.',
      why: stated(
        'Cloud edge devices need a single outbound port and can be routed through the DMZ.',
        S.hmiWp,
      ),
    });
  }

  const collection: Claim[] = [
    stated(
      'AVEVA has over 450 PI Interfaces and over 20 PI Connectors to choose from.',
      S.arch2024,
    ),
    stated(
      'Use the PI Buffer Subsystem on interface nodes so data is held during outages and fanned out to every collective member.',
      S.collectives,
    ),
  ];
  if (ha)
    collection.push(
      stated(
        'Collective members do not replicate time-series data; interfaces send it to each member.',
        S.tipsTrenches,
      ),
    );
  if (i.edgeSites)
    collection.push(
      stated(
        'Edge Data Store has built-in OPC UA and Modbus TCP and integrates natively with PI Server.',
        S.eds,
      ),
    );

  const perSite = Math.max(1, Math.round(i.tagsPerSite));
  const total = perSite * Math.max(1, i.sites);
  const centralPoints = multi && segregated ? total : segregated ? perSite : 0;
  const warnings: Claim[] = [];
  if (Math.max(perSite, centralPoints) > 20_000_000) {
    warnings.push(
      stated(
        'This is beyond the largest Data Archive point count OSIsoft published (20M+); talk to AVEVA before planning on it.',
        S.basics,
      ),
    );
  }
  if (tier === 'single-node' && perSite >= 25_000) {
    warnings.push(stated('At 25,000 tags or more, separate PI and SQL onto two nodes.', S.vining));
  }

  const security: Claim[] = [];
  if (!segregated) {
    security.push(
      inferred(
        'Everything sits on one network. Only acceptable for labs or very small, isolated systems; AVEVA recommends segmenting with firewalls.',
        S.hmiWp,
      ),
    );
  } else {
    security.push(
      stated(
        'Segment the network into zones separated by firewalls, following defence in depth.',
        S.hmiWp,
      ),
    );
    security.push(
      stated(
        'IEC 62443 groups assets into zones by risk; traffic between zones runs through conduits.',
        S.iec,
      ),
    );
    security.push(
      inferred(
        'The PI to PI link (or one-way gateway) between the control-network and business Data Archives is the conduit; data-only or one-way designs meet FR5, restricted data flow.',
        S.growth,
        S.iec,
      ),
    );
  }
  if (i.security === 'one-way')
    security.push(
      stated('Pattern 3+ makes the boundary one-way, "enforced by physics".', S.growth),
    );
  security.push(
    stated(
      'Back up daily off-peak, then copy backups to a separate server, so you can recover from ransomware.',
      S.biggins,
    ),
  );
  security.push(
    stated(
      'Backups, redundant interfaces and HA are not a disaster-recovery plan; run a DR test at least once a year.',
      S.growth,
    ),
  );

  const compliance: Claim[] = [];
  if (i.industry === 'pharma') {
    compliance.push(
      stated(
        'Turn on the Data Archive audit trail with the EnableAudit tuning parameter.',
        S.audit,
      ),
    );
    compliance.push(
      stated(
        'Turn on the AF audit trail with AFDiag /EnableAuditTrail:True; SQL Server Agent must be running.',
        S.afAudit,
      ),
    );
    compliance.push(
      stated(
        'PI Audit Reporter is a web-based audit trail review tool that supports 21 CFR Part 11 compliance.',
        S.auditReporter,
      ),
    );
  }
  if (i.industry === 'power') {
    compliance.push(
      stated(
        'NERC CIP-005 requires all routable connectivity leaving the Electronic Security Perimeter to pass through an identified access point, with all other traffic denied by default.',
        S.forescout,
      ),
    );
    compliance.push(
      stated(
        'OSIsoft recommended PI to PI across the ESP and read-only access where possible.',
        S.nerc,
      ),
    );
  }
  if (!compliance.length && segregated) {
    compliance.push(
      stated(
        'IEC 62443 defines four security levels (SL1 to SL4); pick a target level per zone.',
        S.iec,
      ),
    );
  }

  const rollout: Plan['rollout'] = [
    {
      title: 'Plan',
      steps: [
        stated('Plan the desired architecture in advance, then expand as needed.', S.growth),
        stated(
          'AVEVA sizes new systems with your Customer Success Manager and Account Manager; use this plan as a starting point, not a quote.',
          S.sick,
          S.arch2024,
        ),
        inferred(
          'Agree a tag naming standard and the AF template library before the first interface goes live.',
          'adm-pisquare-valid-tag-names',
          S.afBatke19,
        ),
      ],
    },
    {
      title: multi ? 'Pilot site' : 'Build',
      steps: [
        stated(
          'Start with a single Data Archive and AF, then add failover interfaces, a collective, AF HA, a load-balanced PI Vision and clustered Analysis as needs grow.',
          S.growth,
        ),
      ],
    },
  ];
  if (multi) {
    rollout.push({
      title: 'Roll out to sites',
      steps: [
        stated(
          'Own templates centrally and deploy them to sites with AFExport and AFImport (or AF SDK when deletions must carry over).',
          S.rollout,
          S.afBatke19,
        ),
      ],
    });
  }
  rollout.push({
    title: 'Operate',
    steps: [security[security.length - 2] as Claim, security[security.length - 1] as Claim],
  });

  return {
    tier,
    tierTitle,
    tierWhy,
    servers,
    collection,
    tags: {
      perSite,
      total,
      centralPoints,
      siteArchiveMb: tableSize(perSite),
      centralArchiveMb: centralPoints ? tableSize(centralPoints) : null,
      disk: diskEstimates(Math.max(perSite, centralPoints)),
      comparables: nearestComparables(i.industry, total),
      warnings,
    },
    security,
    compliance,
    rollout,
    diagram: diagram(servers, i),
  };
}
