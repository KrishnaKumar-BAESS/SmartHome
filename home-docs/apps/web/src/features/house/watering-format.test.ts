import { describe, expect, it } from 'vitest';
import {
  describeEvent,
  describeReply,
  formatDuration,
  formatOffset,
  localClock,
  nextRun,
  recurrenceDays,
  recurrenceFor,
  recurrenceLabel,
} from './watering-format';
import { parseStatus } from './watering-protocol';

// Friday 2026-11-27 20:15 UTC, which is 13:15 at UTC−07:00.
const FRIDAY = Date.UTC(2026, 10, 27, 20, 15) / 1000;

describe('watering display helpers', () => {
  it('names recurrences the way the firmware stores them', () => {
    expect(recurrenceDays('weekends')).toEqual(['sat', 'sun']);
    expect(
      recurrenceFor(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
    ).toBe('daily');
    expect(recurrenceFor(['fri', 'mon'])).toBe('mon,fri');
    expect(recurrenceLabel('mon,tue,wed,thu,fri')).toBe('Weekdays');
    expect(recurrenceLabel('mon,thu')).toBe('Mon, Thu');
  });
  it('formats offsets and durations', () => {
    expect(formatOffset(-420)).toBe('UTC−07:00');
    expect(formatOffset(330)).toBe('UTC+05:30');
    expect(formatDuration(4.25)).toBe('4.3 s');
    expect(formatDuration(185)).toBe('3 min 5 s');
    expect(formatDuration(7800)).toBe('2 h 10 min');
  });
  it('reads the controller-local clock', () => {
    expect(localClock(FRIDAY, -420)).toEqual({
      day: 4,
      minute: 13 * 60 + 15,
      hhmm: '13:15',
    });
  });
  it('previews the next slot occurrence in controller-local time', () => {
    const entries = [
      { slot: 1, time: '06:30', volume: '120', recurrence: 'weekdays' },
      { slot: 2, time: '19:00', volume: '80', recurrence: 'mon,wed,fri' },
    ];
    const next = nextRun(entries, FRIDAY, -420);
    expect(next?.entry.slot).toBe(2);
    expect(next?.minutesAhead).toBe(5 * 60 + 45);
    // After 19:00 on Friday the weekday slot on Monday comes first.
    const late = nextRun(entries, FRIDAY + 6 * 3600, -420);
    expect(late?.entry.slot).toBe(1);
    expect(late?.day).toBe(0);
    expect(nextRun([], FRIDAY, 0)).toBeNull();
  });
  it('describes firmware events for the activity list', () => {
    expect(
      describeEvent({
        event: 'dose_finished',
        source: 'schedule',
        actual_ms: 4000,
        estimated_ml: 9.6,
        end: 'completed',
      }),
    ).toEqual({
      title: 'Dose finished',
      detail: 'Scheduled · 4.0 s · ≈ 9.6 mL · Completed',
      tone: 'ok',
    });
    expect(describeEvent({ event: 'storage_error', record: 'log' }).tone).toBe(
      'bad',
    );
  });
  it('confirms controller replies in plain words', () => {
    expect(describeReply('started 20 s for 25 mL')).toBe(
      'Watering 25 mL · 20 s',
    );
    expect(describeReply('started 2.5 s')).toBe('Pump running for 2.5 s');
    expect(describeReply('stopped (!)')).toBe('Pump stopped');
    expect(describeReply('already stopped')).toBe(
      'The pump was already stopped',
    );
    expect(describeReply('flow=1.25 mL/s')).toBe('Flow 1.25 mL/s saved');
    expect(describeReply('schedule updated')).toBe('Schedule saved');
    expect(describeReply('tz.offset=-300')).toBe(
      'Clock offset UTC−05:00 saved',
    );
    expect(describeReply('limit.daily_ml=900  # limit')).toBe(
      'Daily volume set to 900 mL',
    );
    expect(describeReply('labels_saved')).toBe('Labels saved');
  });
  it('reads optional status fields newer firmware reports', () => {
    const base = {
      device: 'fern-1',
      fw: '0.4.2',
      build: 'x',
      uptime_s: 1,
      reset: 'power_on',
      pump: { state: 'idle' },
      clock: {
        trusted: true,
        tz_offset_min: 0,
        utc: 1800000000,
        source: 'sntp',
      },
      calibration: { flow_ml_s: 2 },
      today: { ml: 0, run_s: 0, limit_ml: 1, limit_run_s: 1 },
      schedule: { state: 'off' },
      net: { transport: 'wifi', mqtt: true, link: true, rssi_dbm: -60 },
      log: { ok: true },
      storage_ok: true,
      last_dose: {
        source: 'local',
        end: 'stopped',
        actual_ms: 1500,
        estimated_ml: 3,
      },
    };
    const status = parseStatus('ok ' + JSON.stringify(base));
    expect(status.clockUtc).toBe(1800000000);
    expect(status.rssi).toBe(-60);
    expect(status.lastDose).toEqual({
      source: 'local',
      end: 'stopped',
      seconds: 1.5,
      ml: 3,
    });
    const older = parseStatus(
      JSON.stringify({
        ...base,
        last_dose: undefined,
        clock: { trusted: false, tz_offset_min: 0 },
      }),
    );
    expect(older.clockUtc).toBeNull();
    expect(older.lastDose).toBeNull();
  });
});
