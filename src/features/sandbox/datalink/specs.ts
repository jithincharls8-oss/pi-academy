/**
 * Function wizard metadata. Signatures and argument descriptions follow the PI DataLink user
 * guide as summarised in research/dev2.md (dev2.datalink-functions).
 */

export interface ArgSpec {
  name: string;
  description: string;
  /** a sensible value to start from in the wizard */
  example: string;
  /** typed as text, so the wizard adds "quotes" */
  text?: boolean;
  optional?: boolean;
  choices?: readonly string[];
}

export interface FunctionSpec {
  name: string;
  group: 'Single value' | 'Multiple value' | 'Calculation' | 'Excel';
  summary: string;
  args: ArgSpec[];
  /** where this sandbox simplifies behaviour the research does not pin down */
  simplified?: string;
  spills?: boolean;
}

const TAG: ArgSpec = {
  name: 'tagname',
  description: 'The PI point name (or a cell holding it), e.g. RB.P101.FLOW',
  example: 'RB.P101.FLOW',
  text: true,
};
const SERVER: ArgSpec = {
  name: 'PIServer',
  description: 'The PI Data Archive. A blank server argument uses the default PI server.',
  example: '',
  text: true,
  optional: true,
};
const STIME: ArgSpec = {
  name: 'stime',
  description: 'Start time: a PI time such as *-8h, t or y, or a cell holding a date',
  example: '*-1h',
  text: true,
};
const ETIME: ArgSpec = {
  name: 'etime',
  description: 'End time. Swapping start and end returns data in reverse order.',
  example: '*',
  text: true,
};
const INTERVAL: ArgSpec = {
  name: 'interval',
  description: 'The time between values, e.g. 1h, 10m or 30s',
  example: '1h',
  text: true,
};
const ARCHIVE_MODES = [
  'previous',
  'previous only',
  'interpolated',
  'auto',
  'next',
  'next only',
  'exact time',
] as const;
const CALC_MODES = [
  'total',
  'average',
  'mean',
  'minimum',
  'maximum',
  'range',
  'standard deviation',
  'count',
] as const;
const CALC_ARGS: ArgSpec[] = [
  {
    name: 'mode',
    description:
      'The calculation: total, average, mean (an event-weighted version of average), minimum, maximum, range, standard deviation or count',
    example: 'average',
    text: true,
    choices: CALC_MODES,
  },
  {
    name: 'calcbasis',
    description:
      'The weighting method used to calculate values. Calculations are time-weighted by default.',
    example: 'time-weighted',
    text: true,
    choices: ['time-weighted', 'event-weighted'],
  },
  {
    name: 'minpctgood',
    description: 'The minimum percentage of good data required to calculate and return a value',
    example: '0',
  },
  {
    name: 'cfactor',
    description:
      'The time unit of flow for the source tag, required for Total calculations (the server default is units per day, so use 24 for a per-hour rate and 1440 for per-minute)',
    example: '1',
  },
  {
    name: 'outcode',
    description:
      '0 value only, 1 adds timestamps, 4 adds percent good, 5 adds both; 2, 6 and 7 transpose into rows. Not 3.',
    example: '0',
  },
];

