/** Ready-made example displays, built in code against the Riverbend plant. */
import { findElement } from '@/core/sim/plant';
import { createDataSymbol, createShape, createText } from './factory';
import { digitalDefaults, numericDefaults } from './multistate';
import {
  emptyDisplay,
  makeItem,
  type CollectionSymbol,
  type Display,
  type MemberSymbol,
  type MultiState,
  type VisionSymbol,
} from './model';

export interface ExampleDisplay {
  id: string;
  name: string;
  description: string;
  build: () => Display;
}

function path(id: string): string {
  const e = findElement(id);
  if (!e) throw new Error(`Example display needs element ${id}`);
  return e.path;
}

const PUMP_STATES = digitalDefaults(['Stopped', 'Running', 'Tripped']);
const vibrationStates: MultiState = numericDefaults(
  'Vibration',
  [{ name: 'High Vibration Limit', category: 'Limits' }],
  { min: 0, max: 20 },
);
const levelStates: MultiState = numericDefaults(
  'Level',
  [
    { name: 'Low Level Limit', category: 'Limits' },
    { name: 'High Level Limit', category: 'Limits' },
  ],
  { min: 0, max: 100 },
);

function title(id: string, text: string): VisionSymbol {
  const t = createText({ id, x: 20, y: 14 }, text);
  return t.kind === 'text' ? { ...t, w: 520, h: 40, fontSize: 22, bold: true } : t;
}

function value(
  id: string,
  x: number,
  y: number,
  item: string,
  multiState: MultiState | null = null,
): VisionSymbol {
  const v = createDataSymbol('value', { id, x, y }, [item]);
  return v.kind === 'value' ? { ...v, w: 150, h: 60, fontSize: 18, multiState } : v;
}

function frame(id: string, x: number, y: number, w: number, h: number): VisionSymbol {
  const s = createShape({ id, x, y }, 'rectangle');
  return s.kind === 'shape' ? { ...s, w, h, fill: 'surface', stroke: 'muted', strokeWidth: 1 } : s;
}

function feedPumps(): Display {
  const p101 = path('P101');
  const area = path('AREA-PROCESS');
  const at = (a: string): string => makeItem(p101, a);
  const symbols: VisionSymbol[] = [];
  symbols.push(title('fp-title', 'Feed Pumps Overview'));
  symbols.push(frame('fp-frame', 20, 70, 450, 240));
  const status = createShape({ id: 'fp-status-shape', x: 40, y: 92 }, 'ellipse');
  if (status.kind === 'shape') {
    symbols.push({ ...status, w: 70, h: 70, items: [at('Status')], multiState: PUMP_STATES });
  }
  symbols.push(value('fp-status', 130, 90, at('Status'), PUMP_STATES));
  symbols.push(value('fp-flow', 300, 90, at('Flow')));
  symbols.push(value('fp-press', 130, 160, at('Discharge Pressure')));
  symbols.push(value('fp-vib', 300, 160, at('Vibration'), vibrationStates));
  symbols.push(value('fp-brg', 130, 230, at('Bearing Temperature')));
  symbols.push(value('fp-amps', 300, 230, at('Motor Current')));

  const trend = createDataSymbol('trend', { id: 'fp-trend', x: 490, y: 70 }, [
    at('Flow'),
    at('Motor Current'),
    at('Vibration'),
  ]);
  if (trend.kind === 'trend')
    symbols.push({ ...trend, w: 500, h: 330, title: 'Flow, current and vibration' });

  const eff = createDataSymbol('gauge', { id: 'fp-eff', x: 1010, y: 70 }, [at('Flow Efficiency')]);
  if (eff.kind === 'gauge') symbols.push({ ...eff, w: 180, h: 160 });
  const brg = createDataSymbol('gauge', { id: 'fp-brg-gauge', x: 1200, y: 70 }, [
    at('Bearing Temperature'),
  ]);
  if (brg.kind === 'gauge')
    symbols.push({ ...brg, w: 180, h: 160, style: 'vertical', color: 'chart-2' });

  const table = createDataSymbol('table', { id: 'fp-table', x: 1010, y: 240 }, [
    at('Discharge Pressure'),
    at('Vibration'),
  ]);
  if (table.kind === 'table') {
    symbols.push({
      ...table,
      w: 370,
      h: 160,
      columns: {
        description: false,
        units: true,
        minimum: true,
        maximum: true,
        average: false,
        trend: false,
      },
    });
  }
  symbols.push({
    ...createText(
      { id: 'fp-note', x: 20, y: 320 },
      'Values, gauges, trend and table follow Switch Asset.',
    ),
    w: 450,
    h: 30,
  });

  const compare = createDataSymbol('assetTable', { id: 'fp-compare', x: 20, y: 420 }, [], {
    template: 'Pump',
    root: area,
  });
  if (compare.kind === 'assetTable') {
    symbols.push({
      ...compare,
      w: 700,
      h: 170,
      title: 'All pumps',
      columns: [
        { attribute: 'Status', multiState: PUMP_STATES },
        { attribute: 'Flow', multiState: null },
        { attribute: 'Vibration', multiState: vibrationStates },
        { attribute: 'Bearing Temperature', multiState: null },
        { attribute: 'Flow Efficiency', multiState: null },
      ],
    });
  }
  const events = createDataSymbol('eventTable', { id: 'fp-events', x: 740, y: 420 }, [], {
    template: 'Pump',
    root: area,
    digital: { attribute: 'Status', state: 'Tripped' },
  });
  if (events.kind === 'eventTable') {
    symbols.push({
      ...events,
      w: 640,
      h: 170,
      title: 'Pump trips, last 30 days',
      timeRange: { start: '*-30d', end: '*' },
    });
  }

  symbols.push({
    ...createText({ id: 'fp-coll-title', x: 20, y: 606 }, 'Collection: every Pump element'),
    w: 400,
    h: 30,
  });
  const members: MemberSymbol[] = [];
  const dot = createShape({ id: 'fpc-dot', x: 0, y: 10 }, 'ellipse');
  if (dot.kind === 'shape')
    members.push({ ...dot, w: 36, h: 36, items: [at('Status')], multiState: PUMP_STATES });
  const flow = value('fpc-flow', 46, 0, at('Flow'));
  const vib = value('fpc-vib', 216, 0, at('Vibration'), vibrationStates);
  if (flow.kind === 'value') members.push({ ...flow, w: 160, h: 56 });
  if (vib.kind === 'value') members.push({ ...vib, w: 160, h: 56 });
  const collection: CollectionSymbol = {
    id: 'fp-collection',
    kind: 'collection',
    x: 20,
    y: 640,
    w: 1200,
    h: 80,
    template: 'Pump',
    root: area,
    filter: null,
    source: p101,
    columns: 3,
    members,
  };
  symbols.push(collection);

  return {
    ...emptyDisplay('Feed Pumps Overview'),
    context: { template: 'Pump', element: p101 },
    symbols,
  };
}

