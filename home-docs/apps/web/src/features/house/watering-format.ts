import { days, type Entry } from './watering-protocol';

/** Display names for the firmware's weekday tokens, Monday first. */
export const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Expands a stored recurrence into the weekday tokens it covers. */
export function recurrenceDays(recurrence: string): string[] {
  if (recurrence === 'daily') return [...days];
  if (recurrence === 'weekdays') return days.slice(0, 5);
  if (recurrence === 'weekends') return days.slice(5);
  return days.filter((d) => recurrence.split(',').includes(d));
}

/** The shortest recurrence the firmware accepts for a set of weekdays. */
export function recurrenceFor(selected: string[]): string {
  const ordered = days.filter((d) => selected.includes(d));
  return ordered.length === 7 ? 'daily' : ordered.join(',');
}

export function recurrenceLabel(recurrence: string): string {
  const covered = recurrenceDays(recurrence);
  if (covered.length === 7) return 'Every day';
  if (covered.join() === days.slice(0, 5).join()) return 'Weekdays';
  if (covered.join() === days.slice(5).join()) return 'Weekends';
  return covered.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
}

/** `-420` → `UTC−07:00`. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

/** Compact human duration for seconds: `4.2 s`, `3 min 5 s`, `2 h 10 min`. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 10) return `${seconds.toFixed(1)} s`;
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const total = Math.round(seconds);
  if (total < 3600) {
    const s = total % 60;
    return `${Math.floor(total / 60)} min${s ? ` ${s} s` : ''}`;
  }
  const minutes = Math.round(total / 60);
  const m = minutes % 60;
  if (minutes < 1440)
    return `${Math.floor(minutes / 60)} h${m ? ` ${m} min` : ''}`;
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return `${d} d${h ? ` ${h} h` : ''}`;
}

/** Trims trailing zeros the firmware's three-decimal fields carry. */
export function formatNumber(value: number, digits = 3): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Controller-local weekday (0 = Monday) and minute of day for a UTC time. */
export function localClock(utcSeconds: number, offsetMinutes: number) {
  const local = new Date((utcSeconds + offsetMinutes * 60) * 1000);
  return {
    day: (local.getUTCDay() + 6) % 7,
    minute: local.getUTCHours() * 60 + local.getUTCMinutes(),
    hhmm:
      String(local.getUTCHours()).padStart(2, '0') +
      ':' +
      String(local.getUTCMinutes()).padStart(2, '0'),
  };
}

const minuteOf = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export type NextRun = { entry: Entry; day: number; minutesAhead: number };

/**
 * The next slot occurrence strictly after the controller-local time. The
 * firmware decides when a dose actually runs; this is a preview of its
 * stored schedule.
 */
export function nextRun(
  entries: Entry[],
  utcSeconds: number,
  offsetMinutes: number,
): NextRun | null {
  const now = localClock(utcSeconds, offsetMinutes);
  let best: NextRun | null = null;
  for (const entry of entries) {
    const at = minuteOf(entry.time);
    const covered = recurrenceDays(entry.recurrence);
    for (let ahead = 0; ahead <= 7; ahead++) {
      const day = (now.day + ahead) % 7;
      if (!covered.includes(days[day])) continue;
      const delta = ahead * 1440 + at - now.minute;
      if (delta <= 0) continue;
      if (!best || delta < best.minutesAhead)
        best = { entry, day, minutesAhead: delta };
      break;
    }
  }
  return best;
}

const SOURCES: Record<string, string> = {
  local: 'Manual',
  network: 'Remote',
  schedule: 'Scheduled',
};
/** Who asked for a dose, as the firmware's `source` field names it. */
export function sourceLabel(source: string): string {
  return SOURCES[source] ?? sentence(source);
}
const TRANSPORTS: Record<string, string> = {
  wifi: 'Wi-Fi',
  ethernet: 'Ethernet',
  none: 'No network',
};
export function transportLabel(transport: string): string {
  return TRANSPORTS[transport] ?? sentence(transport);
}

