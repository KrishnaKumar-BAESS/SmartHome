import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Segmented } from './segmented';
import {
  connectBroker,
  connectUsb,
  type Connection,
} from './watering-transport';
import {
  days,
  limits,
  parseSchedule,
  parseStatus,
  scheduleCommand,
  type Entry,
  type Limit,
  type Status,
} from './watering-protocol';
import './watering-panel.css';

const errorText = (e: unknown) =>
  e instanceof Error ? e.message : 'Device unavailable.';
type Send = (command: string) => Promise<boolean>;
function data(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget)) as Record<
    string,
    string
  >;
}

function RunForm({
  label,
  action,
  min,
  max,
  unit,
  disabled,
  send,
}: {
  label: string;
  action: string;
  min: number;
  max: number;
  unit: string;
  disabled: boolean;
  send: Send;
}) {
  return (
    <form
      onSubmit={(e) => {
        const f = data(e);
        void send(action + ' ' + f.amount);
      }}
    >
      <label>
        {unit}
        <input
          required
          name="amount"
          type="number"
          min={min}
          max={max}
          step=".001"
        />
      </label>
      <button disabled={disabled}>{label}</button>
    </form>
  );
}

function Schedule({
  session,
  status,
  busy,
  send,
  revision,
}: {
  session: Connection;
  status: Status;
  busy: boolean;
  send: Send;
  revision: number;
}) {
  const [listing, setListing] = useState<ReturnType<typeof parseSchedule>>();
  const [failure, setFailure] = useState('');
  const [slot, setSlot] = useState(1);
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
  const entry = listing?.entries.find((e) => e.slot === slot);
  return (
    <section>
      <h3>Schedule</h3>
      <p>
        Times use the controller’s local clock. Each slot waters this pump once
        on its selected days.
      </p>
      <p role="status">
        {failure ||
          (listing
            ? 'Schedule ' +
              status.scheduleState.replaceAll('_', ' ') +
              ' · ' +
              listing.entries.length +
              ' of 8 slots · ' +
              listing.grace +
              ' min grace'
            : 'Reading schedule…')}
      </p>
      <button onClick={() => setRefresh((x) => x + 1)}>Refresh schedule</button>
      {listing && (
        <>
          <button
            disabled={busy || (!listing.enabled && !status.flow)}
            onClick={() =>
              void send(listing.enabled ? 'sched off' : 'sched on')
            }
          >
            {listing.enabled ? 'Pause schedule' : 'Enable schedule'}
          </button>
          <label>
            Schedule slot
            <select
              value={slot}
              onChange={(e) => setSlot(Number(e.target.value))}
            >
              {Array.from({ length: 8 }, (_, n) => {
                const item = listing.entries.find((e) => e.slot === n + 1);
                return (
                  <option key={n} value={n + 1}>
                    {n + 1} ·{' '}
                    {item
                      ? item.time +
                        ' · ' +
                        item.volume +
                        ' mL · ' +
                        item.recurrence
                      : 'Empty'}
                  </option>
                );
              })}
            </select>
          </label>
          <ScheduleEditor
            key={[slot, entry?.time, entry?.volume, entry?.recurrence].join(
              '-',
            )}
            slot={slot}
            entry={entry}
            flow={status.flow}
            busy={busy}
            send={send}
          />
          {entry && (
            <button
              disabled={busy}
              onClick={() => void send('sched clear ' + slot)}
            >
              Delete slot {slot}
            </button>
          )}
        </>
      )}
    </section>
  );
}
function ScheduleEditor({
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
  const [amount, setAmount] = useState(entry?.volume ?? '');
  const [unit, setUnit] = useState('volume');
  const byTime = unit === 'seconds' && flow !== null;
  // Firmware stores microlitres. Round a duration-derived dose once, at that resolution.
  const volume = byTime
    ? (Math.round(Number(amount) * flow * 1000) / 1000).toString()
    : amount;
  const [selected, setSelected] = useState(
    entry?.recurrence === 'daily'
      ? [...days]
      : entry?.recurrence === 'weekdays'
        ? days.slice(0, 5)
        : entry?.recurrence === 'weekends'
          ? days.slice(5)
          : (entry?.recurrence.split(',') ?? []),
  );
  const [error, setError] = useState('');
  return (
    <form
      onSubmit={(e) => {
        const f = data(e);
        try {
          const recurrence =
            selected.length === 7
              ? 'daily'
              : days.filter((d) => selected.includes(d)).join(',');
          const cmd = scheduleCommand({
            slot,
            time: f.time,
            volume,
            recurrence,
          });
          setError('');
          void send(cmd);
        } catch (err) {
          setError(errorText(err));
        }
      }}
    >
      <label>
        Local time
        <input name="time" type="time" defaultValue={entry?.time} required />
      </label>
      <label>
        Enter dose as
        <select
          value={byTime ? 'seconds' : 'volume'}
          onChange={(e) => {
            setUnit(e.target.value);
            setAmount('');
          }}
        >
          <option value="volume">Volume</option>
          <option value="seconds" disabled={!flow}>
            Pump duration
          </option>
        </select>
      </label>
      <label>
        {byTime ? 'Pump duration (s)' : 'Dose (mL)'}
        <input
          type="number"
          min=".001"
          max={byTime ? 120 : 2000}
          step=".001"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <fieldset>
        <legend>Repeat on</legend>
        {days.map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={selected.includes(day)}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, day]
                    : selected.filter((d) => d !== day),
                )
              }
            />
            {day}
          </label>
        ))}
      </fieldset>
      {flow && Number(volume) > 0 && (
        <p>
          Stored dose {volume} mL · estimated pump time{' '}
          {(Number(volume) / flow).toFixed(2)} s at {flow} mL/s.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button disabled={busy}>Save slot {slot}</button>
    </form>
  );
}