function boiler(): Display {
  const b = path('B100');
  const k = path('K100');
  const site = path('SITE');
  const at = (a: string): string => makeItem(b, a);
  const symbols: VisionSymbol[] = [];
  symbols.push(title('bo-title', 'Boiler Overview'));
  symbols.push(frame('bo-frame', 20, 70, 450, 240));
  symbols.push(
    value(
      'bo-burner',
      40,
      90,
      at('Burner State'),
      digitalDefaults(['Off', 'Purge', 'Low Fire', 'High Fire']),
    ),
  );
  symbols.push(value('bo-steam', 300, 90, at('Steam Flow')));
  symbols.push(value('bo-press', 40, 160, at('Steam Pressure')));
  symbols.push(value('bo-fuel', 300, 160, at('Fuel Flow')));
  symbols.push(value('bo-stack', 40, 230, at('Stack Temperature')));
  symbols.push(value('bo-ambient', 300, 230, makeItem(site, 'Ambient Temperature')));

  const press = createDataSymbol('gauge', { id: 'bo-press-gauge', x: 490, y: 70 }, [
    at('Steam Pressure'),
  ]);
  if (press.kind === 'gauge') {
    symbols.push({
      ...press,
      w: 200,
      h: 170,
      multiState: numericDefaults('Steam Pressure', [], { min: 0, max: 20 }),
    });
  }
  const stack = createDataSymbol('gauge', { id: 'bo-stack-gauge', x: 710, y: 70 }, [
    at('Stack Temperature'),
  ]);
  if (stack.kind === 'gauge')
    symbols.push({ ...stack, w: 270, h: 120, style: 'horizontal', color: 'chart-2' });

  const trend = createDataSymbol('trend', { id: 'bo-trend', x: 1000, y: 70 }, [
    at('Steam Flow'),
    at('Steam Pressure'),
  ]);
  if (trend.kind === 'trend') symbols.push({ ...trend, w: 380, h: 250, title: 'Steam raising' });

  const xy = createDataSymbol('xy', { id: 'bo-xy', x: 490, y: 260 }, [
    at('Fuel Flow'),
    at('Steam Flow'),
  ]);
  if (xy.kind === 'xy')
    symbols.push({ ...xy, w: 490, h: 300, title: 'Fuel flow against steam flow' });

  const bars = createDataSymbol('bar', { id: 'bo-tanks', x: 1000, y: 340 }, [
    makeItem(path('T101'), 'Level'),
    makeItem(path('T102'), 'Level'),
  ]);
  if (bars.kind === 'bar') {
    symbols.push({
      ...bars,
      w: 380,
      h: 220,
      title: 'Tank levels',
      orientation: 'horizontal',
      multiState: levelStates,
    });
  }
  const air = createDataSymbol('table', { id: 'bo-air', x: 20, y: 340 }, [
    makeItem(k, 'Status'),
    makeItem(k, 'Discharge Pressure'),
    makeItem(k, 'Power'),
  ]);
  if (air.kind === 'table')
    symbols.push({ ...air, w: 450, h: 220, title: 'Instrument air (K-100)' });

  const line = createShape({ id: 'bo-line', x: 20, y: 590 }, 'line');
  if (line.kind === 'shape') symbols.push({ ...line, w: 1360, h: 10, strokeWidth: 1 });

  return { ...emptyDisplay('Boiler Overview'), symbols };
}

export const EXAMPLES: ExampleDisplay[] = [
  {
    id: 'example-feed-pumps',
    name: 'Feed Pumps Overview',
    description:
      'Asset-relative pump display with multi-state, an asset comparison table, pump trip events and a collection.',
    build: feedPumps,
  },
  {
    id: 'example-boiler',
    name: 'Boiler Overview',
    description:
      'Boiler values and gauges, a steam trend, an XY plot with regression and tank levels.',
    build: boiler,
  },
];