export function sentence(text: string): string {
  const s = text.replaceAll('_', ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const LIMIT_NAMES: Record<string, string> = {
  max_run_s: 'Maximum run',
  rest_s: 'Minimum rest',
  daily_ml: 'Daily volume',
  daily_run_s: 'Daily runtime',
};

/**
 * Turns a controller's `ok` reply (without the `ok `) into a confirmation in
 * the operator's words. Unknown replies keep their text.
 */
export function describeReply(text: string): string {
  let m = text.match(/^started ([\d.]+) s for ([\d.]+) mL/);
  if (m)
    return `Watering ${formatNumber(Number(m[2]))} mL · ${formatDuration(Number(m[1]))}`;
  if ((m = text.match(/^started ([\d.]+) s/)))
    return `Pump running for ${formatDuration(Number(m[1]))}`;
  if (/^already stopped/.test(text)) return 'The pump was already stopped';
  if (/^stopped/.test(text)) return 'Pump stopped';
  if ((m = text.match(/^flow=([\d.]+) mL\/s/)))
    return `Flow ${formatNumber(Number(m[1]))} mL/s saved`;
  if (/^schedule updated/.test(text)) return 'Schedule saved';
  if ((m = text.match(/^tz\.offset=(-?\d+)/)))
    return `Clock offset ${formatOffset(Number(m[1]))} saved`;
  if ((m = text.match(/^limit\.(\w+)=([\d.]+)/)) && LIMIT_NAMES[m[1]]) {
    const unit = m[1].endsWith('_ml') ? 'mL' : 's';
    return `${LIMIT_NAMES[m[1]]} set to ${formatNumber(Number(m[2]))} ${unit}`;
  }
  return sentence(text);
}

const EVENT_TITLES: Record<string, string> = {
  boot: 'Controller started',
  inhibited: 'Pump inhibited',
  clock_set: 'Clock set',
  dose_started: 'Dose started',
  dose_finished: 'Dose finished',
  dose_rejected: 'Dose refused',
  schedule_skipped: 'Scheduled dose skipped',
  schedule_missed: 'Scheduled dose missed',
  schedule_waiting: 'Schedule waiting',
  storage_error: 'Storage error',
};

export type EventTone = 'ok' | 'warn' | 'bad' | 'info';

/** Turns one firmware event line into a title, detail and tone. */
export function describeEvent(raw: Record<string, unknown>): {
  title: string;
  detail: string;
  tone: EventTone;
} {
  const kind = typeof raw.event === 'string' ? raw.event : 'unknown';
  const text = (v: unknown) => (typeof v === 'string' ? v : '');
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const parts: string[] = [];
  if (raw.calibration_trial === true) parts.push('Calibration trial');
  if (text(raw.source)) parts.push(sourceLabel(text(raw.source)));
  const actual = num(raw.actual_ms);
  const planned = num(raw.planned_ms);
  if (actual !== null) parts.push(formatDuration(actual / 1000));
  else if (planned !== null) parts.push(formatDuration(planned / 1000));
  const ml = num(raw.estimated_ml) ?? num(raw.planned_ml);
  if (ml !== null) parts.push(`≈ ${formatNumber(ml, 1)} mL`);
  if (num(raw.slot) !== null) parts.push(`Slot ${raw.slot}`);
  const outcome = text(raw.end) || text(raw.reason) || text(raw.record);
  if (outcome) parts.push(sentence(outcome));
  const tone: EventTone =
    kind === 'storage_error' || kind === 'inhibited'
      ? 'bad'
      : kind === 'dose_rejected' ||
          kind.startsWith('schedule_') ||
          ['cutoff', 'stopped'].includes(text(raw.end))
        ? 'warn'
        : kind === 'dose_finished' || kind === 'dose_started'
          ? 'ok'
          : 'info';
  return {
    title: EVENT_TITLES[kind] ?? sentence(kind),
    detail: parts.join(' · '),
    tone,
  };
}
