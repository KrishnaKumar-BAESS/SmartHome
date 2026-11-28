import { useEffect, useRef, useState } from 'react';
import { Segmented } from './segmented';
import { useWateringController, type Controller } from './watering-controller';
import { ConnectScreen } from './watering-connect';
import { HealthCard, PumpCard, TodayCard } from './watering-pump';
import { OperateTab } from './watering-operate';
import { ScheduleTab } from './watering-schedule';
import { CalibrateTab } from './watering-calibrate';
import { DeviceTab } from './watering-device';
import { Card, Glyph } from './watering-kit';
import { sentence } from './watering-format';
import { ago, useCountdown, useNow } from './watering-time';
import type { Status } from './watering-protocol';
import './watering-panel.css';

const TABS = ['Operate', 'Schedule', 'Calibration', 'Device'] as const;
type Tab = (typeof TABS)[number];

/** A persistent live region, so the first message is announced too. */
function Toast({ c }: { c: Controller }) {
  const bad = !!c.alert;
  const text = bad ? c.alert : c.notice;
  return (
    <div className="wv-toast-host" aria-live="polite">
      {text && (
        <div className="wv-toast" data-tone={bad ? 'bad' : 'ok'}>
          <Glyph name={bad ? 'alert' : 'check'} size={14} />
          <p role={bad ? 'alert' : 'status'}>{text}</p>
          <button
            type="button"
            className="icon-btn ia"
            aria-label="Dismiss message"
            onClick={c.dismiss}
          >
            <Glyph name="close" size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ c, now }: { c: Controller; now: number }) {
  const { status, session, names } = c;
  const age = c.observed ? now - c.observed : 0;
  const live = c.observed > 0 && age < 4000;
  const title = status
    ? names.name || status.id
    : c.diagnostic
      ? 'ESP32-S3 controller'
      : 'Watering';
  const sub = status
    ? [
        names.zone || 'Pump 1',
        status.id !== title ? status.id : '',
        'Firmware ' + status.fw,
      ]
        .filter(Boolean)
        .join(' · ')
    : c.diagnostic
      ? 'Network diagnostics · pump held off'
      : 'Identifying the controller…';
  return (
    <header className="wv-head surface">
      <span className="wv-head-icon" data-state={status?.state}>
        <Glyph name="drop" size={20} />
      </span>
      <div className="wv-head-text">
        <h2 id="water-title" tabIndex={-1}>
          {title}
        </h2>
        <p>{sub}</p>
      </div>
      <div className="wv-head-aside">
        <span
          className="wv-link"
          data-live={live || undefined}
          data-wait={!c.observed || undefined}
        >
          <span className="wv-link-dot" aria-hidden="true" />
          <span className="wv-link-text">
            <strong>
              {c.observed
                ? live
                  ? 'Connected'
                  : 'Reconnecting…'
                : 'Identifying device…'}
            </strong>
            <span>
              {session?.usb ? 'USB' : 'MQTT'}
              {c.observed > 0 && ` · updated ${ago(age)}`}
            </span>
          </span>
        </span>
        <button type="button" className="btn ia" onClick={() => c.disconnect()}>
          Disconnect
        </button>
      </div>
    </header>
  );
}

/** Pinned to the bottom on phones so a stop is always one tap away. */
function Dock({
  c,
  status,
  now,
}: {
  c: Controller;
  status: Status;
  now: number;
}) {
  const { remaining } = useCountdown(status, c.observed, now);
  const active = status.state === 'running' || status.state === 'resting';
  return (
    <div className="wv-dock surface" data-state={status.state}>
      <span className="wv-pulse" aria-hidden="true" />
      <div>
        <strong>
          {status.state.charAt(0).toUpperCase() + status.state.slice(1)}
        </strong>
        <span className="num">
          {active ? `${(remaining / 1000).toFixed(1)} s left` : 'Output off'}
        </span>
      </div>
      <button
        type="button"
        className="wv-stop ia"
        onClick={() => void c.send('stop')}
      >
        <Glyph name="stop" size={13} />
        Stop pump
      </button>
    </div>
  );
}

/** Controller conditions that change what the operator can do. */
function Attention({ status }: { status: Status }) {
  const items: [string, string, 'bad' | 'warn'][] = [];
  if (status.state === 'inhibited')
    items.push([
      'Pump inhibited',
      `${sentence(status.reason || 'fault')}. The controller refuses every dose until it recovers.`,
      'bad',
    ]);
  if (!status.storage)
    items.push([
      'Settings storage fault',
      'Doses are held, and changes may not persist across a restart.',
      'bad',
    ]);
  if (!status.log)
    items.push([
      'Event log storage fault',
      'The controller cannot record its history right now.',
      'warn',
    ]);
  if (!status.clockTrusted)
    items.push([
      'Clock untrusted',
      'Scheduled watering is paused until the controller’s clock is set.',
      'warn',
    ]);
  if (!items.length) return null;
  return (
    <div className="wv-attention" role="status">
      {items.map(([title, text, tone]) => (
        <div key={title} className="wv-banner" data-tone={tone}>
          <Glyph name="alert" size={14} />
          <div>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const DIAG_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  ssid: 'Network',
  ip: 'IP address',
  rssi: 'Signal (dBm)',
  mqtt: 'MQTT',
  ble: 'Bluetooth',
  pump: 'Pump output',
};

function Diagnostics({ text }: { text: string }) {
  return (
    <Card
      title="Network commissioning firmware"
      icon="globe"
      className="wv-diag"
    >
      <p className="wv-banner" data-tone="warn">
        <Glyph name="lock" size={14} />
        <span>
          Pump outputs are held off. This sketch reports diagnostics only.
        </span>
      </p>
      <dl className="wv-facts">
        {text
          .replace(/^esp32s3_network:\s*/, '')
          .split(/;\s*/)
          .filter(Boolean)
          .map((item) => {
            const [k, v] = item.split('=');
            return (
              <div key={k}>
                <dt>{DIAG_LABELS[k] ?? sentence(k)}</dt>
                <dd>{v ?? '—'}</dd>
              </div>
            );
          })}
      </dl>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="wv-body" aria-busy="true">
      <div className="wv-rail">
        <div className="wv-card wv-skel" style={{ height: 380 }} />
        <div className="wv-card wv-skel" style={{ height: 150 }} />
      </div>
      <div className="wv-main">
        <div className="wv-card wv-skel" style={{ height: 40 }} />
        <div className="wv-card wv-skel" style={{ height: 260 }} />
        <p className="wv-loading" role="status">
          Reading controller status…
        </p>
      </div>
    </div>
  );
}

function Workspace({ c }: { c: Controller }) {
  const [tab, setTab] = useState<Tab>('Operate');
  const status = c.status;
  const now = useNow(
    !!c.session,
    status?.state === 'running' || status?.state === 'resting' ? 100 : 1000,
  );
  if (!c.session) return null;
  const session = c.session;
  const utcNow =
    status?.clockUtc != null
      ? status.clockUtc + (now - c.observed) / 1000
      : status?.clockTrusted
        ? now / 1000
        : null;
  const common = { session, busy: c.busy, send: c.send, revision: c.revision };
  return (
    <div className="wv-workspace" data-tab={tab}>
      <Header c={c} now={now} />
      {c.diagnostic ? (
        <div className="wv-body wv-body--single">
          <Diagnostics text={c.diagnostic} />
        </div>
      ) : !status ? (
        <Skeleton />
      ) : (
        <div className="wv-body">
          <aside className="wv-rail" aria-label="Controller status">
            <PumpCard
              status={status}
              observed={c.observed}
              now={now}
              send={c.send}
            />
            <TodayCard status={status} />
            <HealthCard
              status={status}
              usb={session.usb}
              onCalibrate={() => setTab('Calibration')}
            />
          </aside>
          <div className="wv-main">
            <div className="wv-tabs">
              <Segmented
                label="Watering controls"
                className="wv-seg-lg"
                items={TABS.map((key) => ({
                  key,
                  label: key,
                  on: tab === key,
                  onClick: () => setTab(key),
                }))}
              />
            </div>
            <Attention status={status} />
            <div className="wv-panel" key={tab}>
              {tab === 'Operate' && (
                <OperateTab
                  status={status}
                  busy={c.busy}
                  send={c.send}
                  activity={c.activity}
                  now={now}
                  onCalibrate={() => setTab('Calibration')}
                />
              )}
              {tab === 'Schedule' && (
                <ScheduleTab {...common} status={status} utcNow={utcNow} />
              )}
              {tab === 'Calibration' && (
                <CalibrateTab {...common} status={status} />
              )}
              {tab === 'Device' && (
                <DeviceTab
                  {...common}
                  status={status}
                  names={c.names}
                  saveNames={c.saveNames}
                  utcNow={utcNow}
                />
              )}
            </div>
          </div>
          <Dock c={c} status={status} now={now} />
        </div>
      )}
      <Toast c={c} />
    </div>
  );
}

export default function WateringView() {
  const c = useWateringController();
  const root = useRef<HTMLElement>(null);
  const live = !!c.session;
  // Connecting or disconnecting swaps the whole layout. Start the new one at
  // its top instead of where the operator scrolled to reach the button.
  useEffect(() => {
    for (let el = root.current?.parentElement; el; el = el.parentElement)
      if (el.scrollTop > 0) el.scrollTop = 0;
  }, [live]);
  return (
    <section ref={root} className="wv" aria-label="Watering system">
      {c.session ? <Workspace key="live" c={c} /> : <ConnectScreen c={c} />}
    </section>
  );
}
