import { useState, type FormEvent } from 'react';
import { Segmented } from './segmented';
import type { BrokerForm, Controller } from './watering-controller';
import { Glyph, type GlyphName } from './watering-kit';

const REMEMBER = 'watering.broker';
const serialSupported = () =>
  typeof navigator !== 'undefined' && 'serial' in navigator;

function remembered(): { broker: string; id: string; username: string } {
  try {
    const v = JSON.parse(localStorage.getItem(REMEMBER) ?? 'null');
    return {
      broker: typeof v?.broker === 'string' ? v.broker : '',
      id: typeof v?.id === 'string' ? v.id : 'watering-1',
      username: typeof v?.username === 'string' ? v.username : '',
    };
  } catch {
    return { broker: '', id: 'watering-1', username: '' };
  }
}

const FEATURES: [GlyphName, string, string][] = [
  [
    'drop',
    'Dose on demand',
    'Water by volume or prime by time, with a stop that always gets through.',
  ],
  [
    'calendar',
    'Weekly schedule',
    'Eight slots stored on the controller, so watering runs without this page.',
  ],
  [
    'beaker',
    'Flow calibration',
    'A guided timed trial turns millilitres into accurate pump time.',
  ],
];

/** The visual for a pump at rest: a ring with a drop and a soft ripple. */
function Hero() {
  return (
    <div className="wv-hero-art" aria-hidden="true">
      <span className="wv-ripple" />
      <span className="wv-ripple" />
      <span className="wv-ripple" />
      <span className="wv-hero-drop">
        <Glyph name="drop" size={30} />
      </span>
    </div>
  );
}

export function ConnectScreen({ c }: { c: Controller }) {
  const [saved] = useState(remembered);
  const usbReady = serialSupported();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const form: BrokerForm = {
      broker: f.broker ?? '',
      id: f.id ?? '',
      username: f.username ?? '',
      password: f.password ?? '',
    };
    if (c.mode === 'MQTT') {
      try {
        localStorage.setItem(
          REMEMBER,
          JSON.stringify({
            broker: form.broker.trim(),
            id: form.id.trim(),
            username: form.username,
          }),
        );
      } catch {
        /* Remembering is a convenience only. */
      }
    }
    void c.start(form);
  }
  return (
    <div className="wv-connect">
      <section className="wv-connect-card surface">
        <div className="wv-connect-intro">
          <Hero />
          <span className="tag" data-tone="ok">
            Watering
          </span>
          <h2 id="water-title" tabIndex={-1}>
            Connect a watering controller
          </h2>
          <p>
            Monitor the pump, dose by hand, calibrate flow and edit the schedule
            stored on the controller. Nothing is sent until you connect.
          </p>
          <ul className="wv-features">
            {FEATURES.map(([icon, title, text]) => (
              <li key={title}>
                <span className="wv-feature-icon">
                  <Glyph name={icon} size={14} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="wv-connect-form">
          <span className="section-label">Connection</span>
          <Segmented
            label="Connection method"
            className="wv-seg-lg"
            items={(['USB', 'MQTT'] as const).map((key) => ({
              key,
              label: key === 'USB' ? 'USB cable' : 'MQTT broker',
              on: key === c.mode,
              onClick: () => c.setMode(key),
            }))}
          />
          {c.alert && (
            <div className="wv-banner" data-tone="bad" role="alert">
              <Glyph name="alert" size={14} />
              <div>
                <strong>
                  {c.ended ? 'Connection ended' : 'Couldn’t connect'}
                </strong>
                <span>{c.alert}</span>
              </div>
            </div>
          )}
          <form key={c.mode} className="wv-method" onSubmit={submit}>
            {c.mode === 'USB' ? (
              <>
                <div className="wv-method-head">
                  <span className="wv-method-icon">
                    <Glyph name="usb" size={18} />
                  </span>
                  <div>
                    <strong>Direct USB</strong>
                    <span>Full control, including runtime limits.</span>
                  </div>
                </div>
                <ol className="wv-howto">
                  <li>Connect the controller to this computer by USB.</li>
                  <li>Close any serial monitor that is using the port.</li>
                  <li>
                    Choose the controller’s serial port in the browser prompt.
                  </li>
                </ol>
                <p className="wv-hint">
                  <Glyph name="shield" size={12} /> Keep the board’s power
                  disconnect within reach while you commission it.
                </p>
                {!usbReady && (
                  <p className="wv-banner" data-tone="warn">
                    <Glyph name="info" size={14} />
                    <span>
                      This browser has no Web Serial. Use desktop Chrome or Edge
                      on localhost or HTTPS, or connect through an MQTT broker.
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="wv-method-head">
                  <span className="wv-method-icon">
                    <Glyph name="broker" size={18} />
                  </span>
                  <div>
                    <strong>MQTT over WebSocket</strong>
                    <span>Operate remotely. Limits stay read-only.</span>
                  </div>
                </div>
                <div className="wv-form-grid">
                  <div className="wv-field wv-span-2">
                    <label htmlFor="wv-broker">Broker WebSocket URL</label>
                    <div className="wv-input">
                      <input
                        id="wv-broker"
                        required
                        name="broker"
                        type="url"
                        defaultValue={saved.broker}
                        placeholder="wss://broker.example/mqtt"
                      />
                    </div>
                  </div>
                  <div className="wv-field">
                    <label htmlFor="wv-id">Controller ID</label>
                    <div className="wv-input">
                      <input
                        id="wv-id"
                        required
                        name="id"
                        maxLength={32}
                        pattern="[A-Za-z0-9_\-]+"
                        defaultValue={saved.id}
                      />
                    </div>
                  </div>
                  <div className="wv-field">
                    <label htmlFor="wv-user">Broker username</label>
                    <div className="wv-input">
                      <input
                        id="wv-user"
                        name="username"
                        autoComplete="off"
                        defaultValue={saved.username}
                      />
                    </div>
                  </div>
                  <div className="wv-field wv-span-2">
                    <label htmlFor="wv-pass">Broker password</label>
                    <div className="wv-input">
                      <input
                        id="wv-pass"
                        name="password"
                        type="password"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
                <p className="wv-hint">
                  <Glyph name="lock" size={12} /> The password is used for this
                  connection only and is never stored.
                </p>
              </>
            )}
            <button
              className="wv-primary wv-primary--lg ia"
              disabled={c.connecting || (c.mode === 'USB' && !usbReady)}
            >
              {c.connecting ? (
                <>
                  <span className="wv-spinner" aria-hidden="true" />
                  Connecting…
                </>
              ) : (
                <>
                  {c.mode === 'USB'
                    ? 'Select USB device'
                    : 'Connect to controller'}
                  <Glyph name="arrowRight" size={13} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