export const FUNCTION_SPECS: FunctionSpec[] = [
  {
    name: 'PICurrVal',
    group: 'Single value',
    summary:
      'The current (snapshot) value of a tag. A volatile function: it recalculates with the clock or F9.',
    args: [
      TAG,
      {
        name: 'outcode',
        description:
          'An output code to determine results placement, either 0, 1, or 2 (1 adds the timestamp)',
        example: '0',
      },
      SERVER,
    ],
    simplified:
      'Outcode is read as the DataLink bit field: bit 1 adds the timestamp to the left, bit 2 lays the result out as a column.',
  },
  {
    name: 'PIArcVal',
    group: 'Single value',
    summary: 'The archived value at a time, using a retrieval mode.',
    args: [
      TAG,
      {
        name: 'timestamp',
        description: 'The time to read, e.g. *-1h or a date cell',
        example: '*-1h',
        text: true,
      },
      {
        name: 'outcode',
        description: 'An output code to determine results placement, either 0, 1, or 2',
        example: '0',
      },
      SERVER,
      {
        name: 'mode',
        description:
          'The mode used to determine which values are retrieved: previous, previous only, interpolated, auto (the default: interpolates unless the item is a step point), next, next only, exact time (returns "No events found" without an exact match)',
        example: 'auto',
        text: true,
        optional: true,
        choices: ARCHIVE_MODES,
      },
    ],
  },
  {
    name: 'PIExpVal',
    group: 'Single value',
    summary: 'Evaluates a performance equation at one time. Expressions only calculate on demand.',
    args: [
      {
        name: 'expression',
        description:
          "A PI performance equation; tag names go in single quotes, e.g. 'RB.P101.FLOW'*2",
        example: "'RB.P101.FLOW'+'RB.P102.FLOW'",
        text: true,
      },
      {
        name: 'timestamp',
        description: 'The time to evaluate at, e.g. * for now',
        example: '*',
        text: true,
      },
      SERVER,
    ],
    simplified: 'Uses the PI Academy PE evaluator, which covers the common PE functions.',
  },
  {
    name: 'PICompDat',
    group: 'Multiple value',
    summary: 'Compressed (archived) values between two times. Spills down.',
    spills: true,
    args: [
      TAG,
      STIME,
      ETIME,
      {
        name: 'outcode',
        description:
          'Bit field: 1 shows timestamps, 2 lays values out in a row, 8 hides the count (9 = timestamps and hide count)',
        example: '9',
      },
      SERVER,
      {
        name: 'mode',
        description:
          'Boundary type: inside (default, values at or just inside the times), outside (closest values immediately outside), interpolated (values interpolated at start and end), auto (interpolated, but inside for step tags)',
        example: 'inside',
        text: true,
        optional: true,
        choices: ['inside', 'outside', 'interpolated', 'auto'],
      },
    ],
    simplified:
      'When the count is not hidden it is shown in the first cell of the result. Only the timestamp, orientation and hide-count bits are used.',
  },
  {
    name: 'PINCompDat',
    group: 'Multiple value',
    summary: 'A number of compressed values from a start time. Spills down.',
    spills: true,
    args: [
      TAG,
      STIME,
      {
        name: 'numvals',
        description: 'The number of desired values (negative if counting backward in time)',
        example: '-10',
      },
      {
        name: 'outcode',
        description: 'Bit field: 1 timestamps, 2 row orientation, 8 hide count',
        example: '9',
      },
      SERVER,
      {
        name: 'mode',
        description: 'The method of handling values at boundaries of the time range',
        example: 'inside',
        text: true,
        optional: true,
        choices: ['inside'],
      },
    ],
    simplified: 'Only the inside boundary type is modelled.',
  },
  {
    name: 'PISampDat',
    group: 'Multiple value',
    summary: 'Sampled (interpolated) values at a fixed interval. Spills down.',
    spills: true,
    args: [
      TAG,
      STIME,
      ETIME,
      INTERVAL,
      {
        name: 'outcode',
        description:
          '0 values only; 1 values plus timestamps; 2 transposes 0 (row); 3 transposes 1',
        example: '1',
      },
      SERVER,
    ],
  },
  {
    name: 'PITimeDat',
    group: 'Multiple value',
    summary:
      'Values at the timestamps in a range of cells; results follow the orientation of that range.',
    spills: true,
    args: [
      TAG,
      {
        name: 'timestamps',
        description: 'A reference to an array of time stamps, e.g. A12:A18',
        example: 'A12:A18',
      },
      SERVER,
      {
        name: 'mode',
        description:
          'interpolated (interpolates at the specified timestamps) or exact time (only values exactly matching, otherwise "No events found")',
        example: 'interpolated',
        text: true,
        optional: true,
        choices: ['interpolated', 'exact time'],
      },
    ],
  },
  {
    name: 'PIAdvCalcVal',
    group: 'Calculation',
    summary: 'One calculated value (average, total, ...) over a time range.',
    args: [TAG, STIME, ETIME, ...CALC_ARGS, SERVER],
    simplified:
      'All sandbox data is 100 % good, so minpctgood only fails above 100. With timestamps, the start time is shown. Event-weighted total is the sum of events times cfactor.',
  },
  {
    name: 'PIAdvCalcDat',
    group: 'Calculation',
    summary: 'Calculated values for each interval of a time range. Spills down.',
    spills: true,
    args: [TAG, STIME, ETIME, INTERVAL, ...CALC_ARGS, SERVER],
    simplified:
      'Each interval is calculated like PIAdvCalcVal; timestamps are interval start times.',
  },
  {
    name: 'SUM',
    group: 'Excel',
    summary: 'Adds numbers and ranges, e.g. SUM(B4:B6).',
    args: [{ name: 'number1', description: 'A number, cell or range', example: 'B4:B6' }],
  },
  {
    name: 'AVERAGE',
    group: 'Excel',
    summary: 'Arithmetic mean of numbers and ranges.',
    args: [{ name: 'number1', description: 'A number, cell or range', example: 'B4:B6' }],
  },
  {
    name: 'ROUND',
    group: 'Excel',
    summary: 'Rounds a number to a number of decimals.',
    args: [
      { name: 'number', description: 'The value to round', example: 'B4' },
      { name: 'num_digits', description: 'Decimals to keep', example: '1' },
    ],
  },
];

export function specFor(name: string): FunctionSpec | undefined {
  return FUNCTION_SPECS.find((f) => f.name.toUpperCase() === name.toUpperCase());
}

/** Build formula text from wizard inputs, quoting text arguments and dropping trailing blanks. */
export function buildFormula(spec: FunctionSpec, values: string[]): string {
  const parts = spec.args.map((a, i) => {
    const v = (values[i] ?? '').trim();
    if (v === '') return '';
    const isRef = /^\$?[A-Za-z]{1,2}\$?\d+(:\$?[A-Za-z]{1,2}\$?\d+)?$/.test(v);
    if (isRef || !a.text || v.startsWith('"')) return v;
    return `"${v.replace(/"/g, '""')}"`;
  });
  while (parts.length && parts[parts.length - 1] === '') parts.pop();
  return `=${spec.name}(${parts.join(',')})`;
}
