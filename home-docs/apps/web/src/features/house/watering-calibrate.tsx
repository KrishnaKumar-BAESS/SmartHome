import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Connection } from './watering-transport';
import type { Status } from './watering-protocol';
import { formatNumber } from './watering-format';
import { errorText, type Send } from './watering-controller';
import { Card, Glyph, NumberField } from './watering-kit';

function Step({
  n,
  state,
  title,
  children,
}: {
  n: number;
  state: 'done' | 'active' | 'todo' | 'next';
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="wv-step" data-state={state}>
      <span className="wv-step-mark" aria-hidden="true">
        {state === 'done' ? <Glyph name="check" size={12} /> : n}
      </span>
      <div className="wv-step-body">
        <h4>
          {title}
          <span className="sr-only">
            {state === 'done'
              ? ' (done)'
              : state === 'active'
                ? ' (current step)'
                : ''}
          </span>
        </h4>
        {children}
      </div>
    </li>
  );
}

export function CalibrateTab({
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
  const [seconds, setSeconds] = useState('');
  const [ml, setMl] = useState('');
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
  const running = status.state === 'running';
  const trialBlocked = busy || status.state !== 'idle' || !status.storage;
  const preview = trial && Number(ml) > 0 ? Number(ml) / Number(trial) : null;
  const submit =
    (command: string, value: string, reset: (v: string) => void) =>
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void send(command + ' ' + value).then((ok) => ok && reset(''));
    };
  return (
    <div className="wv-stack">
      <section
        className="wv-card wv-flow-hero"
        aria-labelledby="wv-flow-label"
        data-calibrated={status.flow !== null || undefined}
      >
        <div className="wv-flow-icon">
          <Glyph name="beaker" size={22} />
        </div>
        <div>
          <span className="section-label" id="wv-flow-label">
            Stored flow
          </span>
          <p className="wv-flow-value">
            {status.flow === null ? (
              'Uncalibrated'
            ) : (
              <>
                <span className="num">{formatNumber(status.flow)}</span>
                <small> mL/s</small>
              </>
            )}
          </p>
          <p className="wv-lead">
            {status.flow === null
              ? 'Calibrate once so the controller can turn volumes into pump time.'
              : 'Saved in the controller’s flash. Recalibrate after changing the pump, tubing or outlet height.'}
          </p>
        </div>
      </section>
      <Card title="Calibrate flow" icon="gauge">
        <ol className="wv-steps">
          <Step
            n={1}
            state={trial || running ? 'done' : 'todo'}
            title="Prepare the outlet"
          >
            <p>
              Prime the tubing until water reaches the outlet, then place the
              outlet in a graduated vessel and empty it.
            </p>
          </Step>
          <Step
            n={2}
            state={trial && !running ? 'done' : 'active'}
            title="Run a timed trial"
          >
            <form
              className="wv-inline-form"
              onSubmit={submit('cal run', seconds, setSeconds)}
            >
              <NumberField
                label="Trial duration (s)"
                placeholder="Seconds"
                unit="s"
                min={3}
                max={120}
                value={seconds}
                onValue={setSeconds}
                presets={[10, 20, 30]}
                hint="Longer trials measure flow more precisely. Minimum 3 s."
              />
              <button
                className="wv-primary ia"
                disabled={trialBlocked || !(Number(seconds) >= 3)}
              >
                <Glyph name="play" size={12} />
                Start trial
              </button>
            </form>
            {running && (
              <p className="wv-progress-note">
                Trial running · watch the pump ring for time left.
              </p>
            )}
          </Step>
          <Step
            n={3}
            state={trial && !running ? 'active' : 'next'}
            title="Record what you collected"
          >
            <p className={err ? 'wv-inline-alert' : 'wv-trial'} role="status">
              {err ||
                (trial ? (
                  <>
                    <Glyph name="check" size={12} /> Completed trial · {trial} s
                  </>
                ) : (
                  'Waiting for a completed trial of at least 3 s.'
                ))}
            </p>
            <form
              className="wv-inline-form"
              onSubmit={submit('cal set', ml, setMl)}
            >
              <NumberField
                label="Collected water (mL)"
                placeholder="Measured volume"
                unit="mL"
                min={0.001}
                max={4294967.295}
                value={ml}
                onValue={setMl}
                disabled={!trial}
                hint={
                  preview !== null
                    ? `Saves a flow of ${formatNumber(preview)} mL/s`
                    : 'Read the vessel at eye level for the most accurate figure.'
                }
              />
              <button
                className="wv-primary ia"
                disabled={!trial || busy || running || !(Number(ml) > 0)}
              >
                <Glyph name="check" size={12} />
                Save measured flow
              </button>
            </form>
          </Step>
        </ol>
        <p className="wv-footnote">
          <Glyph name="info" size={12} />
          The controller uses the pump’s actual run time, so a stopped or
          cut-off trial still calibrates correctly. Verify with a different
          volume afterwards.
        </p>
      </Card>
    </div>
  );
}
