import { Fragment } from 'react';
import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";

/** Nonmodal disclosure: the model stays usable while it is open. */
export function IsolationPanel({ view }) {
  const { mounted, exiting } = usePresence(view.showIsoPanel);
  if (!mounted) return null;
  return (
    <section
      id="isolation-panel"
      className={exiting ? 'float-out' : 'float-in'}
      style={css(view.isoPanelStyle)}
      aria-labelledby="isolation-title"
      data-popover="iso"
    >
      <div
        style={css(
          'padding:12px 13px 11px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
        )}
      >
        <div
          style={css(
            'display:flex;align-items:center;justify-content:space-between;gap:8px',
          )}
        >
          <h2
            id="isolation-title"
            style={css(`font:600 13px ${FONT};margin:0`)}
          >
            {'Isolate view'}
          </h2>
          <div style={css('display:flex;align-items:center;gap:4px')}>
            {view.isoActive ? (
              <button
                type="button"
                onClick={view.isoClear}
                className="ia link-button"
                style={css(`font:500 11px ${MONO};color:var(--acc-text)`)}
              >
                {'Clear'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={view.closeIso}
              className="ia icon-button"
              aria-label="Close isolate view"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        </div>
        <div
          style={css(`font:400 11px ${FONT};color:var(--t3);margin-top:3px`)}
        >
          {view.isoCountLabel}
        </div>
        <div
          style={css('display:flex;gap:4px;margin-top:10px')}
          role="group"
          aria-label="Floor"
        >
          {(view.isoFloors ?? []).map((f, index) => (
            <Fragment key={f.key ?? index}>
              <button
                type="button"
                onClick={f.onClick}
                className="ia"
                style={css(f.style)}
                aria-pressed={f.on}
              >
                {f.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <div style={css('overflow:auto;padding:9px 12px 13px')}>
        <div
          style={css(
            `font:500 10px ${MONO};color:var(--t3);letter-spacing:0.1em;margin:1px 1px 2px`,
          )}
        >
          {'OR PICK ROOMS'}
        </div>
        {(view.isoRoomGroups ?? []).map((g, index) => (
          <Fragment key={g.key ?? index}>
            <h3
              style={css(
                `font:600 10px ${MONO};color:var(--t3);letter-spacing:0.04em;margin:11px 1px 6px`,
              )}
            >
              {g.label}
            </h3>
            <div
              style={css('display:flex;flex-wrap:wrap;gap:5px')}
              role="group"
              aria-label={`${g.label} rooms`}
            >
              {(g.rooms ?? []).map((r, index) => (
                <Fragment key={r.id ?? index}>
                  <button
                    type="button"
                    onClick={r.onClick}
                    className="ia"
                    style={css(r.style)}
                    aria-pressed={r.on}
                  >
                    {r.name}
                  </button>
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
