/**
 * The shared synthetic plant used by every sandbox mockup. "Riverbend Plant" is fictional:
 * a small process site with utilities, feed pumps, tanks, a heat exchanger and a boiler.
 *
 * Everything is deterministic. A point's raw signal is a pure function of time, so any time
 * range can be generated on demand, and the same moment always has the same value.
 */
import { hashString } from '../random/prng';

export type PointType = 'Float32' | 'Float64' | 'Int32' | 'Digital' | 'String';

export interface SimPoint {
  tag: string;
  descriptor: string;
  engunits: string;
  pointtype: PointType;
  pointsource: string;
  digitalset: string;
  span: number;
  zero: number;
  step: boolean;
  excdev: number;
  excmin: number;
  excmax: number;
  compressing: boolean;
  compdev: number;
  compmin: number;
  compmax: number;
  /** scan period in seconds (simulated scan class) */
  scan: number;
  location1: number;
  location4: number;
  instrumenttag: string;
  creationdate: string;
  /** which signal model drives the point */
  profile: Profile;
}

export type Profile =
  | { kind: 'wave'; base: number; amp: number; periodH: number; noise: number; phase?: number }
  | { kind: 'running'; unit: string; on: number; noise: number; amp?: number }
  | { kind: 'state'; unit: string }
  | { kind: 'level'; unit: string; low: number; high: number; periodH: number; noise: number }
  | { kind: 'counter'; ratePerHour: number };

export type AttributeType = 'Double' | 'Int32' | 'String' | 'Digital' | 'Boolean';
export type DataReference = 'PI Point' | 'Formula' | 'Table Lookup' | 'None';

export interface SimAttribute {
  name: string;
  type: AttributeType;
  uom: string;
  dataReference: DataReference;
  /** config string as shown in PI System Explorer */
  configString: string;
  tag?: string;
  /** static value when dataReference is None */
  value?: string | number;
  category: string;
  description: string;
  /** formula variables for the Formula data reference: variable -> attribute name */
  formula?: { expr: string; vars: Record<string, string> };
}

export interface SimElement {
  id: string;
  name: string;
  description: string;
  template: string | null;
  path: string;
  attributes: SimAttribute[];
  children: SimElement[];
}

export interface AttributeTemplate {
  name: string;
  type: AttributeType;
  uom: string;
  dataReference: DataReference;
  /** config string with substitution parameters, e.g. `\\\\%Server%\\RB.%Element%.FLOW` */
  configString: string;
  category: string;
  description: string;
}

export interface SimTemplate {
  name: string;
  description: string;
  baseTemplate: string | null;
  attributes: AttributeTemplate[];
}

export interface DigitalSet {
  name: string;
  states: string[];
}

export interface PlantModel {
  dataServer: string;
  afServer: string;
  database: string;
  root: SimElement;
  templates: SimTemplate[];
  digitalSets: DigitalSet[];
  points: SimPoint[];
}

export const DATA_SERVER = 'PISRV01';
export const AF_SERVER = 'AFSRV01';
export const AF_DATABASE = 'Riverbend';

export const DIGITAL_SETS: DigitalSet[] = [
  { name: 'PumpStatus', states: ['Stopped', 'Running', 'Tripped'] },
  { name: 'BurnerState', states: ['Off', 'Purge', 'Low Fire', 'High Fire'] },
];

/* ---------------------------------------------------------------- signal model */

const HOUR = 3_600_000;

/** Deterministic noise in [-1, 1] for a key and a time bucket. */
function noise(key: string, bucket: number): number {
  return (hashString(`${key}|${bucket}`) / 0xffffffff) * 2 - 1;
}

/** Smooth noise: interpolates between hash values every `periodS` seconds. */
function smoothNoise(key: string, t: number, periodS: number): number {
  const x = t / (periodS * 1000);
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  return noise(key, i) * (1 - s) + noise(key, i + 1) * s;
}

/**
 * Pump/unit state at time t: 0 Stopped, 1 Running, 2 Tripped. Each unit runs most of the time,
 * with a planned stop some days and an occasional trip that clears after 20–50 minutes.
 */
