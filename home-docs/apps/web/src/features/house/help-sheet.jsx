import { useEffect, useRef } from 'react';
import { css } from '../../lib/css';
import { Icon } from './icons';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";
const REPO = 'https://github.com/KrishnaKumar-BAESS/SmartHome';

const SHORTCUTS = [
  ['1 – 8', 'Switch view (Overview … Upkeep)'],
  ['/', 'Focus search'],
  ['+ / −', 'Zoom in / out'],
  ['0 or r', 'Reset orientation'],
  ['?', 'This help'],
  ['Esc', 'Close popovers and overlays, clear search'],
];
const MODEL_KEYS = [
  ['Tab', 'Move between rooms and markers in the model'],
  ['Enter / Space', 'Select the focused room or marker'],
  ['← →', 'Rotate the model (with the model focused)'],
  ['↑ ↓', 'Tilt the model'],
  ['Shift + arrows', 'Pan'],
];
const GESTURES = [
  ['Drag', 'Rotate'],
  ['Shift + drag, right or middle drag', 'Pan'],
  ['Wheel', 'Zoom toward the pointer (Ctrl + wheel stays browser zoom)'],
  ['Two fingers', 'Pinch to zoom, move to pan'],
  ['View options', 'Tap-only rotate, tilt, and pan buttons'],
];

function Table({ rows, label }) {
  return (
    <table
      style={css('width:100%;border-collapse:collapse;margin-top:6px')}
      aria-label={label}
    >
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th
              scope="row"
              style={css(
                `text-align:left;padding:5px 10px 5px 0;font:600 11px ${MONO};color:var(--t1);white-space:nowrap;vertical-align:top`,
              )}
            >
              <kbd
                style={css(
                  'font:inherit;background:var(--lift-06);border:1px solid var(--lift-12);border-radius:4px;padding:1px 6px',
                )}
              >
                {k}
              </kbd>
            </th>
            <td
              style={css(`padding:5px 0;font:400 12px ${FONT};color:var(--t2)`)}
            >
              {v}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Modal help: controls, the recorded-vs-demonstration boundary, and how to request corrections. */
export function HelpSheet({ view }) {
  if (!view.helpOpen) return null;
  return <Sheet view={view} />;
}

function Sheet({ view }) {
  const ref = useRef(null);
  const close = useRef(view.closeHelp);
  useEffect(() => {
    close.current = view.closeHelp;
  });
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement;
    el?.showModal();
    return () => {
      el?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const H3 = `font:600 10px ${MONO};color:var(--t3);letter-spacing:0.12em;margin:18px 0 4px`;
  const P = `font:400 12px ${FONT};color:var(--t2);line-height:1.55;margin:6px 0 0`;
  return (
    <dialog
      ref={ref}
      className="help-sheet"
      aria-labelledby="help-title"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          close.current();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;gap:12px',
        )}
      >
        <h2 id="help-title" style={css(`font:600 16px ${FONT};margin:0`)}>
          {'Help & shortcuts'}
        </h2>
        <button
          type="button"
          className="ia icon-button"
          onClick={view.closeHelp}
          aria-label="Close help"
          autoFocus
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <p style={css(P)}>
        {
          'HOUSE.SYS is a documentation atlas. Everything shown is recorded inventory as of '
        }
        {view.snapshot}
        {
          ' — statuses, dates, and usage values do not update themselves, and nothing here controls a device.'
        }
      </p>

      <h3 style={css(H3)}>{'RECORDED VS. DEMONSTRATION'}</h3>
      <ul style={css(`${P};padding-left:18px`)}>
        <li>
          Circuits, fixtures, nodes, cameras, sensors, and upkeep items are
          recorded data.
        </li>
        <li>
          Camera previews and event history are generated demonstrations; only
          Security → Live cameras shows real video, and only when the local
          security service is attached.
        </li>
        <li>
          Wiring paths, coverage cones, speaker layouts, and marker positions
          are schematic — not surveyed routes or coordinates.
        </li>
        <li>
          References marked UNVERIFIED point at a circuit number that is not in
          the documented inventory.
        </li>
      </ul>

      <h3 style={css(H3)}>{'KEYBOARD'}</h3>
      <Table rows={SHORTCUTS} label="Global shortcuts" />
      <label
        style={css(
          `display:flex;align-items:center;gap:8px;margin-top:8px;font:500 12px ${FONT};color:var(--t2)`,
        )}
      >
        <input
          type="checkbox"
          checked={view.shortcutsOn}
          onChange={(e) => view.setShortcuts(e.target.checked)}
        />
        {
          'Enable single-key shortcuts (turn off if they conflict with speech or switch input; ? and Esc always work)'
        }
      </label>
      <Table rows={MODEL_KEYS} label="Model keyboard controls" />

      <h3 style={css(H3)}>{'POINTER & TOUCH'}</h3>
      <Table rows={GESTURES} label="Pointer and touch gestures" />

      <h3 style={css(H3)}>{'SHARING & EXPORT'}</h3>
      <p style={css(P)}>
        {
          'The address bar tracks the current view, selection, and isolation, so a copied link restores them. Each list has a CSV export; circuit tags and camera names have copy buttons.'
        }
      </p>

      <h3 style={css(H3)}>{'REQUEST A CORRECTION'}</h3>
      <p style={css(P)}>
        {'This app has no editing. Inventory lives in '}
        <code style={css(`font:500 11px ${MONO}`)}>
          home-docs/apps/web/src/data/house.ts
        </code>
        {' and changes go through the data workflow in '}
        <code style={css(`font:500 11px ${MONO}`)}>
          home-docs/docs/data-model.md
        </code>
        {'. '}
        <a href={`${REPO}/issues/new`} target="_blank" rel="noreferrer">
          Open an issue
        </a>
        {
          ' describing the record, what is wrong, and the source for the correction.'
        }
      </p>
    </dialog>
  );
}