type Names = { name: string; zone: string };
function readNames(key: string): Names {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      name: typeof v?.name === 'string' ? v.name : '',
      zone: typeof v?.zone === 'string' ? v.zone : '',
    };
  } catch {
    return { name: '', zone: '' };
  }
}
function Administration({
  status,
  session,
  busy,
  send,
  names,
  saveNames,
  revision,
}: {
  status: Status;
  session: Connection;
  busy: boolean;
  send: Send;
  names: Names;
  saveNames: (names: Names) => void;
  revision: number;
}) {
  const [key, setKey] = useState<Limit>('max_run_s');
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let active = true;
    session
      .command('config limit.' + key)
      .then((s) => {
        const field = s.split('  #')[0].trim().split('=');
        if (
          field[0] !== 'ok limit.' + key ||
          !field[1] ||
          !Number.isFinite(Number(field[1]))
        )
          throw new Error('Unreadable limit.');
        if (active) {
          setValue(field[1]);
          setMsg('Current setting ' + field[1]);
        }
      })
      .catch((err) => {
        if (active) {
          setMsg(errorText(err));
          setValue('');
        }
      });
    return () => {
      active = false;
    };
  }, [session, key, revision]);
  return (
    <section>
      <h3>Device administration</h3>
      <dl className="water-facts">
        {Object.entries({
          Firmware: status.fw,
          Build: status.build,
          'Device ID': status.id,
          'Last reset': status.reset,
          Uptime: status.uptime + ' s',
          'Device network':
            status.transport +
            ' · ' +
            (status.link ? 'link up' : 'link down') +
            ' · MQTT ' +
            (status.mqtt ? 'connected' : 'disconnected'),
        }).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <form
        onSubmit={(e) => {
          const f = data(e);
          saveNames({ name: f.name.trim(), zone: f.zone.trim() });
        }}
      >
        <label>
          Display name
          <input name="name" maxLength={64} defaultValue={names.name} />
        </label>
        <label>
          Pump zone
          <input name="zone" maxLength={64} defaultValue={names.zone} />
        </label>
        <button>Save browser labels</button>
      </form>
      <form
        onSubmit={(e) => {
          const f = data(e);
          void send('config tz.offset ' + f.offset);
        }}
      >
        <label>
          UTC offset (minutes)
          <input
            key={status.offset}
            required
            name="offset"
            type="number"
            min="-720"
            max="840"
            step="1"
            defaultValue={status.offset}
          />
        </label>
        <button disabled={busy}>Save offset</button>
      </form>
      <h3>Runtime limits</h3>
      <label>
        Limit
        <select
          value={key}
          onChange={(e) => {
            setKey(e.target.value as Limit);
            setValue('');
            setMsg('Reading limit…');
          }}
        >
          {Object.entries(limits).map(([k, l]) => (
            <option value={k} key={k}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <p role="status">{msg}</p>
      {session.usb ? (
        <form
          onSubmit={(e) => {
            const f = data(e);
            void send('config limit.' + key + ' ' + f.limit);
          }}
        >
          <label>
            {limits[key].label}
            <input
              required
              key={key + value}
              defaultValue={value}
              type="number"
              min={limits[key].min}
              max={limits[key].max}
              step=".001"
              name="limit"
            />
          </label>
          <button disabled={busy || !value}>Save limit over USB</button>
        </form>
      ) : (
        <p>Connect directly over USB to change the controller’s limits.</p>
      )}
    </section>
  );
}
function Calibration({
  status,
  session,
  busy,
  send,
  revision,
}: {
  status: Status;
  session: Connection;
  busy: boolean;
  send: Send;
  revision: number;
}) {
  const [trial, setTrial] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    let active = true;
    session
      .command('cal')
      .then((reply) => {
        if (active) {
          setTrial(/\bpending_trial=([\d.]+) s/.exec(reply)?.[1] ?? '');
          setErr('');
        }
      })
      .catch((e) => {
        if (active) {
          setTrial('');
          setErr(errorText(e));
        }
      });
    return () => {
      active = false;
    };
  }, [session, status.state, revision]);
  return (
    <section>
      <h3>Calibrate flow</h3>
      <p>
        {status.flow === null
          ? 'Uncalibrated'
          : 'Stored flow ' + status.flow + ' mL/s'}
      </p>
      <p>
        Prime the tubing, then place the outlet in a graduated vessel. Start a
        timed trial and measure the collected water.
      </p>
      <RunForm
        label="Start trial"
        action="cal run"
        unit="Trial duration (s)"
        min={3}
        max={120}
        disabled={busy || status.state !== 'idle' || !status.storage}
        send={send}
      />
      <p>
        {err ||
          (trial
            ? 'Completed trial · ' + trial + ' s'
            : 'Waiting for a completed trial of at least 3 s.')}
      </p>
      <RunForm
        label="Save measured flow"
        action="cal set"
        unit="Collected water (mL)"
        min={0.001}
        max={4294967.295}
        disabled={!trial || busy || status.state === 'running'}
        send={send}
      />
      <p>
        The controller uses actual pump time and stores the calibration in
        flash.
      </p>
    </section>
  );
}

const tabs = ['Operate', 'Calibration', 'Schedule', 'Administration'];
export default function WateringDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const live = useRef<Connection | null>(null),
    epoch = useRef(0),
    lock = useRef(false);
  const [session, setSession] = useState<Connection | null>(null);
  const [mode, setMode] = useState('USB'),
    [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<Status>(),
    [diagnostic, setDiagnostic] = useState('');
  const [observed, setObserved] = useState(0),
    [tab, setTab] = useState(tabs[0]);
  const [notice, setNotice] = useState(''),
    [alert, setAlert] = useState(''),
    [event, setEvent] = useState('');
  const [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [names, setNames] = useState<Names>({ name: '', zone: '' });
  const latestAction = useRef(0);
  const profile = useRef(''),
    scope = useRef(''),
    identity = useRef('');
  useEffect(() => {
    const element = dialog.current,
      previous = document.activeElement;
    element?.showModal();
    return () => {
      epoch.current = epoch.current + 1;
      live.current?.close();
      live.current = null;
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  function disconnect(reason = '') {
    epoch.current = epoch.current + 1;
    live.current?.close();
    live.current = null;
    setSession(null);
    setStatus(undefined);
    setDiagnostic('');
    setObserved(0);
    setBusy(false);
    lock.current = false;
    setConnecting(false);
    setEvent('');
    setNotice('');
    setAlert(reason);
    profile.current = '';
    identity.current = '';
    setNames({ name: '', zone: '' });
    setTab(tabs[0]);
  }
  async function start(e: FormEvent<HTMLFormElement>) {
    const f = data(e);
    const generation = ++epoch.current;
    setConnecting(true);
    setNotice('');
    setAlert('');
    const signals = {
      lost: (reason: string) => {
        if (epoch.current === generation) disconnect(reason);
      },
      event: (line: string) => {
        if (epoch.current !== generation) return;
        try {
          const v = JSON.parse(line);
          if (typeof v.event === 'string' && !v.replay)
            setEvent([v.event, v.reason, v.end].filter(Boolean).join(' · '));
        } catch {
          /* Ignore malformed event messages. */
        }
      },
    };
    try {
      const connection =
        mode === 'USB'
          ? await connectUsb(signals)
          : await connectBroker(
              f.broker.trim(),
              f.id.trim(),
              f.username,
              f.password,
              signals,
            );
      if (epoch.current !== generation) {
        connection.close();
        return;
      }
      scope.current = connection.usb ? 'usb' : new URL(f.broker.trim()).origin;
      identity.current = connection.usb ? '' : f.id.trim();
      live.current = connection;
      setSession(connection);
      setConnecting(false);
    } catch (err) {
      if (epoch.current === generation) disconnect(errorText(err));
    }
  }
  useEffect(() => {
    if (!session) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const reply = await session!.command('status');
        if (!active) return;
        if (reply.startsWith('esp32s3_network:') && session!.usb) {
          setDiagnostic(reply);
          setStatus(undefined);
        } else {
          const next = parseStatus(reply);
          if (identity.current && next.id !== identity.current)
            throw new Error(
              'Unexpected controller ID. Reconnect to the intended device.',
            );
          identity.current = next.id;
          const key = 'watering.labels.' + scope.current + '.' + next.id;
          if (profile.current !== key) {
            profile.current = key;
            setNames(readNames(key));
          }
          setStatus(next);
          setDiagnostic('');
        }
        setObserved(Date.now());
        timer = setTimeout(() => void refresh(), 1500);
      } catch (err) {
        if (active && live.current === session) disconnect(errorText(err));
      }
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session, revision]);
  async function send(command: string) {
    const target = live.current;
    const stopping = command === 'stop';
    if (
      !target ||
      !status ||
      (!stopping && (lock.current || Date.now() - observed > 8000))
    )
      return false;
    if (!stopping) {
      lock.current = true;
      setBusy(true);
    }
    const action = ++latestAction.current;
    setAlert('');
    setNotice(stopping ? 'Requesting stop…' : 'Waiting for controller…');
    try {
      const reply = await target.command(command);
      if (live.current !== target) return false;
      if (!reply.startsWith('ok '))
        throw new Error('Unexpected device reply. Check pump state.');
      if (action === latestAction.current) setNotice(reply.slice(3));
      setRevision((x) => x + 1);
      return true;
    } catch (err) {
      if (live.current === target && action === latestAction.current) {
        setNotice('');
        setAlert(errorText(err));
        setRevision((x) => x + 1);
      }
      return false;
    } finally {
      if (!stopping && live.current === target) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  function saveNames(value: Names) {
    try {
      localStorage.setItem(profile.current, JSON.stringify(value));
      setNames(value);
      setNotice('Browser labels saved.');
      setAlert('');
    } catch {
      setAlert('Browser storage is unavailable.');
    }
  }
  const runDisabled =
    !status || status.state !== 'idle' || !status.storage || busy;
  return (
    <dialog
      ref={dialog}
      className="pihole-dialog water-dialog"
      aria-labelledby="water-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <header>
        <div>
          <h2 id="water-title">Watering system</h2>
          <p>
            {status
              ? (names.name || status.id) + ' · ' + (names.zone || 'Pump 1')
              : diagnostic
                ? 'ESP32-S3 · network diagnostics'
                : 'Pump management'}
          </p>
        </div>
        <button autoFocus onClick={onClose}>
          Close
        </button>
      </header>
      <div className="pihole-content">
        {!session ? (
          <>
            <Segmented
              label="Connection method"
              items={['USB', 'MQTT'].map((key) => ({
                key,
                label: key,
                on: key === mode,
                onClick: () => {
                  if (!connecting) setMode(key);
                },
              }))}
            />
            <form key={mode} onSubmit={(e) => void start(e)}>
              {mode === 'MQTT' ? (
                <>
                  <label>
                    Broker WebSocket URL
                    <input
                      required
                      name="broker"
                      type="url"
                      placeholder="wss://broker.example/mqtt"
                    />
                  </label>
                  <label>
                    Controller ID
                    <input
                      required
                      name="id"
                      maxLength={32}
                      pattern="[A-Za-z0-9_\-]+"
                      defaultValue="watering-1"
                    />
                  </label>
                  <label>
                    Broker username
                    <input name="username" autoComplete="off" />
                  </label>
                  <label>
                    Broker password
                    <input name="password" type="password" autoComplete="off" />
                  </label>
                </>
              ) : (
                <p>
                  Connect the controller by USB and select its serial port.
                  Close any serial monitor using the port.
                </p>
              )}
              <button disabled={connecting}>
                {connecting
                  ? 'Connecting…'
                  : mode === 'USB'
                    ? 'Select USB device'
                    : 'Connect to controller'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="water-connection">
              <div>
                <strong>
                  {observed ? 'Connected' : 'Identifying device…'}
                </strong>{' '}
                · {session.usb ? 'USB' : 'MQTT'}
                {observed > 0 && (
                  <small>
                    Last report {new Date(observed).toLocaleTimeString()}
                  </small>
                )}
              </div>
              <button onClick={() => disconnect()}>Disconnect</button>
            </div>
            {diagnostic && (
              <section>
                <h3>Network commissioning</h3>
                <p>
                  Pump outputs held off. This sketch supports diagnostics only.
                </p>
                <dl className="water-facts">
                  {diagnostic
                    .replace(/^esp32s3_network:\s*/, '')
                    .split(/;\s*/)
                    .map((item) => {
                      const [k, v] = item.split('=');
                      return (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      );
                    })}
                </dl>
              </section>
            )}
            {status && (
              <>
                <div className="water-state">
                  <div>
                    <span className="section-label">Pump output</span>
                    <strong>{status.state}</strong>
                    <small>
                      {status.source || status.reason}
                      {status.remaining > 0
                        ? ' · ' +
                          (status.remaining / 1000).toFixed(1) +
                          ' s remaining at report'
                        : ''}
                    </small>
                  </div>
                  <button
                    className="water-stop"
                    onClick={() => void send('stop')}
                  >
                    Stop pump
                  </button>
                </div>
                {(!status.storage ||
                  !status.log ||
                  !status.clockTrusted ||
                  status.state === 'inhibited') && (
                  <p role="status">
                    {[
                      !status.storage ? 'Settings or usage storage fault.' : '',
                      !status.log ? 'Event log storage fault.' : '',
                      !status.clockTrusted
                        ? 'Clock untrusted. Scheduled watering paused.'
                        : '',
                      status.state === 'inhibited'
                        ? 'Pump inhibited: ' + status.reason
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                )}
                <Segmented
                  label="Watering controls"
                  items={tabs.map((key) => ({
                    key,
                    label: key,
                    on: tab === key,
                    onClick: () => setTab(key),
                  }))}
                />
                {tab === 'Operate' && (
                  <section>
                    <h3>Manual operation</h3>
                    <p>
                      Prime into a catch container. The controller stops at the
                      requested duration and enforces its runtime and rest
                      limits.
                    </p>
                    <RunForm
                      label="Prime pump"
                      action="run"
                      unit="Prime duration (s)"
                      min={0.001}
                      max={120}
                      disabled={runDisabled}
                      send={send}
                    />
                    <RunForm
                      label="Water by volume"
                      action="water"
                      unit="Dose volume (mL)"
                      min={0.001}
                      max={2000}
                      disabled={runDisabled || !status.flow}
                      send={send}
                    />
                    <dl className="water-facts">
                      <div>
                        <dt>Estimated volume today</dt>
                        <dd>
                          {status.volume} / {status.volumeLimit} mL
                        </dd>
                      </div>
                      <div>
                        <dt>Pump time today</dt>
                        <dd>
                          {status.runtime} / {status.runtimeLimit} s
                        </dd>
                      </div>
                    </dl>
                    {event && (
                      <p>Latest event · {event.replaceAll('_', ' ')}</p>
                    )}
                  </section>
                )}
                {tab === 'Calibration' && (
                  <Calibration {...{ session, status, busy, send, revision }} />
                )}
                {tab === 'Schedule' && (
                  <Schedule {...{ session, status, busy, send, revision }} />
                )}
                {tab === 'Administration' && (
                  <Administration
                    {...{
                      session,
                      status,
                      busy,
                      send,
                      revision,
                      names,
                      saveNames,
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
        {notice && <p role="status">{notice}</p>}
        {alert && <p role="alert">{alert}</p>}
      </div>
    </dialog>
  );
}