export function unitState(unit: string, t: number): 0 | 1 | 2 {
  const slot = Math.floor(t / (4 * HOUR)); // 4-hour slots
  const h = hashString(`${unit}|slot|${slot}`) / 0xffffffff;
  const offset = t - slot * 4 * HOUR;
  if (h < 0.08) {
    // trip somewhere in the slot
    const start = ((hashString(`${unit}|trip|${slot}`) % 180) + 30) * 60_000;
    const dur = ((hashString(`${unit}|tripdur|${slot}`) % 30) + 20) * 60_000;
    if (offset >= start && offset < start + dur) return 2;
  } else if (h < 0.14) {
    const start = ((hashString(`${unit}|stop|${slot}`) % 120) + 20) * 60_000;
    if (offset >= start && offset < start + 90 * 60_000) return 0;
  }
  return 1;
}

/** Burner state for the boiler: follows a daily demand pattern. */
function burnerState(t: number): number {
  const s = unitState('B100', t);
  if (s !== 1) return 0;
  const demand = 0.5 + 0.4 * Math.sin((2 * Math.PI * (t / HOUR - 6)) / 24);
  return demand > 0.75 ? 3 : demand > 0.2 ? 2 : 1;
}

export function rawValue(p: SimPoint, t: number): number {
  const pr = p.profile;
  switch (pr.kind) {
    case 'wave': {
      const phase = pr.phase ?? 0;
      return (
        pr.base +
        pr.amp * Math.sin((2 * Math.PI * (t / HOUR + phase)) / pr.periodH) +
        pr.noise * (0.7 * smoothNoise(p.tag, t, 120) + 0.3 * noise(p.tag, Math.floor(t / 1000)))
      );
    }
    case 'running': {
      const s = unitState(pr.unit, t);
      if (s !== 1)
        return Math.max(0, pr.noise * 0.05 * Math.abs(noise(p.tag, Math.floor(t / 1000))));
      const wobble = (pr.amp ?? 0) * Math.sin((2 * Math.PI * (t / HOUR)) / 24);
      return (
        pr.on +
        wobble +
        pr.noise * (0.6 * smoothNoise(p.tag, t, 90) + 0.4 * noise(p.tag, Math.floor(t / 1000)))
      );
    }
    case 'state':
      return pr.unit === 'B100' ? burnerState(t) : unitState(pr.unit, t);
    case 'level': {
      // Fill/draw cycle shaped by whether the outlet pump runs.
      const base =
        (pr.low + pr.high) / 2 +
        ((pr.high - pr.low) / 2) * Math.sin((2 * Math.PI * (t / HOUR)) / pr.periodH);
      const pumpOff = unitState(pr.unit, t) !== 1 ? 6 : 0;
      return Math.min(100, base + pumpOff + pr.noise * smoothNoise(p.tag, t, 300));
    }
    case 'counter': {
      // Production counter: grows at a rate, resets at midnight UTC.
      const day = Math.floor(t / (24 * HOUR)) * 24 * HOUR;
      return Math.floor(((t - day) / HOUR) * pr.ratePerHour);
    }
  }
}

/* ---------------------------------------------------------------- model */

interface PointSpec {
  suffix: string;
  descriptor: string;
  engunits: string;
  pointtype?: PointType;
  digitalset?: string;
  span: number;
  zero?: number;
  excdev: number;
  compdev: number;
  scan?: number;
  step?: boolean;
  profile: Profile;
}

function makePoint(prefix: string, spec: PointSpec, index: number): SimPoint {
  const digital = spec.pointtype === 'Digital';
  return {
    tag: `RB.${prefix}.${spec.suffix}`,
    descriptor: spec.descriptor,
    engunits: spec.engunits,
    pointtype: spec.pointtype ?? 'Float32',
    pointsource: 'OPC',
    digitalset: spec.digitalset ?? '',
    span: spec.span,
    zero: spec.zero ?? 0,
    step: spec.step ?? digital,
    excdev: spec.excdev,
    excmin: 0,
    excmax: 600,
    compressing: true,
    compdev: spec.compdev,
    compmin: 0,
    compmax: 28800,
    scan: spec.scan ?? (digital ? 1 : 5),
    location1: 1,
    location4: digital ? 1 : spec.scan && spec.scan > 5 ? 3 : 2,
    instrumenttag: `ns=2;s=Riverbend.${prefix}.${spec.suffix}`,
    creationdate: `2024-0${(index % 9) + 1}-1${index % 9} 09:${String((index * 7) % 60).padStart(2, '0')}:00`,
    profile: spec.profile,
  };
}

