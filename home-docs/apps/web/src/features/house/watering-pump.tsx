import type { Status } from './watering-protocol';
import {
  formatDuration,
  formatNumber,
  sentence,
  sourceLabel,
  transportLabel,
} from './watering-format';
import { STALE_MS, type Send } from './watering-controller';
import { Card, Glyph, Meter } from './watering-kit';
import { useCountdown } from './watering-time';

const STATE_COPY: Record<string, { title: string; lead: string }> = {
  idle: { title: 'Idle', lead: 'Output off · ready for a dose' },
  running: { title: 'Running', lead: 'Pump output on' },
  resting: { title: 'Resting', lead: 'Cooling down before the next dose' },
  inhibited: { title: 'Inhibited', lead: 'The controller is refusing doses' },
};

const R = 66;
const C = 2 * Math.PI * R;

/** The pump's commanded output as a ring: progress through a dose or rest. */
export function PumpDial({
  status,
  remaining,
  progress,
  stale,
}: {
  status: Status;
  remaining: number;
  progress: number;
  stale: boolean;
}) {
  const active = status.state === 'running' || status.state === 'resting';
  return (
    <div
      className="wv-dial"
      data-state={status.state}
      data-stale={stale || undefined}
    >
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="wv-dial-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--dial-a)" />
            <stop offset="1" stopColor="var(--dial-b)" />
          </linearGradient>
        </defs>
        <circle className="wv-dial-glow" cx="80" cy="80" r="56" />
        <circle className="wv-dial-track" cx="80" cy="80" r={R} />
        <circle className="wv-dial-ticks" cx="80" cy="80" r={R + 9} />
        {active ? (
          <circle
            className="wv-dial-arc"
            cx="80"
            cy="80"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 80 80)"
          />
        ) : (
          <circle className="wv-dial-full" cx="80" cy="80" r={R} />
        )}
        {status.state === 'running' && (
          <circle
            className="wv-dial-flow"
            cx="80"
            cy="80"
            r={R - 12}
            transform="rotate(-90 80 80)"
          />
        )}
      </svg>
      <div className="wv-dial-core">
        {active ? (
          <>
            <span className="wv-dial-num num">
              {(remaining / 1000).toFixed(remaining < 10000 ? 1 : 0)}
              <small>s</small>
            </span>
            <span className="wv-dial-cap">
              {status.state === 'running' ? 'remaining' : 'rest left'}
            </span>
          </>
        ) : (
          <span className="wv-dial-drop">
            <Glyph
              name={status.state === 'inhibited' ? 'alert' : 'drop'}
              size={34}
            />
          </span>
        )}
      </div>
    </div>
  );
}

export function PumpCard({
  status,
  observed,
  now,
  send,
}: {
  status: Status;
  observed: number;
  now: number;
  send: Send;
}) {
  const { remaining, progress } = useCountdown(status, observed, now);
  const age = now - observed;
  const stale = age > 4000;
  const copy = STATE_COPY[status.state] ?? STATE_COPY.idle;
  const lead =
    status.state === 'running' && status.source
      ? `${sourceLabel(status.source)} dose · output on`
      : status.state === 'inhibited' && status.reason
        ? sentence(status.reason)
        : copy.lead;
  const last = status.lastDose;
  return (
    <section
      className="wv-card wv-pump"
      data-state={status.state}
      aria-label="Pump output"
    >
      <div className="wv-pump-top">
        <span className="section-label">Pump output</span>
        <span className="wv-pump-chip" data-state={status.state}>
          <span className="wv-pulse" />
          {copy.title}
        </span>
      </div>
      <PumpDial
        status={status}
        remaining={remaining}
        progress={progress}
        stale={stale}
      />
      <div className="wv-pump-text">
        <strong className="wv-pump-state" aria-live="polite">
          {status.state}
        </strong>
        <span>{lead}</span>
        {stale && (
          <span className="wv-stale">
            {age > STALE_MS
              ? 'Reports stalled · new commands paused'
              : 'Waiting for the next report…'}
          </span>
        )}
      </div>
      <button
        type="button"
        className="wv-stop ia"
        data-armed={status.state === 'running' || undefined}
        onClick={() => void send('stop')}
      >
        <Glyph name="stop" size={14} />
        Stop pump
      </button>
      {last && (
        <p className="wv-last">
          <span>Last dose</span>
          {[
            sourceLabel(last.source),
            formatDuration(last.seconds),
            last.ml !== null ? `≈ ${formatNumber(last.ml, 1)} mL` : '',
            sentence(last.end),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </section>
  );
}

export function TodayCard({ status }: { status: Status }) {
  return (
    <Card
      title="Today"
      icon="gauge"
      aside={<span className="wv-quiet">Resets at controller midnight</span>}
    >
      <div className="wv-meters">
        <Meter
          label="Water (estimated)"
          value={status.volume}
          limit={status.volumeLimit}
          unit="mL"
        />
        <Meter
          label="Pump time"
          value={status.runtime}
          limit={status.runtimeLimit}
          unit="s"
        />
      </div>
    </Card>
  );
}

type Row = {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'idle';
};

export function HealthCard({
  status,
  usb,
  onCalibrate,
}: {
  status: Status;
  usb: boolean;
  onCalibrate: () => void;
}) {
  const network = [
    status.transport ? transportLabel(status.transport) : '',
    status.link ? 'link up' : 'link down',
    status.mqtt ? 'MQTT on' : 'MQTT off',
    status.rssi !== null ? `${status.rssi} dBm` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const rows: Row[] = [
    {
      label: 'Flow calibration',
      value:
        status.flow === null
          ? 'Not calibrated'
          : `${formatNumber(status.flow)} mL/s`,
      tone: status.flow === null ? 'warn' : 'ok',
    },
    {
      label: 'Clock',
      value: status.clockTrusted
        ? `Trusted${status.clockSource ? ' · ' + status.clockSource.toUpperCase() : ''}`
        : 'Untrusted · schedule paused',
      tone: status.clockTrusted ? 'ok' : 'warn',
    },
    {
      label: 'Settings storage',
      value: status.storage ? 'Healthy' : 'Fault',
      tone: status.storage ? 'ok' : 'bad',
    },
    {
      label: 'Event log',
      value: status.log ? 'Healthy' : 'Fault',
      tone: status.log ? 'ok' : 'bad',
    },
    {
      label: 'Device network',
      value: network,
      tone: status.link ? 'ok' : usb ? 'idle' : 'warn',
    },
  ];
  const issues = rows.filter(
    (r) => r.tone === 'bad' || r.tone === 'warn',
  ).length;
  return (
    <Card
      title="Health"
      icon="shield"
      aside={
        <span
          className="tag"
          data-tone={
            rows.some((r) => r.tone === 'bad') ? 'bad' : issues ? 'warn' : 'ok'
          }
        >
          {issues ? `${issues} to review` : 'All clear'}
        </span>
      }
    >
      <ul className="wv-health">
        {rows.map((r) => (
          <li key={r.label} data-tone={r.tone}>
            <span className="wv-health-dot" aria-hidden="true" />
            <span className="wv-health-label">{r.label}</span>
            <span className="wv-health-value">
              {r.label === 'Flow calibration' && status.flow === null ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={onCalibrate}
                >
                  Calibrate
                </button>
              ) : (
                r.value
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
