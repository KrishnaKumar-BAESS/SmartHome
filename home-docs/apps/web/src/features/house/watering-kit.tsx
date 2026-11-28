import { useId, type ReactNode } from 'react';

/** Watering glyphs on the app's 16-unit, 1.5-stroke icon grid. */
const GLYPHS = {
  drop: 'M8 1.8C6.6 3.9 3.6 7 3.6 9.6a4.4 4.4 0 0 0 8.8 0C12.4 7 9.4 3.9 8 1.8zM5.9 9.8a2.2 2.2 0 0 0 2.2 2.2',
  usb: 'M6 1.8h4v3.4H6zM4.6 5.2h6.8v4.2a3.4 3.4 0 0 1-6.8 0zM8 12.8v1.8',
  broker:
    'M8 9.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM5.2 10.8a4 4 0 0 1 0-5.6M10.8 5.2a4 4 0 0 1 0 5.6M3.2 12.8a6.8 6.8 0 0 1 0-9.6M12.8 3.2a6.8 6.8 0 0 1 0 9.6',
  calendar: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3',
  beaker:
    'M5.5 1.8h5M6.3 1.8v4.6L2.8 12.6a1 1 0 0 0 .9 1.6h8.6a1 1 0 0 0 .9-1.6L9.7 6.4V1.8M4.4 10h7.2',
  chip: 'M4.5 4.5h7v7h-7zM6.5 2v2.5M9.5 2v2.5M6.5 11.5V14M9.5 11.5V14M2 6.5h2.5M2 9.5h2.5M11.5 6.5H14M11.5 9.5H14',
  clock: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM8 4.5V8l2.4 1.6',
  timer: 'M8 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8 6v3M6.5 1.5h3',
  stop: 'M4.5 4.5h7v7h-7z',
  play: 'M5 3.5v9l7.5-4.5z',
  pulse: 'M1.5 8h3l1.8-4 3.4 8 1.8-4h3',
  shield: 'M8 1.8 13.5 4v4c0 3.2-2.4 5.4-5.5 6.2C4.9 13.4 2.5 11.2 2.5 8V4z',
  lock: 'M4 7.5h8v6H4zM5.6 7.5V5.2a2.4 2.4 0 0 1 4.8 0v2.3',
  user: 'M8 7.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM3 14c.4-2.6 2.5-4.2 5-4.2s4.6 1.6 5 4.2',
  plug: 'M5.5 1.5v3M10.5 1.5v3M4 4.5h8v2.8a4 4 0 0 1-8 0zM8 11.3v3.2',
  gauge:
    'M2.6 11.5a6 6 0 1 1 10.8 0M8 9.2 10.6 5.8M8 10.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  check: 'M3 8.5l3 3 7-7',
  alert: 'M8 2.2 14.3 13H1.7zM8 6.4v3.1M8 11.3h.01',
  close: 'M4 4l8 8M12 4l-8 8',
  plus: 'M8 3v10M3 8h10',
  trash: 'M2.8 4.2h10.4M6.2 4.2V2.6h3.6v1.6M4.2 4.2l.6 9.2h6.4l.6-9.2',
  pencil: 'M10.8 2.4l2.8 2.8-7.8 7.8H3v-2.8z',
  wave: 'M1.5 9.5c1.6 0 1.6-1.5 3.2-1.5S6.3 9.5 8 9.5s1.6-1.5 3.3-1.5 1.6 1.5 3.2 1.5M1.5 12.5c1.6 0 1.6-1.5 3.2-1.5S6.3 12.5 8 12.5s1.6-1.5 3.3-1.5 1.6 1.5 3.2 1.5',
  arrowRight: 'M3 8h10M9 4l4 4-4 4',
  info: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM8 7.4v3.9M8 5h.01',
  globe:
    'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM1.5 8h13M8 1.5c1.8 1.8 2.6 4 2.6 6.5S9.8 12.7 8 14.5C6.2 12.7 5.4 10.5 5.4 8S6.2 3.3 8 1.5',
} as const;
export type GlyphName = keyof typeof GLYPHS;

export function Glyph({
  name,
  size = 14,
  className,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GLYPHS[name]} />
    </svg>
  );
}

/** A titled surface inside the watering workspace. */
export function Card({
  title,
  icon,
  aside,
  children,
  className,
  tone,
}: {
  title?: ReactNode;
  icon?: GlyphName;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <section
      className={'wv-card' + (className ? ' ' + className : '')}
      data-tone={tone}
    >
      {(title || aside) && (
        <header className="wv-card-head">
          {icon && (
            <span className="wv-card-icon">
              <Glyph name={icon} size={14} />
            </span>
          )}
          {title && <h3>{title}</h3>}
          {aside && <div className="wv-card-aside">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Daily budget meter: a value against the controller's stored limit. */
export function Meter({
  label,
  value,
  limit,
  unit,
  note,
}: {
  label: string;
  value: number;
  limit: number;
  unit: string;
  note?: string;
}) {
  const ratio = limit > 0 ? Math.min(1, value / limit) : 0;
  const level = ratio >= 0.9 ? 'bad' : ratio >= 0.7 ? 'warn' : 'ok';
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 1 : 0 });
  return (
    <div className="wv-meter" data-level={level}>
      <div className="wv-meter-top">
        <span>{label}</span>
        <span className="wv-meter-value">
          <strong>{fmt(value)}</strong>
          <span>
            {' '}
            / {fmt(limit)} {unit}
          </span>
        </span>
      </div>
      <div
        className="wv-meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(value, limit)}
        aria-valuetext={`${fmt(value)} of ${fmt(limit)} ${unit}`}
      >
        <span style={{ transform: `scaleX(${ratio})` }} />
      </div>
      {note && <p className="wv-meter-note">{note}</p>}
    </div>
  );
}

/**
 * Numeric entry with a unit suffix and optional quick picks. The input is
 * uncontrolled from the caller's view: they read it through `onValue`.
 */
export function NumberField({
  label,
  name,
  unit,
  min,
  max,
  value,
  onValue,
  presets,
  disabled,
  hint,
  large,
}: {
  label: string;
  name?: string;
  unit: string;
  min: number;
  max: number;
  value: string;
  onValue: (value: string) => void;
  presets?: number[];
  disabled?: boolean;
  hint?: ReactNode;
  large?: boolean;
}) {
  const id = useId();
  return (
    <div className={'wv-field' + (large ? ' wv-field--lg' : '')}>
      <label htmlFor={id}>{label}</label>
      <div className="wv-input">
        <input
          id={id}
          name={name}
          required
          inputMode="decimal"
          type="number"
          min={min}
          max={max}
          step=".001"
          value={value}
          disabled={disabled}
          placeholder="0"
          onChange={(e) => onValue(e.target.value)}
        />
        <span className="wv-unit" aria-hidden="true">
          {unit}
        </span>
      </div>
      {presets && (
        <div className="wv-presets" role="group" aria-label="Suggested values">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="chip ia"
              disabled={disabled}
              aria-pressed={Number(value) === p}
              onClick={() => onValue(String(p))}
            >
              {p} {unit}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="wv-hint">{hint}</p>}
    </div>
  );
}
