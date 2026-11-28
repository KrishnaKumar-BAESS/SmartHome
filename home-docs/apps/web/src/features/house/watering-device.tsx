import { useEffect, useState, type FormEvent } from 'react';
import type { Connection } from './watering-transport';
import { limits, type Limit, type Status } from './watering-protocol';
import {
  formatDuration,
  formatOffset,
  localClock,
  sentence,
  transportLabel,
} from './watering-format';
import { errorText, type Names, type Send } from './watering-controller';
import { Card, Glyph } from './watering-kit';

const LIMIT_INFO: Record<Limit, { unit: string; help: string }> = {
  max_run_s: { unit: 's', help: 'Longest single dose' },
  rest_s: { unit: 's', help: 'Pause enforced between doses' },
  daily_ml: { unit: 'mL', help: 'Estimated volume per controller day' },
  daily_run_s: { unit: 's', help: 'Pump time per controller day' },
};
const KEYS = Object.keys(limits) as Limit[];

function readLimit(reply: string, key: Limit) {
  const field = reply.split('  #')[0].trim().split('=');
  if (
    field[0] !== 'ok limit.' + key ||
    !field[1] ||
    !Number.isFinite(Number(field[1]))
  )
    throw new Error('Unreadable limit.');
  return field[1];
}

function LimitRow({
  k,
  value,
  usb,
  busy,
  send,
}: {
  k: Limit;
  value: string | undefined;
  usb: boolean;
  busy: boolean;
  send: Send;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const info = LIMIT_INFO[k];
  const changed = draft !== '' && draft !== value;
  return (
    <li className="wv-limit">
      <div className="wv-limit-text">
        <strong>{limits[k].label.replace(/ \(.*\)$/, '')}</strong>
        <span>{info.help}</span>
      </div>
      {usb ? (
        <form
          className="wv-limit-edit"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            void send('config limit.' + k + ' ' + draft);
          }}
        >
          <div className="wv-input wv-input--sm">
            <input
              aria-label={limits[k].label}
              required
              type="number"
              min={limits[k].min}
              max={limits[k].max}
              step=".001"
              value={draft}
              disabled={value === undefined}
              onChange={(e) => setDraft(e.target.value)}
            />
            <span className="wv-unit" aria-hidden="true">
              {info.unit}
            </span>
          </div>
          <button
            className="btn ia wv-limit-save"
            disabled={busy || !changed}
            aria-label={'Save ' + limits[k].label.toLowerCase()}
          >
            Save
          </button>
        </form>
      ) : (
        <span className="wv-limit-value num" aria-label={limits[k].label}>
          {value === undefined ? '…' : `${value} ${info.unit}`}
        </span>
      )}
    </li>
  );
}

function Limits({
  session,
  busy,
  send,
  revision,
}: {
  session: Connection;
  busy: boolean;
  send: Send;
  revision: number;
}) {
  const [values, setValues] = useState<Partial<Record<Limit, string>>>({});
  const [msg, setMsg] = useState('');
  // One read at a time: the serial line answers commands in order, and a
  // burst behind the status poll could outlast a reply timeout.
  useEffect(() => {
    let active = true;
    (async () => {
      const next: Partial<Record<Limit, string>> = {};
      try {
        for (const key of KEYS) {
          next[key] = readLimit(
            await session.command('config limit.' + key),
            key,
          );
          if (!active) return;
          setValues({ ...next });
        }
        setMsg('');
      } catch (err) {
        if (active) setMsg(errorText(err));
      }
    })();
    return () => {
      active = false;
    };
  }, [session, revision]);
  return (
    <Card
      title="Runtime limits"
      icon="shield"
      className="wv-limits"
      aside={
        session.usb ? (
          <span className="tag" data-tone="ok">
            Editable over USB
          </span>
        ) : (
          <span className="tag tag--plain">
            <Glyph name="lock" size={11} /> Read-only
          </span>
        )
      }
    >
      <ul
        className="wv-limit-list"
        aria-busy={KEYS.some((k) => values[k] === undefined)}
      >
        {KEYS.map((k) => (
          <LimitRow
            key={k + (values[k] ?? '')}
            k={k}
            value={values[k]}
            usb={session.usb}
            busy={busy}
            send={send}
          />
        ))}
      </ul>
      {msg && (
        <p className="wv-inline-alert" role="alert">
          {msg}
        </p>
      )}
      <p className="wv-footnote">
        <Glyph name="lock" size={12} />
        {session.usb
          ? 'Limits are stored in the controller and apply to every dose, including scheduled ones.'
          : 'Connect directly over USB to change the controller’s limits. MQTT can read them only.'}
      </p>
    </Card>
  );
}

