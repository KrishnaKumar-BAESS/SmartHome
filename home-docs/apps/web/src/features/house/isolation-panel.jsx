import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function IsolationPanel({ view }) {
  return (
    <>
      {view.showIsoPanel ? (
        <>
          <div style={css(view.isoPanelStyle)}>
            <div
              style={css(
                'padding:12px 13px 11px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
              )}
            >
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between',
                )}
              >
                <div
                  style={css(
                    "font:600 12.5px 'Inter',system-ui,'Segoe UI',sans-serif",
                  )}
                >
                  {'Isolate view'}
                </div>
                <div
                  onClick={view.isoClear}
                  style={css(
                    "font:500 10.5px 'IBM Plex Mono',monospace;color:#3b6fb0;cursor:pointer",
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  {view.isoClearLabel}
                </div>
              </div>
              <div
                style={css(
                  "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:3px",
                )}
              >
                {view.isoCountLabel}
              </div>
              <div style={css('display:flex;gap:4px;margin-top:10px')}>
                {(view.isoFloors ?? []).map((f, index) => (
                  <Fragment key={f.id ?? f.key ?? f.label ?? index}>
                    <div
                      onClick={f.onClick}
                      style={css(f.style)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={activateOnKey}
                    >
                      {f.label}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
            <div style={css('overflow:auto;padding:9px 12px 13px')}>
              <div
                style={css(
                  "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.1em;margin:1px 1px 2px",
                )}
              >
                {'OR PICK ROOMS'}
              </div>
              {(view.isoRoomGroups ?? []).map((g, index) => (
                <Fragment key={g.id ?? g.key ?? g.label ?? index}>
                  <div
                    style={css(
                      "font:600 9.5px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.04em;margin:11px 1px 6px",
                    )}
                  >
                    {g.label}
                  </div>
                  <div style={css('display:flex;flex-wrap:wrap;gap:5px')}>
                    {(g.rooms ?? []).map((r, index) => (
                      <Fragment key={r.id ?? r.key ?? r.label ?? index}>
                        <div
                          onClick={r.onClick}
                          style={css(r.style)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={activateOnKey}
                        >
                          {r.name}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
