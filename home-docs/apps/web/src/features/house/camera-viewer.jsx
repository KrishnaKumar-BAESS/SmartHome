import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function CameraViewer({ view }) {
  return (
    <>
      {view.showCamExpanded ? (
        <>
          <div
            style={css(
              'position:absolute;inset:0;z-index:44;background:rgba(7,11,15,0.93);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);display:flex;flex-direction:column;padding:20px 26px;animation:floatIn .25s ease both',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-shrink:0',
              )}
            >
              <div>
                <div style={css("font:600 15px 'IBM Plex Sans';color:#eef3f8")}>
                  {view.bigFeed.name}
                  {' · Review'}
                </div>
                <div
                  style={css(
                    "font:400 11px 'IBM Plex Mono',monospace;color:#8a98a6;margin-top:3px",
                  )}
                >
                  {view.expandSub}
                </div>
              </div>
              <div
                onClick={view.closeExpand}
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
            <div style={css('flex:1;min-height:0;display:flex;gap:18px')}>
              <div
                style={css(
                  'flex:1;min-width:0;display:flex;flex-direction:column;gap:12px',
                )}
              >
                <div
                  style={css(
                    'position:relative;flex:1;min-height:0;border-radius:12px;overflow:hidden;background:#0b1015;border:1px solid #20303c;box-shadow:inset 0 0 80px rgba(0,0,0,0.6)',
                  )}
                >
                  <div
                    style={css(
                      'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
                    )}
                  ></div>
                  <div
                    style={css(
                      'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 46px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(220px) rotateX(58deg);transform-origin:bottom',
                    )}
                  ></div>
                  <div
                    style={css(
                      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 40px 'IBM Plex Sans';color:rgba(255,255,255,0.05);letter-spacing:0.07em;text-align:center;padding:0 20px",
                    )}
                  >
                    {view.bigFeed.watermark}
                  </div>
                  <div
                    style={css(
                      'position:absolute;left:0;right:0;height:20%;background:linear-gradient(180deg,transparent,rgba(120,160,200,0.10),transparent);animation:feedScan 4.5s linear infinite',
                    )}
                  ></div>
                  <div
                    style={css(
                      'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)',
                    )}
                  >
                    <div
                      style={css(
                        "display:flex;align-items:center;gap:7px;font:600 11px 'IBM Plex Mono',monospace;color:" +
                          (view.bigFeed.liveColor ?? '') +
                          '',
                      )}
                    >
                      <span
                        style={css(
                          'width:8px;height:8px;border-radius:50%;background:' +
                            (view.bigFeed.liveColor ?? '') +
                            ';animation:pulseDot 1.4s ease-in-out infinite',
                        )}
                      ></span>
                      {view.bigFeed.liveLabel}
                      {'\n              '}
                    </div>
                    <div
                      style={css(
                        "font:600 11px 'IBM Plex Mono',monospace;color:#cdd6df",
                      )}
                    >
                      {view.bigFeed.res}
                    </div>
                  </div>
                  <div
                    style={css(
                      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font:600 11px 'IBM Plex Mono',monospace;color:#dfe7ee;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);padding:5px 12px;border-radius:20px",
                    )}
                  >
                    {view.bigFeed.eventLabel}
                  </div>
                  <div
                    style={css(
                      'position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)',
                    )}
                  >
                    <div
                      style={css(
                        "font:600 11px 'IBM Plex Mono',monospace;color:#dfe7ee;text-shadow:0 1px 2px #000",
                      )}
                    >
                      {view.bigFeed.room}
                    </div>
                    <div
                      style={css(
                        "font:500 11px 'IBM Plex Mono',monospace;color:#aeb9c4",
                      )}
                    >
                      {view.bigFeed.time}
                    </div>
                  </div>
                  {view.bigFeed.showOffline ? (
                    <>
                      <div
                        style={css(
                          "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,12,0.74);font:600 14px 'IBM Plex Mono',monospace;color:#8a94a0;letter-spacing:0.16em",
                        )}
                      >
                        {'NO SIGNAL'}
                      </div>
                    </>
                  ) : null}
                </div>
                <div
                  style={css(
                    'flex-shrink:0;display:flex;align-items:center;gap:10px;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px',
                  )}
                >
                  <span
                    style={css(
                      "font:600 8.5px 'IBM Plex Mono',monospace;color:#7f8d9a;letter-spacing:0.12em;flex-shrink:0",
                    )}
                  >
                    {'TIMELINE'}
                  </span>
                  <div
                    style={css(
                      'position:relative;flex:1;height:6px;border-radius:4px;background:rgba(255,255,255,0.08)',
                    )}
                  >
                    <div
                      style={css(
                        'position:absolute;left:0;top:0;bottom:0;width:64%;border-radius:4px;background:linear-gradient(90deg,rgba(192,87,59,0.2),rgba(192,87,59,0.55))',
                      )}
                    ></div>
                    {(view.histTiles ?? []).map((t, index) => (
                      <Fragment key={t.id ?? t.key ?? t.label ?? index}>
                        <div
                          onClick={t.onClick}
                          style={css(t.dotStyle)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={activateOnKey}
                        ></div>
                      </Fragment>
                    ))}
                  </div>
                  <span
                    style={css(
                      "font:500 9px 'IBM Plex Mono',monospace;color:#9aa8b4;flex-shrink:0",
                    )}
                  >
                    {'last ~4h'}
                  </span>
                </div>
              </div>

              <div
                style={css(
                  'width:236px;flex-shrink:0;display:flex;flex-direction:column;min-height:0',
                )}
              >
                <div
                  style={css(
                    "font:600 9px 'IBM Plex Mono',monospace;color:#8a98a6;letter-spacing:0.12em;margin:0 2px 9px",
                  )}
                >
                  {'EVENT HISTORY'}
                </div>
                <div
                  style={css(
                    'flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:9px;padding-right:2px',
                  )}
                >
                  {(view.histTiles ?? []).map((t, index) => (
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
                              'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 26px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(120px) rotateX(58deg);transform-origin:bottom',
                            )}
                          ></div>
                          <div
                            style={css(
                              "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 12px 'IBM Plex Sans';color:rgba(255,255,255,0.06);letter-spacing:0.05em;text-align:center;padding:0 8px",
                            )}
                          >
                            {t.watermark}
                          </div>
                          <div
                            style={css(
                              'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:6px 8px',
                            )}
                          >
                            <div
                              style={css(
                                "display:flex;align-items:center;gap:5px;font:600 8.5px 'IBM Plex Mono',monospace;color:" +
                                  (t.color ?? '') +
                                  '',
                              )}
                            >
                              <span
                                style={css(
                                  'width:6px;height:6px;border-radius:50%;background:' +
                                    (t.color ?? '') +
                                    '',
                                )}
                              ></span>
                              {t.label}
                              {'\n                    '}
                            </div>
                            <div
                              style={css(
                                "font:600 8.5px 'IBM Plex Mono',monospace;color:#cdd6df",
                              )}
                            >
                              {t.time}
                            </div>
                          </div>
                          <div
                            style={css(
                              "position:absolute;bottom:0;left:0;right:0;padding:6px 8px;font:500 8.5px 'IBM Plex Mono',monospace;color:#aeb9c4;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)",
                            )}
                          >
                            {t.sub}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
