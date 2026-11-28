import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Segmented } from './segmented';
import type { Connection } from './watering-transport';
import {
  days,
  parseSchedule,
  scheduleCommand,
  type Entry,
  type Status,
} from './watering-protocol';
import {
  dayNames,
  formatDuration,
  formatNumber,
  localClock,
  nextRun,
  recurrenceDays,
  recurrenceFor,
  recurrenceLabel,
} from './watering-format';
import { errorText, type Send } from './watering-controller';
import { Card, Glyph, NumberField } from './watering-kit';

const SLOTS = 8;
const STATE_LABEL: Record<string, { text: string; tone: string }> = {
  active: { text: 'Active', tone: 'ok' },
  off: { text: 'Paused', tone: 'idle' },
  needs_calibration: { text: 'Needs calibration', tone: 'warn' },
  waiting_for_clock: { text: 'Waiting for clock', tone: 'warn' },
  clock_stale: { text: 'Clock stale', tone: 'warn' },
};

function when(minutes: number) {
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes < 1440) return `in ${formatDuration(minutes * 60)}`;
  return `in ${Math.round(minutes / 1440)} d`;
}

function Week({
  entries,
  today,
  nowMinute,
  selected,
  upcoming,
  paused,
  onSelect,
}: {
  entries: Entry[];
  today: number | null;
  nowMinute: number | null;
  selected: number;
  upcoming: { slot: number; day: number } | null;
  /** The stored slots will not run, so they are drawn as outlines. */
  paused: boolean;
  onSelect: (slot: number) => void;
}) {
  const minute = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return (
    <div
      className="wv-week"
      role="group"
      aria-label="Week at a glance"
      data-paused={paused || undefined}
    >
      <div className="wv-week-scale" aria-hidden="true">
        <span />
        {['00', '06', '12', '18', '24'].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {days.map((day, i) => {
        const hits = entries.filter((e) =>
          recurrenceDays(e.recurrence).includes(day),
        );
        return (
          <div
            key={day}
            className="wv-week-row"
            data-today={i === today || undefined}
          >
            <span className="wv-week-day">{dayNames[i].slice(0, 3)}</span>
            <div className="wv-week-track">
              {i === today && nowMinute !== null && (
                <span
                  className="wv-week-now"
                  style={{ left: `${(nowMinute / 1440) * 100}%` }}
                  aria-hidden="true"
                />
              )}
              {hits.map((e) => (
                <button
                  key={e.slot}
                  type="button"
                  className="wv-week-dot"
                  data-on={e.slot === selected || undefined}
                  data-next={
                    (upcoming?.slot === e.slot && upcoming.day === i) ||
                    undefined
                  }
                  data-past={
                    (i === today &&
                      nowMinute !== null &&
                      minute(e.time) <= nowMinute) ||
                    undefined
                  }
                  style={
                    {
                      left: `${(minute(e.time) / 1440) * 100}%`,
                    } as CSSProperties
                  }
                  aria-label={`${dayNames[i]} ${e.time}, slot ${e.slot}, ${e.volume} mL`}
                  tabIndex={-1}
                  onClick={() => onSelect(e.slot)}
                >
                  <span>{e.time}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SlotEditor({
  slot,
  entry,
  flow,
  busy,
  send,
}: {
  slot: number;
  entry?: Entry;
  flow: number | null;
  busy: boolean;
  send: Send;
}) {
  const [time, setTime] = useState(entry?.time ?? '07:00');
  const [amount, setAmount] = useState(entry?.volume ?? '');
  const [unit, setUnit] = useState<'volume' | 'seconds'>('volume');
  const byTime = unit === 'seconds' && flow !== null;
  // Firmware stores microlitres. Round a duration-derived dose once, at that resolution.
  const volume = byTime
    ? (Math.round(Number(amount) * flow * 1000) / 1000).toString()
    : amount;
  const [selected, setSelected] = useState(
    entry ? recurrenceDays(entry.recurrence) : [...days],
  );
  const [error, setError] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const cmd = scheduleCommand({
        slot,
        time,
        volume,
        recurrence: recurrenceFor(selected),
      });
      setError('');
      void send(cmd);
    } catch (err) {
      setError(errorText(err));
    }
  }
  const preset = (list: string[]) =>
    selected.length === list.length && list.every((d) => selected.includes(d));
  return (
    <form className="wv-editor" onSubmit={submit}>
      <header className="wv-editor-head">
        <span className="wv-slot-badge">{slot}</span>
        <div>
          <h4>{entry ? `Edit slot ${slot}` : `New dose in slot ${slot}`}</h4>
          <p>Times use the controller’s local clock.</p>
        </div>
      </header>
      <div className="wv-editor-grid">
        <div className="wv-field">
          <label htmlFor="wv-slot-time">Local time</label>
          <div className="wv-input">
            <input
              id="wv-slot-time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className="wv-field">
          <span className="wv-field-label" id="wv-dose-as">
            Enter dose as
          </span>
          <Segmented
            label="Enter dose as"
            items={[
              { key: 'volume', label: 'Volume' },
              { key: 'seconds', label: 'Pump time' },
            ].map((o) => ({
              ...o,
              on: (byTime ? 'seconds' : 'volume') === o.key,
              onClick: () => {
                if (o.key === 'seconds' && !flow) return;
                setUnit(o.key as 'volume' | 'seconds');
                setAmount('');
              },
            }))}
          />
        </div>
      </div>
      <NumberField
        label={byTime ? 'Pump duration (s)' : 'Dose (mL)'}
        unit={byTime ? 's' : 'mL'}
        min={0.001}
        max={byTime ? 120 : 2000}
        value={amount}
        onValue={setAmount}
        presets={byTime ? [2, 5, 10, 20] : [25, 50, 100, 200]}
        hint={
          flow && Number(volume) > 0
            ? `Stored dose ${volume} mL · ≈ ${formatDuration(Number(volume) / flow)} at ${formatNumber(flow)} mL/s`
            : flow
              ? 'Saved as a volume; the controller converts it with the current calibration.'
              : 'Calibrate to enter pump time instead of volume.'
        }
      />
      <fieldset className="wv-days">
        <legend>Repeat on</legend>
        <div className="wv-day-row">
          {days.map((day, i) => (
            <label key={day} className="wv-day" title={dayNames[i]}>
              <input
                type="checkbox"
                aria-label={dayNames[i]}
                checked={selected.includes(day)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, day]
                      : selected.filter((d) => d !== day),
                  )
                }
              />
              <span aria-hidden="true">{dayNames[i].charAt(0)}</span>
            </label>
          ))}
        </div>
        <div className="chips">
          {(
            [
              ['Every day', [...days]],
              ['Weekdays', days.slice(0, 5)],
              ['Weekends', days.slice(5)],
            ] as const
          ).map(([label, list]) => (
            <button
              key={label}
              type="button"
              className="chip ia"
              aria-pressed={preset([...list])}
              onClick={() => setSelected([...list])}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="wv-inline-alert" role="alert">
          {error}
        </p>
      )}
      <div className="wv-editor-foot">
        {entry ? (
          <button
            type="button"
            className="wv-danger ia"
            disabled={busy}
            onClick={() => void send('sched clear ' + slot)}
          >
            <Glyph name="trash" size={13} />
            Delete slot {slot}
          </button>
        ) : (
          <span />
        )}
        <button className="wv-primary ia" disabled={busy}>
          <Glyph name="check" size={13} />
          Save slot {slot}
        </button>
      </div>
    </form>
  );
}

export function ScheduleTab({
  session,
  status,
  busy,
  send,
  revision,
  utcNow,
}: {
  session: Connection;
  status: Status;
  busy: boolean;
  send: Send;
  revision: number;
  utcNow: number | null;
}) {
  const [listing, setListing] = useState<ReturnType<typeof parseSchedule>>();
  const [failure, setFailure] = useState('');
  const [slot, setSlot] = useState(0);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    session
      .command('sched')
      .then(parseSchedule)
      .then((value) => {
        if (active) {
          setListing(value);
          setFailure('');
        }
      })
      .catch((err) => {
        if (active) {
          setListing(undefined);
          setFailure(errorText(err));
        }
      });
    return () => {
      active = false;
    };
  }, [session, revision, refresh]);
  const entries = listing?.entries ?? [];
  const chosen = slot || entries[0]?.slot || 1;
  const entry = entries.find((e) => e.slot === chosen);
  const clock = utcNow !== null ? localClock(utcNow, status.offset) : null;
  const upcoming =
    listing?.enabled && utcNow !== null && status.scheduleState === 'active'
      ? nextRun(entries, utcNow, status.offset)
      : null;
  const state = STATE_LABEL[status.scheduleState] ?? {
    text: status.scheduleState.replaceAll('_', ' '),
    tone: 'idle',
  };
  return (
    <div className="wv-stack">
      <Card
        title="Weekly schedule"
        icon="calendar"
        className="wv-sched"
        aside={
          <button
            type="button"
            className="ia btn icon-btn--filled wv-refresh"
            onClick={() => setRefresh((x) => x + 1)}
          >
            Refresh schedule
          </button>
        }
      >
        {!listing ? (
          <p
            className={failure ? 'wv-inline-alert' : 'wv-loading'}
            role="status"
          >
            {failure || 'Reading schedule…'}
          </p>
        ) : (
          <>
            <div className="wv-sched-bar">
              <button
                type="button"
                className="wv-switch-row ia"
                aria-label="Automatic watering"
                aria-describedby="wv-auto-note"
                aria-pressed={listing.enabled}
                disabled={busy || (!listing.enabled && !status.flow)}
                onClick={() =>
                  void send(listing.enabled ? 'sched off' : 'sched on')
                }
              >
                <span className="switch" aria-hidden="true" />
                <span>
                  <strong>Automatic watering</strong>
                  <small id="wv-auto-note">
                    {!listing.enabled && !status.flow
                      ? 'Calibrate flow to enable'
                      : listing.enabled
                        ? 'Runs while the browser is closed'
                        : 'All slots paused'}
                  </small>
                </span>
              </button>
              <dl className="wv-sched-stats" role="status">
                <div>
                  <dt>State</dt>
                  <dd>
                    <span className="wv-state-dot" data-tone={state.tone} />
                    {state.text}
                  </dd>
                </div>
                <div>
                  <dt>Slots</dt>
                  <dd>
                    {entries.length} of {SLOTS} slots
                  </dd>
                </div>
                <div>
                  <dt>Grace</dt>
                  <dd>{listing.grace} min</dd>
                </div>
                <div>
                  <dt>Next dose</dt>
                  <dd>
                    {upcoming
                      ? `${dayNames[upcoming.day].slice(0, 3)} ${upcoming.entry.time} · ${when(upcoming.minutesAhead)}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
            <Week
              entries={entries}
              today={clock?.day ?? null}
              nowMinute={clock?.minute ?? null}
              selected={chosen}
              upcoming={
                upcoming
                  ? { slot: upcoming.entry.slot, day: upcoming.day }
                  : null
              }
              paused={!listing.enabled || status.scheduleState !== 'active'}
              onSelect={setSlot}
            />
          </>
        )}
      </Card>
      {listing && (
        <div className="wv-sched-split">
          <Card
            title="Slots"
            icon="clock"
            aside={
              <span className="wv-quiet">
                Each slot waters once on its days
              </span>
            }
          >
            <ul className="wv-slots">
              {Array.from({ length: SLOTS }, (_, n) => {
                const item = entries.find((e) => e.slot === n + 1);
                return (
                  <li key={n}>
                    <button
                      type="button"
                      className="wv-slot ia"
                      data-empty={!item || undefined}
                      aria-pressed={chosen === n + 1}
                      onClick={() => setSlot(n + 1)}
                    >
                      <span className="wv-slot-num">{n + 1}</span>
                      {item ? (
                        <>
                          <span className="wv-slot-time num">{item.time}</span>
                          <span className="wv-slot-meta">
                            {formatNumber(Number(item.volume))} mL ·{' '}
                            {recurrenceLabel(item.recurrence)}
                          </span>
                        </>
                      ) : (
                        <span className="wv-slot-add">
                          <Glyph name="plus" size={12} /> Empty
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          <section className="wv-card wv-editor-card">
            <SlotEditor
              key={[chosen, entry?.time, entry?.volume, entry?.recurrence].join(
                '-',
              )}
              slot={chosen}
              entry={entry}
              flow={status.flow}
              busy={busy}
              send={send}
            />
          </section>
        </div>
      )}
    </div>
  );
}
