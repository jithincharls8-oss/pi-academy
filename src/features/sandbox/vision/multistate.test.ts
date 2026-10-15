import { describe, expect, it } from 'vitest';
import { digitalDefaults, evaluateMultiState, numericDefaults } from './multistate';

const limits = (name: string): number | null => (name === 'High Vibration Limit' ? 7.1 : null);

describe('numeric multi-state', () => {
  const ms = numericDefaults('Vibration', [{ name: 'High Vibration Limit', category: 'Limits' }], {
    min: 0,
    max: 20,
  });
  it('uses the limit attribute as the maximum', () => {
    expect(ms.ranges[0]?.upTo).toEqual({ kind: 'attribute', name: 'High Vibration Limit' });
    expect(evaluateMultiState(ms, 2.4, limits).color).toBe('ok');
    expect(evaluateMultiState(ms, 7.5, limits).color).toBe('alarm');
  });
  it('gives the bad-data colour for missing values', () => {
    expect(evaluateMultiState(ms, null, limits)).toMatchObject({ color: 'muted', state: 'bad' });
    expect(evaluateMultiState(ms, Number.NaN, limits).state).toBe('bad');
  });
  it('skips a range whose limit attribute cannot be read', () => {
    expect(evaluateMultiState(ms, 2, () => null).color).toBe('alarm');
  });
  it('builds low/high ranges from two limits', () => {
    const lv = numericDefaults(
      'Level',
      [
        { name: 'Low Level Limit', category: 'Limits' },
        { name: 'High Level Limit', category: 'Limits' },
      ],
      { min: 0, max: 100 },
    );
    const look = (n: string): number | null => (n.startsWith('Low') ? 15 : 85);
    expect(evaluateMultiState(lv, 10, look).color).toBe('warn');
    expect(evaluateMultiState(lv, 50, look).color).toBe('ok');
    expect(evaluateMultiState(lv, 90, look).color).toBe('alarm');
  });
  it('splits the span when no limits exist', () => {
    const s = numericDefaults('Flow', [], { min: 0, max: 200 });
    expect(s.ranges.map((r) => r.upTo)).toEqual([
      { kind: 'number', value: 160 },
      { kind: 'number', value: 190 },
      null,
    ]);
  });
  it('blinks only alarm states when blink is on', () => {
    const b = { ...ms, blink: true };
    expect(evaluateMultiState(b, 9, limits).blink).toBe(true);
    expect(evaluateMultiState(b, 1, limits).blink).toBe(false);
  });
});

describe('digital multi-state', () => {
  const ms = digitalDefaults(['Stopped', 'Running', 'Tripped']);
  it('colours pump states', () => {
    expect(ms.states.map((s) => s.color)).toEqual(['muted', 'ok', 'alarm']);
    expect(evaluateMultiState(ms, 'Tripped', limits).color).toBe('alarm');
    expect(evaluateMultiState(ms, 'running', limits).color).toBe('ok');
  });
  it('treats an unknown state as bad data', () => {
    expect(evaluateMultiState(ms, 'Unknown', limits).state).toBe('bad');
  });
  it('colours burner states', () => {
    expect(
      digitalDefaults(['Off', 'Purge', 'Low Fire', 'High Fire']).states.map((s) => s.color),
    ).toEqual(['muted', 'warn', 'warn', 'ok']);
  });
});