function pumpSpecs(unit: string, flow: number): PointSpec[] {
  return [
    {
      suffix: 'STATUS',
      descriptor: `${unit} run status`,
      engunits: '',
      pointtype: 'Digital',
      digitalset: 'PumpStatus',
      span: 2,
      excdev: 0,
      compdev: 0,
      profile: { kind: 'state', unit },
    },
    {
      suffix: 'FLOW',
      descriptor: `${unit} discharge flow`,
      engunits: 'm3/h',
      span: 200,
      excdev: 0.5,
      compdev: 1,
      profile: { kind: 'running', unit, on: flow, noise: 2.5, amp: 8 },
    },
    {
      suffix: 'PRESS',
      descriptor: `${unit} discharge pressure`,
      engunits: 'bar',
      span: 16,
      excdev: 0.02,
      compdev: 0.05,
      profile: { kind: 'running', unit, on: 6.2, noise: 0.15, amp: 0.3 },
    },
    {
      suffix: 'AMPS',
      descriptor: `${unit} motor current`,
      engunits: 'A',
      span: 120,
      excdev: 0.2,
      compdev: 0.5,
      profile: { kind: 'running', unit, on: 48 + flow / 10, noise: 1.2, amp: 2 },
    },
    {
      suffix: 'VIB',
      descriptor: `${unit} bearing vibration`,
      engunits: 'mm/s',
      span: 20,
      excdev: 0.05,
      compdev: 0.1,
      profile: { kind: 'running', unit, on: 2.4, noise: 0.35 },
    },
    {
      suffix: 'BRG.TEMP',
      descriptor: `${unit} bearing temperature`,
      engunits: 'degC',
      span: 150,
      excdev: 0.2,
      compdev: 0.5,
      scan: 10,
      profile: { kind: 'running', unit, on: 61, noise: 0.8, amp: 3 },
    },
  ];
}

function tankSpecs(unit: string, pump: string, phase: number): PointSpec[] {
  return [
    {
      suffix: 'LEVEL',
      descriptor: `${unit} level`,
      engunits: '%',
      span: 100,
      excdev: 0.1,
      compdev: 0.25,
      profile: { kind: 'level', unit: pump, low: 35, high: 78, periodH: 6 + phase, noise: 1.5 },
    },
    {
      suffix: 'TEMP',
      descriptor: `${unit} contents temperature`,
      engunits: 'degC',
      span: 120,
      excdev: 0.1,
      compdev: 0.3,
      scan: 10,
      profile: { kind: 'wave', base: 42 + phase, amp: 4, periodH: 24, noise: 0.4, phase },
    },
  ];
}

interface UnitDef {
  id: string;
  name: string;
  description: string;
  template: string;
  specs: PointSpec[];
  statics: {
    name: string;
    type: AttributeType;
    uom: string;
    value: string | number;
    category: string;
    description: string;
  }[];
}

const PUMP_STATIC = (rated: number, model: string) => [
  {
    name: 'Manufacturer',
    type: 'String' as const,
    uom: '',
    value: 'Generic Pumps Ltd (fictional)',
    category: 'Nameplate',
    description: 'Equipment manufacturer',
  },
  {
    name: 'Model',
    type: 'String' as const,
    uom: '',
    value: model,
    category: 'Nameplate',
    description: 'Model number',
  },
  {
    name: 'Rated Flow',
    type: 'Double' as const,
    uom: 'm3/h',
    value: rated,
    category: 'Nameplate',
    description: 'Design flow',
  },
  {
    name: 'High Vibration Limit',
    type: 'Double' as const,
    uom: 'mm/s',
    value: 7.1,
    category: 'Limits',
    description: 'Alarm limit for bearing vibration',
  },
];

const TANK_STATIC = (capacity: number) => [
  {
    name: 'Capacity',
    type: 'Double' as const,
    uom: 'm3',
    value: capacity,
    category: 'Nameplate',
    description: 'Working volume',
  },
  {
    name: 'High Level Limit',
    type: 'Double' as const,
    uom: '%',
    value: 85,
    category: 'Limits',
    description: 'High level alarm',
  },
  {
    name: 'Low Level Limit',
    type: 'Double' as const,
    uom: '%',
    value: 15,
    category: 'Limits',
    description: 'Low level alarm',
  },
];

