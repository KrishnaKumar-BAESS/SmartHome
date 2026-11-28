import { useState, type FormEvent } from 'react';
import type { Status } from './watering-protocol';
import { formatDuration, formatNumber } from './watering-format';
import type { Activity, Send } from './watering-controller';
import { Card, Glyph, NumberField } from './watering-kit';
import { ago } from './watering-time';

/** Why a new dose cannot start right now, in the operator's words. */
function blockedReason(status: Status, busy: boolean) {
  if (busy) return 'Waiting for the controller to answer…';
  if (status.state === 'running')
    return 'A dose is running. Stop it or wait for it to finish.';
  if (status.state === 'resting')
    return 'The pump is resting before its next dose.';
  if (status.state === 'inhibited')
    return 'The controller is inhibiting doses.';
  if (!status.storage) return 'Doses are held until settings storage recovers.';
  return '';
}

function DoseCard({
  kind,
  status,
  busy,
  send,
  onCalibrate,
}: {
  kind: 'water' | 'prime';
  status: Status;
  busy: boolean;
  send: Send;
  onCalibrate: () => void;
}) {
  const [value, setValue] = useState('');
  const water = kind === 'water';
  const blocked = blockedReason(status, busy);
  const needsFlow = water && !status.flow;
  const n = Number(value);
  const estimate =
    status.flow && n > 0
      ? water
        ? `≈ ${formatDuration(n / status.flow)} of pump time at ${formatNumber(status.flow)} mL/s`
        : `≈ ${formatNumber(n * status.flow, 1)} mL at the calibrated flow`
      : water
        ? 'Volume converts to pump time using the calibrated flow.'
        : 'Runs the pump for exactly this long, within the device limits.';
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send((water ? 'water ' : 'run ') + value).then((ok) => {
      if (ok) setValue('');
    });
  }
  return (
    <form className="wv-card wv-dose" data-kind={kind} onSubmit={submit}>
      <header className="wv-card-head">
        <span className="wv-card-icon">
          <Glyph name={water ? 'drop' : 'timer'} size={14} />
        </span>
        <h3>{water ? 'Water by volume' : 'Prime by time'}</h3>
      </header>
      <p className="wv-lead">
        {water
          ? 'Deliver a measured dose. The controller times the pump from its calibration.'
          : 'Fill the tubing or test the outlet. Run into a catch container.'}
      </p>
      <NumberField
        large
        label={water ? 'Dose volume (mL)' : 'Prime duration (s)'}
        unit={water ? 'mL' : 's'}
        placeholder={water ? 'Enter a volume' : 'Enter seconds'}
        min={0.001}
        max={water ? 2000 : 120}
        value={value}
        onValue={setValue}
        presets={water ? [25, 50, 100, 250] : [2, 5, 10, 30]}
        disabled={needsFlow}
        hint={estimate}
      />
      <div className="wv-dose-foot">
        {needsFlow ? (
          <p className="wv-blocked">
            <Glyph name="beaker" size={13} />
            Calibrate the pump’s flow to dose by volume.{' '}
            <button type="button" className="link-button" onClick={onCalibrate}>
              Start calibration
            </button>
          </p>
        ) : blocked ? (
          <p className="wv-blocked">
            <Glyph name="lock" size={13} />
            {blocked}
          </p>
        ) : (
          <span />
        )}
        <button
          className="wv-primary ia"
          disabled={!!blocked || needsFlow || !(n > 0)}
        >
          <Glyph name="play" size={12} />
          {water ? 'Water now' : 'Prime pump'}
        </button>
      </div>
    </form>
  );
}

function ActivityList({ items, now }: { items: Activity[]; now: number }) {
  return (
    <Card
      title="Session activity"
      icon="pulse"
      aside={<span className="wv-quiet">This connection only</span>}
      className="wv-activity"
    >
      {items.length ? (
        <ol className="wv-feed">
          {items.map((a) => (
            <li key={a.id} data-tone={a.tone}>
              <span className="wv-feed-mark" aria-hidden="true">
                <Glyph
                  name={a.origin === 'device' ? 'chip' : 'user'}
                  size={12}
                />
              </span>
              <div>
                <strong>{a.title}</strong>
                <span>
                  {[a.origin === 'device' ? 'Controller' : 'You', a.detail]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <time dateTime={new Date(a.at).toISOString()}>
                {ago(now - a.at)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <div className="wv-empty">
          <Glyph name="wave" size={22} />
          <p>
            Doses you start and events the controller reports appear here while
            you stay connected.
          </p>
        </div>
      )}
    </Card>
  );
}

export function OperateTab({
  status,
  busy,
  send,
  activity,
  now,
  onCalibrate,
}: {
  status: Status;
  busy: boolean;
  send: Send;
  activity: Activity[];
  now: number;
  onCalibrate: () => void;
}) {
  return (
    <div className="wv-stack">
      <div className="wv-doses">
        <DoseCard kind="water" {...{ status, busy, send, onCalibrate }} />
        <DoseCard kind="prime" {...{ status, busy, send, onCalibrate }} />
      </div>
      <p className="wv-footnote">
        <Glyph name="shield" size={12} />
        The controller enforces its maximum run, rest interval and daily budgets
        on every dose. Volumes are estimates from calibrated flow; this hardware
        has no flow or moisture sensing.
      </p>
      <ActivityList items={activity} now={now} />
    </div>
  );
}
