export const deviceId = /^[A-Za-z0-9_-]{1,32}$/;
export const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const limits = {
  max_run_s: { label: 'Maximum run (s)', min: 0.001, max: 120 },
  rest_s: { label: 'Minimum rest (s)', min: 5, max: 86400 },
  daily_ml: { label: 'Daily volume (mL)', min: 0.001, max: 10000 },
  daily_run_s: { label: 'Daily runtime (s)', min: 0.001, max: 1800 },
} as const;
export type Limit = keyof typeof limits;

export function decimal(value: string, min: number, max: number) {
  if (
    !/^\d+(?:\.\d{1,3})?$/.test(value) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw new Error(
      'Enter a value from ' +
        min +
        ' to ' +
        max +
        ' with up to three decimal places.',
    );
  return value;
}

export type Entry = {
  slot: number;
  time: string;
  volume: string;
  recurrence: string;
};
export function scheduleCommand(entry: Entry) {
  const { slot, time, volume, recurrence } = entry;
  const selected = recurrence.split(',');
  if (
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > 8 ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error('Choose a slot and a local time.');
  if (
    !['daily', 'weekdays', 'weekends'].includes(recurrence) &&
    !(
      selected.length === new Set(selected).size &&
      selected.every((day) => days.includes(day))
    )
  )
    throw new Error('Choose at least one weekday.');
  return [
    'sched set',
    slot,
    time,
    decimal(volume, 0.001, 2000),
    recurrence,
  ].join(' ');
}

export function parseSchedule(reply: string) {
  const [head, ...rows] = reply.trim().split(/\r?\n/);
  const header = /^ok schedule=(on|off) grace=(\d+)min$/.exec(head);
  if (!header) throw new Error('Unreadable schedule.');
  const entries = rows.map((line) => {
    const row = /^([1-8]) (\S+) ([\d.]+)mL (\S+)$/.exec(line);
    if (!row) throw new Error('Incomplete schedule.');
    const entry = {
      slot: Number(row[1]),
      time: row[2],
      volume: row[3],
      recurrence: row[4],
    };
    scheduleCommand(entry);
    return entry;
  });
  return { enabled: header[1] === 'on', grace: Number(header[2]), entries };
}

function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('Invalid device status.');
  return v as Record<string, unknown>;
}
function str(v: unknown) {
  if (typeof v !== 'string') throw new Error('Invalid device status.');
  return v;
}
function num(v: unknown) {
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new Error('Invalid device status.');
  return v;
}
function bool(v: unknown) {
  if (typeof v !== 'boolean') throw new Error('Invalid device status.');
  return v;
}
/** Reads a field newer firmware reports; absent or malformed reads as null. */
function optional<T extends 'number' | 'string'>(
  v: unknown,
  type: T,
): (T extends 'number' ? number : string) | null {
  if (typeof v !== type) return null;
  if (type === 'number' && !Number.isFinite(v)) return null;
  return v as T extends 'number' ? number : string;
}
function optionalDose(d: Record<string, unknown>) {
  const ms = optional(d.actual_ms, 'number');
  if (ms === null) return null;
  return {
    source: optional(d.source, 'string') ?? '',
    end: optional(d.end, 'string') ?? '',
    seconds: ms / 1000,
    ml: optional(d.estimated_ml, 'number'),
  };
}
export function parseStatus(reply: string) {
  const s = record(JSON.parse(reply.replace(/^ok /, '')));
  const p = record(s.pump),
    clock = record(s.clock),
    cal = record(s.calibration),
    today = record(s.today),
    schedule = record(s.schedule),
    net = record(s.net);
  const state = str(p.state),
    id = str(s.device);
  if (
    !deviceId.test(id) ||
    !['idle', 'running', 'resting', 'inhibited'].includes(state)
  )
    throw new Error('Unrecognized controller.');
  const last = s.last_dose;
  const lastDose =
    last && typeof last === 'object' && !Array.isArray(last)
      ? optionalDose(last as Record<string, unknown>)
      : null;
  return {
    id,
    lastDose,
    clockUtc: optional(clock.utc, 'number'),
    clockSource: optional(clock.source, 'string') ?? '',
    ip: optional(net.ip, 'string') ?? '',
    rssi: optional(net.rssi_dbm, 'number'),
    fw: str(s.fw),
    build: str(s.build),
    uptime: num(s.uptime_s),
    reset: str(s.reset),
    state,
    reason: p.reason === undefined ? '' : str(p.reason),
    source: p.source === undefined ? '' : str(p.source),
    remaining:
      state === 'running'
        ? num(p.remaining_ms)
        : state === 'resting'
          ? num(p.rest_ms)
          : 0,
    flow: cal.flow_ml_s === null ? null : num(cal.flow_ml_s),
    clockTrusted: bool(clock.trusted),
    offset: num(clock.tz_offset_min),
    scheduleState: str(schedule.state),
    storage: bool(s.storage_ok),
    log: bool(record(s.log).ok),
    volume: num(today.ml),
    runtime: num(today.run_s),
    volumeLimit: num(today.limit_ml),
    runtimeLimit: num(today.limit_run_s),
    transport: str(net.transport),
    mqtt: bool(net.mqtt),
    link: bool(net.link),
  };
}
export type Status = ReturnType<typeof parseStatus>;

export function checkCommand(command: string, usb: boolean) {
  if (/[\r\n\0]/.test(command)) throw new Error('Invalid command.');
  if (
    ['status', 'stop', 'sched', 'cal', 'sched on', 'sched off'].includes(
      command,
    )
  )
    return;
  const parts = command.split(' ');
  const last = parts.at(-1)!;
  const op = parts.slice(0, -1).join(' ');
  if (op === 'run' || op === 'cal run')
    return decimal(last, op === 'run' ? 0.001 : 3, 120);
  if (op === 'cal set' || op === 'water')
    return decimal(last, 0.001, op === 'water' ? 2000 : 4294967.295);
  if (op === 'sched clear' && /^[1-8]$/.test(last)) return;
  if (
    op === 'config tz.offset' &&
    /^-?\d{1,3}$/.test(last) &&
    Number(last) >= -720 &&
    Number(last) <= 840
  )
    return;
  if (
    parts.length === 6 &&
    parts[0] === 'sched' &&
    parts[1] === 'set' &&
    /^[1-8]$/.test(parts[2])
  ) {
    scheduleCommand({
      slot: Number(parts[2]),
      time: parts[3],
      volume: parts[4],
      recurrence: parts[5],
    });
    return;
  }
  const key = parts[1]?.replace(/^limit\./, '') as Limit;
  if (
    parts[0] === 'config' &&
    parts[1] === 'limit.' + key &&
    Object.hasOwn(limits, key)
  ) {
    if (parts.length === 2) return;
    if (usb && parts.length === 3)
      return decimal(last, limits[key].min, limits[key].max);
  }
  throw new Error('Unsupported command for this connection.');
}