const UNITS: { area: string; areaDescription: string; units: UnitDef[] }[] = [
  {
    area: 'Process',
    areaDescription: 'Feed, storage and heating',
    units: [
      {
        id: 'P101',
        name: 'P-101',
        description: 'Feed pump A',
        template: 'Pump',
        specs: pumpSpecs('P101', 112),
        statics: PUMP_STATIC(140, 'GP-150'),
      },
      {
        id: 'P102',
        name: 'P-102',
        description: 'Feed pump B',
        template: 'Pump',
        specs: pumpSpecs('P102', 96),
        statics: PUMP_STATIC(140, 'GP-150'),
      },
      {
        id: 'P103',
        name: 'P-103',
        description: 'Transfer pump',
        template: 'Pump',
        specs: pumpSpecs('P103', 64),
        statics: PUMP_STATIC(90, 'GP-100'),
      },
      {
        id: 'T101',
        name: 'T-101',
        description: 'Feed tank',
        template: 'Tank',
        specs: tankSpecs('T101', 'P101', 0),
        statics: TANK_STATIC(250),
      },
      {
        id: 'T102',
        name: 'T-102',
        description: 'Product tank',
        template: 'Tank',
        specs: tankSpecs('T102', 'P103', 2),
        statics: TANK_STATIC(400),
      },
      {
        id: 'E101',
        name: 'E-101',
        description: 'Feed preheater',
        template: 'Heat Exchanger',
        specs: [
          {
            suffix: 'TIN',
            descriptor: 'E-101 cold side inlet temperature',
            engunits: 'degC',
            span: 150,
            excdev: 0.1,
            compdev: 0.3,
            profile: { kind: 'wave', base: 24, amp: 5, periodH: 24, noise: 0.3 },
          },
          {
            suffix: 'TOUT',
            descriptor: 'E-101 cold side outlet temperature',
            engunits: 'degC',
            span: 150,
            excdev: 0.1,
            compdev: 0.3,
            profile: { kind: 'wave', base: 71, amp: 3, periodH: 24, noise: 0.5, phase: 1 },
          },
          {
            suffix: 'DP',
            descriptor: 'E-101 differential pressure',
            engunits: 'kPa',
            span: 100,
            excdev: 0.1,
            compdev: 0.2,
            profile: { kind: 'wave', base: 18, amp: 1.5, periodH: 72, noise: 0.4 },
          },
        ],
        statics: [
          {
            name: 'Design Duty',
            type: 'Double',
            uom: 'kW',
            value: 850,
            category: 'Nameplate',
            description: 'Design heat duty',
          },
        ],
      },
    ],
  },
  {
    area: 'Utilities',
    areaDescription: 'Steam and compressed air',
    units: [
      {
        id: 'B100',
        name: 'B-100',
        description: 'Package boiler',
        template: 'Boiler',
        specs: [
          {
            suffix: 'BURNER',
            descriptor: 'B-100 burner state',
            engunits: '',
            pointtype: 'Digital',
            digitalset: 'BurnerState',
            span: 3,
            excdev: 0,
            compdev: 0,
            profile: { kind: 'state', unit: 'B100' },
          },
          {
            suffix: 'STEAM.FLOW',
            descriptor: 'B-100 steam flow',
            engunits: 't/h',
            span: 20,
            excdev: 0.05,
            compdev: 0.1,
            profile: { kind: 'running', unit: 'B100', on: 11.5, noise: 0.4, amp: 3 },
          },
          {
            suffix: 'STEAM.PRESS',
            descriptor: 'B-100 steam header pressure',
            engunits: 'bar',
            span: 20,
            excdev: 0.02,
            compdev: 0.05,
            profile: { kind: 'running', unit: 'B100', on: 10.2, noise: 0.12 },
          },
          {
            suffix: 'FUEL.FLOW',
            descriptor: 'B-100 natural gas flow',
            engunits: 'Nm3/h',
            span: 1500,
            excdev: 2,
            compdev: 5,
            profile: { kind: 'running', unit: 'B100', on: 880, noise: 25, amp: 230 },
          },
          {
            suffix: 'STACK.TEMP',
            descriptor: 'B-100 stack temperature',
            engunits: 'degC',
            span: 400,
            excdev: 0.5,
            compdev: 1,
            scan: 10,
            profile: { kind: 'running', unit: 'B100', on: 182, noise: 3, amp: 12 },
          },
        ],
        statics: [
          {
            name: 'Rated Steam',
            type: 'Double',
            uom: 't/h',
            value: 18,
            category: 'Nameplate',
            description: 'Maximum continuous rating',
          },
        ],
      },
      {
        id: 'K100',
        name: 'K-100',
        description: 'Instrument air compressor',
        template: 'Compressor',
        specs: [
          {
            suffix: 'STATUS',
            descriptor: 'K-100 run status',
            engunits: '',
            pointtype: 'Digital',
            digitalset: 'PumpStatus',
            span: 2,
            excdev: 0,
            compdev: 0,
            profile: { kind: 'state', unit: 'K100' },
          },
          {
            suffix: 'PRESS',
            descriptor: 'K-100 air receiver pressure',
            engunits: 'bar',
            span: 12,
            excdev: 0.02,
            compdev: 0.05,
            profile: { kind: 'running', unit: 'K100', on: 7.4, noise: 0.2, amp: 0.2 },
          },
          {
            suffix: 'KW',
            descriptor: 'K-100 power',
            engunits: 'kW',
            span: 150,
            excdev: 0.5,
            compdev: 1,
            profile: { kind: 'running', unit: 'K100', on: 74, noise: 4, amp: 6 },
          },
        ],
        statics: [
          {
            name: 'Rated Power',
            type: 'Double',
            uom: 'kW',
            value: 90,
            category: 'Nameplate',
            description: 'Motor rating',
          },
        ],
      },
    ],
  },
];

