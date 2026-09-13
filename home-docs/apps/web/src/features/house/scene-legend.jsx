import { Fragment } from 'react';
import { css } from '../../lib/css';

export function SceneLegend({ view }) {
  return (
    <>
      {view.showLegend ? (
        <>
          <div style={css(view.legendPanelStyle)}>
            <div
              style={css(
                "font:500 8.5px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em;margin-bottom:1px",
              )}
            >
              {view.legendTitle}
            </div>
            {(view.legendItems ?? []).map((l, index) => (
              <Fragment key={l.id ?? l.key ?? l.label ?? index}>
                <div style={css('display:flex;align-items:center;gap:8px')}>
                  <span style={css(l.swatch)}></span>
                  <span
                    style={css(
                      "font:400 10.5px 'IBM Plex Mono',monospace;color:var(--t2)",
                    )}
                  >
                    {l.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
