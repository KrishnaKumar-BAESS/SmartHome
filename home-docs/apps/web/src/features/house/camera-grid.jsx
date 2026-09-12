import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function CameraGrid({ view }) {
  return (
    <>
      {view.showGrid ? (
        <>
          <div
            style={css(
              'position:absolute;inset:0;z-index:40;background:rgba(10,14,18,0.88);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:flex;flex-direction:column;padding:20px 26px;animation:floatIn .25s ease both',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:15px',
              )}
            >
              <div>
                <div style={css("font:600 15px 'IBM Plex Sans';color:#eef3f8")}>
                  {'Live Feeds · Security Network'}
                </div>
                <div
                  style={css(
                    "font:400 11px 'IBM Plex Mono',monospace;color:#8a98a6;margin-top:3px",
                  )}
                >
                  {view.feedGridSub}
                </div>
              </div>
              <div
                onClick={view.closeGrid}
                style={css(
                  "font:500 11.5px 'IBM Plex Sans';color:#cdd6df;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);padding:8px 14px;border-radius:8px;cursor:pointer",
                )}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                {'Close ✕'}
              </div>
            </div>
            <div
              style={css(
                'flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-content:start',
              )}
            >
              {(view.feedTiles ?? []).map((t, index) => (
                <Fragment key={t.id ?? t.key ?? t.label ?? index}>
                  <div
                    onClick={t.onClick}
                    style={css(t.wrapStyle)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    <div
                      style={css(
                        'position:relative;width:100%;aspect-ratio:16/9;background:#0b1015;overflow:hidden',
                      )}
                    >
                      <div
                        style={css(
                          'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
                        )}
                      ></div>
                      <div
                        style={css(
                          'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 34px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(150px) rotateX(58deg);transform-origin:bottom',
                        )}
                      ></div>
                      <div
                        style={css(
                          "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 16px 'IBM Plex Sans';color:rgba(255,255,255,0.06);letter-spacing:0.05em;text-align:center;padding:0 10px",
                        )}
                      >
                        {t.watermark}
                      </div>
                      <div
                        style={css(
                          'position:absolute;left:0;right:0;height:24%;background:linear-gradient(180deg,transparent,rgba(120,160,200,0.10),transparent);animation:feedScan 4.5s linear infinite',
                        )}
                      ></div>
                      <div
                        style={css(
                          'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)',
                        )}
                      >
                        <div
                          style={css(
                            "display:flex;align-items:center;gap:5px;font:600 9px 'IBM Plex Mono',monospace;color:" +
                              (t.liveColor ?? '') +
                              '',
                          )}
                        >
                          <span
                            style={css(
                              'width:6px;height:6px;border-radius:50%;background:' +
                                (t.liveColor ?? '') +
                                ';animation:pulseDot 1.4s ease-in-out infinite',
                            )}
                          ></span>
                          {t.liveLabel}
                          {'\n                '}
                        </div>
                        <div
                          style={css(
                            "font:600 9px 'IBM Plex Mono',monospace;color:#cdd6df",
                          )}
                        >
                          {t.res}
                        </div>
                      </div>
                      <div
                        style={css(
                          'position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)',
                        )}
                      >
                        <div
                          style={css(
                            "font:600 9.5px 'IBM Plex Mono',monospace;color:#dfe7ee;text-shadow:0 1px 2px #000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                          )}
                        >
                          {t.name}
                        </div>
                        <div
                          style={css(
                            "font:500 9px 'IBM Plex Mono',monospace;color:#aeb9c4;flex-shrink:0;margin-left:6px",
                          )}
                        >
                          {t.time}
                        </div>
                      </div>
                      {t.offline ? (
                        <>
                          <div
                            style={css(
                              "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,12,0.74);font:600 11px 'IBM Plex Mono',monospace;color:#8a94a0;letter-spacing:0.14em",
                            )}
                          >
                            {'NO SIGNAL'}
                          </div>
                        </>
                      ) : null}
                    </div>
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
