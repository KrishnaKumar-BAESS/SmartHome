import { useEffect, useRef } from 'react';
import { Icon } from './icons';

const REPO = 'https://github.com/KrishnaKumar-BAESS/SmartHome';

const SHORTCUTS = [
  ['1 – 8', 'Switch view (Overview … Upkeep)'],
  ['/', 'Focus search'],
  ['⌘K or Ctrl+K', 'Focus search (always on)'],
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
    <table className="keys" aria-label={label}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">
              <kbd>{k}</kbd>
            </th>
            <td>{v}</td>
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
      <div className="dialog-head" style={{ marginBottom: 4 }}>
        <h2 id="help-title">{'Help & shortcuts'}</h2>
        <button
          type="button"
          className="ia icon-btn icon-btn--lg"
          onClick={view.closeHelp}
          aria-label="Close help"
          autoFocus
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <p>
        {
          'house.sys is a documentation atlas. Everything shown is recorded inventory as of '
        }
        {view.snapshot}
        {
          ' — statuses, dates, and usage values do not update themselves, and nothing here controls a device.'
        }
      </p>

      <h3>Recorded vs. demonstration</h3>
      <ul>
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

      <h3>Keyboard</h3>
      <Table rows={SHORTCUTS} label="Global shortcuts" />
      <label className="check-row">
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

      <h3>Pointer & touch</h3>
      <Table rows={GESTURES} label="Pointer and touch gestures" />

      <h3>Sharing & export</h3>
      <p>
        {
          'The address bar tracks the current view, selection, and isolation, so a copied link restores them. Each list has a CSV export; circuit tags and camera names have copy buttons.'
        }
      </p>

      <h3>Request a correction</h3>
      <p>
        {'This app has no editing. Inventory lives in '}
        <code>home-docs/apps/web/src/data/house.ts</code>
        {' and changes go through the data workflow in '}
        <code>home-docs/docs/data-model.md</code>
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