const SITE_POINTS: PointSpec[] = [
  {
    suffix: 'AMBIENT.TEMP',
    descriptor: 'Site ambient temperature',
    engunits: 'degC',
    span: 60,
    zero: -20,
    excdev: 0.1,
    compdev: 0.2,
    scan: 30,
    profile: { kind: 'wave', base: 14, amp: 7, periodH: 24, noise: 0.5, phase: -3 },
  },
  {
    suffix: 'PRODUCTION.COUNT',
    descriptor: 'Batches produced today',
    engunits: 'count',
    pointtype: 'Int32',
    span: 500,
    excdev: 0,
    compdev: 0,
    scan: 60,
    step: true,
    profile: { kind: 'counter', ratePerHour: 9 },
  },
];

/** AF templates, written the way PI System Explorer shows them. */
function templates(): SimTemplate[] {
  const pi = (suffix: string): string => `\\\\%Server%\\RB.%Element%.${suffix}`;
  const tpl = (
    name: string,
    description: string,
    specs: PointSpec[],
    statics: UnitDef['statics'],
  ): SimTemplate => ({
    name,
    description,
    baseTemplate: 'Equipment',
    attributes: [
      ...specs.map((s) => ({
        name: attributeName(s),
        type: (s.pointtype === 'Digital'
          ? 'Digital'
          : s.pointtype === 'Int32'
            ? 'Int32'
            : 'Double') as AttributeType,
        uom: s.engunits,
        dataReference: 'PI Point' as const,
        configString: `${pi(s.suffix)};ReadOnly=False`,
        category: 'Process Data',
        description: s.descriptor.replace(/^[A-Z]-?\d+\s*/, ''),
      })),
      ...statics.map((s) => ({
        name: s.name,
        type: s.type,
        uom: s.uom,
        dataReference: 'None' as const,
        configString: '',
        category: s.category,
        description: s.description,
      })),
    ],
  });
  const first = (t: string): UnitDef => {
    for (const a of UNITS) for (const u of a.units) if (u.template === t) return u;
    throw new Error(`no unit for ${t}`);
  };
  const out: SimTemplate[] = [
    {
      name: 'Equipment',
      description: 'Base template for all equipment',
      baseTemplate: null,
      attributes: [],
    },
    { name: 'Area', description: 'Plant area', baseTemplate: null, attributes: [] },
  ];
  for (const name of ['Pump', 'Tank', 'Heat Exchanger', 'Boiler', 'Compressor']) {
    const u = first(name);
    out.push(tpl(name, `${name} equipment`, u.specs, u.statics));
  }
  const pump = out.find((t) => t.name === 'Pump');
  pump?.attributes.push({
    name: 'Flow Efficiency',
    type: 'Double',
    uom: '%',
    dataReference: 'Formula',
    configString: 'A=Flow;B=Rated Flow;[A/B*100]',
    category: 'Calculated',
    description: 'Flow as a percentage of the rated flow',
  });
  return out;
}

function attributeName(s: PointSpec): string {
  const map: Record<string, string> = {
    STATUS: 'Status',
    FLOW: 'Flow',
    PRESS: 'Discharge Pressure',
    AMPS: 'Motor Current',
    VIB: 'Vibration',
    'BRG.TEMP': 'Bearing Temperature',
    LEVEL: 'Level',
    TEMP: 'Temperature',
    TIN: 'Inlet Temperature',
    TOUT: 'Outlet Temperature',
    DP: 'Differential Pressure',
    BURNER: 'Burner State',
    'STEAM.FLOW': 'Steam Flow',
    'STEAM.PRESS': 'Steam Pressure',
    'FUEL.FLOW': 'Fuel Flow',
    'STACK.TEMP': 'Stack Temperature',
    KW: 'Power',
    'AMBIENT.TEMP': 'Ambient Temperature',
    'PRODUCTION.COUNT': 'Batches Today',
  };
  return map[s.suffix] ?? s.suffix;
}

