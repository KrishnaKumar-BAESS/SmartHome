import { Fragment } from 'react';
import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';

export function SceneLegend({ view }) {
  const { mounted, exiting } = usePresence(!!view.showLegend);
  if (!mounted) return null;
  return (
    <div
      className={exiting ? 'float-out' : 'float-in'}
      style={css(view.legendPanelStyle)}
      role="region"
      aria-label="Legend"
    >
      <div
        style={css(
          "font:500 10px 'IBM Plex Mono',monospace;color:var(--t3);letter-spacing:0.12em;margin-bottom:1px",
        )}
      >
        {view.legendTitle}
      </div>
      {(view.legendItems ?? []).map((l, index) => (
        <Fragment key={l.id ?? l.key ?? l.label ?? index}>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <span style={css(l.swatch)} aria-hidden="true"></span>
            <span
              style={css(
                "font:400 11px 'IBM Plex Mono',monospace;color:var(--t2)",
              )}
            >
              {l.label}
            </span>
          </div>
        </Fragment>
      ))}
      {view.legendNote ? (
        <div
          style={css(
            "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);max-width:220px;line-height:1.4;margin-top:2px",
          )}
        >
          {view.legendNote}
        </div>
      ) : null}
    </div>
  );
}
