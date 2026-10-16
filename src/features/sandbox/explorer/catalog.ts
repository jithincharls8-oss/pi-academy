/**
 * Read-only reference data for the PSE mockup's Unit of Measure, Contacts and Notification
 * Rules sections, and element categories. All names and addresses are fictional.
 */
import type { ExprValue } from '@/core/sim/expr';

export interface UomClass {
  name: string;
  units: { name: string; abbreviation: string; usedBy: string }[];
}

/** Units used by the Riverbend database, grouped into UOM classes. */
export const UOM_CLASSES: UomClass[] = [
  {
    name: 'Volume Flow Rate',
    units: [
      { name: 'cubic meter per hour', abbreviation: 'm3/h', usedBy: 'Pump Flow' },
      {
        name: 'normal cubic meter per hour',
        abbreviation: 'Nm3/h',
        usedBy: 'Boiler Fuel Flow',
      },
    ],
  },
  {
    name: 'Mass Flow Rate',
    units: [{ name: 'tonne per hour', abbreviation: 't/h', usedBy: 'Boiler Steam Flow' }],
  },
  {
    name: 'Pressure',
    units: [
      { name: 'bar', abbreviation: 'bar', usedBy: 'Discharge Pressure, Steam Pressure' },
      { name: 'kilopascal', abbreviation: 'kPa', usedBy: 'Differential Pressure' },
    ],
  },
  {
    name: 'Temperature',
    units: [
      { name: 'degree Celsius', abbreviation: 'degC', usedBy: 'Temperatures across the site' },
    ],
  },
  {
    name: 'Power',
    units: [{ name: 'kilowatt', abbreviation: 'kW', usedBy: 'Compressor Power, Design Duty' }],
  },
  {
    name: 'Electric Current',
    units: [{ name: 'ampere', abbreviation: 'A', usedBy: 'Motor Current' }],
  },
  {
    name: 'Speed',
    units: [{ name: 'millimeter per second', abbreviation: 'mm/s', usedBy: 'Vibration' }],
  },
  {
    name: 'Volume',
    units: [{ name: 'cubic meter', abbreviation: 'm3', usedBy: 'Tank Capacity' }],
  },
  {
    name: 'Ratio',
    units: [{ name: 'percent', abbreviation: '%', usedBy: 'Level, Flow Efficiency' }],
  },
];

export interface Contact {
  name: string;
  description: string;
  endpoints: { channel: 'Email' | 'Web Service'; address: string }[];
}

export const CONTACTS: Contact[] = [
  {
    name: 'Riverbend Control Room',
    description: 'Shared mailbox for the operators on shift',
    endpoints: [{ channel: 'Email', address: 'control.room@riverbend.example' }],
  },
  {
    name: 'Maintenance Planner',
    description: 'Plans pump and compressor work orders',
    endpoints: [{ channel: 'Email', address: 'maintenance.planner@riverbend.example' }],
  },
  {
    name: 'Work Order Service',
    description: 'REST endpoint that raises work orders',
    endpoints: [
      { channel: 'Web Service', address: 'https://workorders.riverbend.example/api/requests' },
    ],
  },
];

export interface NotificationRuleInfo {
  name: string;
  target: string;
  criteria: string;
  notifyOn: string;
  subscriptions: { contact: string; channel: string; format: string }[];
  status: 'Enabled' | 'Disabled';
}

export const NOTIFICATION_RULES: NotificationRuleInfo[] = [
  {
    name: 'Pump Trip Alert',
    target: 'Element template Pump (applies to P-101, P-102, P-103)',
    criteria: 'Event frames from template "Pump Trip"',
    notifyOn: 'Event start and event end',
    subscriptions: [
      { contact: 'Riverbend Control Room', channel: 'Email', format: 'Global Default Email' },
      { contact: 'Work Order Service', channel: 'Web Service', format: 'Default web service' },
    ],
    status: 'Enabled',
  },
  {
    name: 'Compressor Trip Alert',
    target: 'Element K-100',
    criteria: 'Event frames from template "Compressor Trip"',
    notifyOn: 'Event start',
    subscriptions: [
      { contact: 'Riverbend Control Room', channel: 'Email', format: 'Global Default Email' },
      { contact: 'Maintenance Planner', channel: 'Email', format: 'Global Default Email' },
    ],
    status: 'Disabled',
  },
];

/** Element categories in the sandbox library, by element template. */
export const ELEMENT_CATEGORIES: Record<string, string[]> = {
  Pump: ['Rotating Equipment'],
  Compressor: ['Rotating Equipment'],
  Tank: ['Static Equipment'],
  'Heat Exchanger': ['Static Equipment'],
  Boiler: ['Utilities'],
  Area: ['Plant Area'],
};

export const ANALYSIS_CATEGORIES = ['Calculated Data', 'Aggregation'];

/** Display text for an expression value. */
export function valueText(v: ExprValue): string {
  switch (v.type) {
    case 'number': {
      const a = Math.abs(v.value);
      const d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 || a === 0 ? 2 : 4;
      return v.value.toFixed(d);
    }
    case 'string':
      return v.value;
    case 'boolean':
      return v.value ? 'True' : 'False';
    case 'time':
      return new Date(v.value).toLocaleString();
    case 'nooutput':
      return 'No Output';
  }
}
