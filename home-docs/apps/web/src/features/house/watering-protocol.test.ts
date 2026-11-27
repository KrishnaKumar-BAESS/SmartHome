import { describe, it, expect } from 'vitest';
import {
  parseSchedule,
  checkCommand,
  parseStatus,
  scheduleCommand,
} from './watering-protocol';
describe('watering controller protocol', () => {
  it('reads all occupied slots and preserves custom recurrence', () => {
    const { enabled, entries } = parseSchedule(
      'ok schedule=off grace=30min\n8 07:05 2.625mL mon,thu',
    );
    expect(enabled).toBe(false);
    expect(scheduleCommand(entries[0])).toBe('sched set 8 07:05 2.625 mon,thu');
    expect(parseSchedule('ok schedule=off grace=30min').entries).toEqual([]);
  });
  it.each([
    'run 0',
    'run 121',
    'run 1.0001',
    'cal run 2.999',
    'sched set 9 00:00 1 daily',
    'sched set 1 24:00 1 daily',
    'sched set 1 20:00 1 mon,mon',
    'config tz.offset 841',
    'run 1\nstop',
    'time set 1890000000',
    'config mqtt.pass value',
    'config limit.rest_s 5',
  ])('rejects invalid or restricted MQTT command %s', (c) =>
    expect(() => checkCommand(c, false)).toThrow(),
  );
  it('accepts bounded direct USB limit edits and MQTT reads', () => {
    expect(() =>
      checkCommand('config limit.max_run_s 0.001', true),
    ).not.toThrow();
    expect(() => checkCommand('config limit.max_run_s 121', true)).toThrow();
    expect(() => checkCommand('config limit.max_run_s', false)).not.toThrow();
    expect(() => checkCommand('stop', false)).not.toThrow();
  });
  it('refuses incomplete controller reports and broken schedule listings', () => {
    expect(() =>
      parseStatus('{"device":"fern-1","pump":{"state":"idle"}}'),
    ).toThrow();
    expect(() =>
      parseSchedule('ok schedule=on grace=15min\n8 12:00'),
    ).toThrow();
  });
});