export function DeviceTab({
  status,
  session,
  busy,
  send,
  names,
  saveNames,
  revision,
  utcNow,
}: {
  status: Status;
  session: Connection;
  busy: boolean;
  send: Send;
  names: Names;
  saveNames: (names: Names) => void;
  revision: number;
  utcNow: number | null;
}) {
  const [offset, setOffset] = useState(String(status.offset));
  const browserOffset = -new Date().getTimezoneOffset();
  const local = utcNow !== null ? localClock(utcNow, status.offset) : null;
  const facts: [string, string][] = [
    ['Device ID', status.id],
    ['Firmware', status.fw],
    ['Build', status.build],
    ['Last reset', sentence(status.reset)],
    ['Uptime', formatDuration(status.uptime)],
    ['Transport', transportLabel(status.transport) || '—'],
    ['Network link', status.link ? 'Up' : 'Down'],
    ['MQTT', status.mqtt ? 'Connected' : 'Disconnected'],
  ];
  if (status.ip) facts.push(['IP address', status.ip]);
  if (status.rssi !== null)
    facts.push(['Signal', `${String(status.rssi).replace('-', '−')} dBm`]);
  return (
    <div className="wv-device">
      <div className="wv-col">
        <Card title="Labels" icon="pencil" className="wv-labels">
          <form
            className="wv-label-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(
                new FormData(e.currentTarget),
              ) as Record<string, string>;
              saveNames({ name: f.name.trim(), zone: f.zone.trim() });
            }}
          >
            <div className="wv-field">
              <label htmlFor="wv-name">Display name</label>
              <div className="wv-input">
                <input
                  id="wv-name"
                  name="name"
                  maxLength={64}
                  defaultValue={names.name}
                  placeholder={status.id}
                />
              </div>
            </div>
            <div className="wv-field">
              <label htmlFor="wv-zone">Pump zone</label>
              <div className="wv-input">
                <input
                  id="wv-zone"
                  name="zone"
                  maxLength={64}
                  defaultValue={names.zone}
                  placeholder="Pump 1"
                />
              </div>
            </div>
            <div className="wv-label-foot">
              <p className="wv-hint">
                Saved in this browser for this controller only.
              </p>
              <button className="btn ia">Save browser labels</button>
            </div>
          </form>
        </Card>
        <Limits session={session} busy={busy} send={send} revision={revision} />
      </div>
      <div className="wv-col">
        <Card title="Controller clock" icon="clock" className="wv-clock">
          <div className="wv-clock-face">
            <span className="wv-clock-time num">{local?.hhmm ?? '--:--'}</span>
            <span className="wv-clock-zone">
              {formatOffset(status.offset)}
              <span
                className="wv-state-dot"
                data-tone={status.clockTrusted ? 'ok' : 'warn'}
              />
              {status.clockTrusted ? 'Trusted' : 'Untrusted'}
              {status.clockSource && status.clockSource !== 'none'
                ? ' · ' + status.clockSource.toUpperCase()
                : ''}
            </span>
          </div>
          <form
            className="wv-offset"
            onSubmit={(e) => {
              e.preventDefault();
              void send('config tz.offset ' + offset);
            }}
          >
            <div className="wv-field">
              <label htmlFor="wv-offset">UTC offset (minutes)</label>
              <div className="wv-input">
                <input
                  id="wv-offset"
                  required
                  type="number"
                  min="-720"
                  max="840"
                  step="1"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                />
                <span className="wv-unit" aria-hidden="true">
                  {Number.isInteger(Number(offset))
                    ? formatOffset(Number(offset))
                    : 'min'}
                </span>
              </div>
            </div>
            <div className="wv-offset-actions">
              <button
                type="button"
                className="chip ia"
                aria-pressed={Number(offset) === browserOffset}
                onClick={() => setOffset(String(browserOffset))}
              >
                Use this browser’s zone ({formatOffset(browserOffset)})
              </button>
              <button
                className="btn ia"
                disabled={busy || Number(offset) === status.offset}
              >
                Save offset
              </button>
            </div>
          </form>
          <p className="wv-footnote">
            <Glyph name="info" size={12} />
            Schedules follow this offset. Daylight-saving changes need a manual
            update.
          </p>
        </Card>
        <Card title="Controller" icon="chip" className="wv-facts-card">
          <dl className="wv-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