let cached: PlantModel | null = null;

/** The plant model (built once). */
export function plant(): PlantModel {
  if (cached) return cached;
  const points: SimPoint[] = [];
  let n = 0;
  const unitElement = (u: UnitDef, parentPath: string): SimElement => {
    const path = `${parentPath}\\${u.name}`;
    const attrs: SimAttribute[] = [];
    for (const s of u.specs) {
      const p = makePoint(u.id, s, n++);
      points.push(p);
      attrs.push({
        name: attributeName(s),
        type: p.pointtype === 'Digital' ? 'Digital' : p.pointtype === 'Int32' ? 'Int32' : 'Double',
        uom: p.engunits,
        dataReference: 'PI Point',
        configString: `\\\\${DATA_SERVER}\\${p.tag};ReadOnly=False`,
        tag: p.tag,
        category: 'Process Data',
        description: p.descriptor,
      });
    }
    for (const s of u.statics) {
      attrs.push({
        name: s.name,
        type: s.type,
        uom: s.uom,
        dataReference: 'None',
        configString: '',
        value: s.value,
        category: s.category,
        description: s.description,
      });
    }
    if (u.template === 'Pump') {
      attrs.push({
        name: 'Flow Efficiency',
        type: 'Double',
        uom: '%',
        dataReference: 'Formula',
        configString: 'A=Flow;B=Rated Flow;[A/B*100]',
        category: 'Calculated',
        description: 'Flow as a percentage of the rated flow',
        formula: { expr: 'A/B*100', vars: { A: 'Flow', B: 'Rated Flow' } },
      });
    }
    return {
      id: u.id,
      name: u.name,
      description: u.description,
      template: u.template,
      path,
      attributes: attrs,
      children: [],
    };
  };

  const sitePath = `\\\\${AF_SERVER}\\${AF_DATABASE}\\Riverbend Plant`;
  const siteAttrs: SimAttribute[] = SITE_POINTS.map((s) => {
    const p = makePoint('SITE', s, n++);
    points.push(p);
    return {
      name: attributeName(s),
      type: p.pointtype === 'Int32' ? 'Int32' : 'Double',
      uom: p.engunits,
      dataReference: 'PI Point',
      configString: `\\\\${DATA_SERVER}\\${p.tag}`,
      tag: p.tag,
      category: 'Site',
      description: p.descriptor,
    };
  });
  siteAttrs.push({
    name: 'Location',
    type: 'String',
    uom: '',
    dataReference: 'None',
    configString: '',
    value: 'Riverbend (fictional)',
    category: 'Site',
    description: 'Site location',
  });

  const root: SimElement = {
    id: 'SITE',
    name: 'Riverbend Plant',
    description: 'Fictional process site used throughout PI Academy',
    template: null,
    path: sitePath,
    attributes: siteAttrs,
    children: UNITS.map((a) => ({
      id: `AREA-${a.area.toUpperCase()}`,
      name: a.area,
      description: a.areaDescription,
      template: 'Area',
      path: `${sitePath}\\${a.area}`,
      attributes: [],
      children: a.units.map((u) => unitElement(u, `${sitePath}\\${a.area}`)),
    })),
  };

  cached = {
    dataServer: DATA_SERVER,
    afServer: AF_SERVER,
    database: AF_DATABASE,
    root,
    templates: templates(),
    digitalSets: DIGITAL_SETS,
    points,
  };
  return cached;
}

/** Depth-first list of all elements. */
export function allElements(root: SimElement = plant().root): SimElement[] {
  const out: SimElement[] = [];
  const walk = (e: SimElement): void => {
    out.push(e);
    e.children.forEach(walk);
  };
  walk(root);
  return out;
}

export function findPoint(tag: string): SimPoint | undefined {
  const t = tag.trim().toUpperCase();
  return plant().points.find((p) => p.tag.toUpperCase() === t);
}

export function findElement(pathOrId: string): SimElement | undefined {
  const k = pathOrId.trim().toLowerCase();
  return allElements().find((e) => e.id.toLowerCase() === k || e.path.toLowerCase() === k);
}

export function digitalStateName(set: string, value: number): string {
  const s = DIGITAL_SETS.find((d) => d.name === set);
  return s?.states[Math.round(value)] ?? `State ${Math.round(value)}`;
}
