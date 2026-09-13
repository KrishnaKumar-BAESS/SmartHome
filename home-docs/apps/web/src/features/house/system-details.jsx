import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function SystemDetails({ view }) {
  return (
    <aside style={css(view.detailPanelStyle)}>
      <div style={css('padding:17px 18px 20px')}>
        {view.isOverview ? (
          <>
            <div
              onClick={view.goLighting}
              style={css(
                'display:flex;align-items:center;gap:11px;padding:12px 14px;background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34);border-radius:8px;cursor:pointer',
              )}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#c0892f;flex-shrink:0;animation:pulseDot 1.8s ease-in-out infinite',
                )}
              ></span>
              <div
                style={css(
                  "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--warn-text);flex:1",
                )}
              >
                {view.alertText}
              </div>
              <div
                style={css(
                  "font:500 10px 'IBM Plex Mono',monospace;color:var(--warn-text)",
                )}
              >
                {'→'}
              </div>
            </div>
            <div
              onClick={view.goUpkeep}
              style={css(
                'display:flex;align-items:center;gap:11px;padding:12px 14px;margin-top:9px;background:rgba(192,87,59,0.16);border:1px solid rgba(192,87,59,0.34);border-radius:8px;cursor:pointer',
              )}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#c0573b;flex-shrink:0;animation:pulseDot 1.8s ease-in-out infinite',
                )}
              ></span>
              <div
                style={css(
                  "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--alert-text);flex:1",
                )}
              >
                {view.upAlertText}
              </div>
              <div
                style={css(
                  "font:500 10px 'IBM Plex Mono',monospace;color:var(--alert-text)",
                )}
              >
                {'→'}
              </div>
            </div>
            <div
              style={css(
                "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em;margin:18px 2px 9px",
              )}
            >
              {'NEEDS ATTENTION'}
            </div>
            {(view.needs ?? []).map((b, index) => (
              <Fragment key={b.id ?? b.key ?? b.label ?? index}>
                <div
                  onClick={b.onClick}
                  style={css(
                    'display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--lift-06);cursor:pointer',
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <span style={css(b.dotStyle)}></span>
                  <div style={css('min-width:0;flex:1')}>
                    <div
                      style={css(
                        "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {b.room}
                    </div>
                    <div
                      style={css(
                        "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {b.fixture}
                    </div>
                  </div>
                  <div
                    style={css(
                      "font:500 10px 'IBM Plex Mono',monospace;color:" +
                        (b.color ?? '') +
                        ';flex-shrink:0',
                    )}
                  >
                    {b.statusLabel}
                  </div>
                </div>
              </Fragment>
            ))}
          </>
        ) : null}

        {view.isElectrical ? (
          <>
            {view.noSel ? (
              <>
                <div
                  style={css(
                    'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:11px;padding:48px 18px;color:var(--t4)',
                  )}
                >
                  <div
                    style={css(
                      'width:24px;height:24px;border:1.5px solid var(--t3);transform:rotate(45deg)',
                    )}
                  ></div>
                  <div
                    style={css(
                      "font:400 12.5px 'Inter',system-ui,'Segoe UI',sans-serif;max-width:220px;line-height:1.5",
                    )}
                  >
                    {
                      'Select a circuit to energize its wiring path through the house.'
                    }
                  </div>
                </div>
              </>
            ) : null}
            {view.hasSel ? (
              <>
                <div style={css('display:flex;align-items:center;gap:9px')}>
                  <span
                    style={css(
                      'width:12px;height:12px;border-radius:3px;flex-shrink:0;background:' +
                        (view.circDet.typeColor ?? '') +
                        '',
                    )}
                  ></span>
                  <div
                    style={css(
                      "font:600 16px 'IBM Plex Mono',monospace;color:var(--t1)",
                    )}
                  >
                    {view.circDet.tag}
                  </div>
                  <div
                    style={css(
                      "font:500 10px 'IBM Plex Mono',monospace;color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:2px 8px;border-radius:4px;margin-left:auto",
                    )}
                  >
                    {view.circDet.amp}
                    {' · '}
                    {view.circDet.typeLabel}
                  </div>
                </div>
                <div
                  style={css(
                    "font:500 15px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);margin-top:12px;line-height:1.35",
                  )}
                >
                  {view.circDet.label}
                </div>
                <div
                  style={css(
                    "font:400 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:8px",
                  )}
                >
                  {'Fed from '}
                  <span style={css('color:var(--t1);font-weight:500')}>
                    {view.circDet.boxName}
                  </span>
                  {' · '}
                  {view.circDet.boxLoc}
                </div>
                <div
                  style={css(
                    'display:flex;align-items:center;gap:8px;margin-top:13px;padding:9px 12px;border-radius:7px;background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34)',
                  )}
                >
                  <span
                    style={css(
                      'width:7px;height:7px;border-radius:50%;background:#c0892f;flex-shrink:0;animation:pulseDot 1.8s ease-in-out infinite',
                    )}
                  ></span>
                  <div
                    style={css(
                      "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--warn-text)",
                    )}
                  >
                    {view.circDet.spansText}
                  </div>
                </div>
                <div
                  style={css(
                    "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.08em;margin:18px 0 7px",
                  )}
                >
                  {'SERVES '}
                  {view.circDet.loadCount}
                  {' AREAS'}
                </div>
                {(view.circDet.rooms ?? []).map((r, index) => (
                  <Fragment key={r.id ?? r.key ?? r.label ?? index}>
                    <div
                      style={css(
                        'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                      )}
                    >
                      <span style={css(r.fdot)}></span>
                      <div
                        style={css(
                          "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);flex:1;min-width:0",
                        )}
                      >
                        {r.name}
                      </div>
                      <div
                        style={css(
                          "font:400 10px 'IBM Plex Mono',monospace;color:var(--t4)",
                        )}
                      >
                        {r.floorLabel}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </>
            ) : null}
          </>
        ) : null}

        {view.isLighting ? (
          <>
            {view.noBulb ? (
              <>
                <div
                  style={css(
                    'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:11px;padding:48px 18px;color:var(--t4)',
                  )}
                >
                  <div
                    style={css(
                      'width:22px;height:22px;border-radius:50%;border:1.5px solid var(--t3)',
                    )}
                  ></div>
                  <div
                    style={css(
                      "font:400 12.5px 'Inter',system-ui,'Segoe UI',sans-serif;max-width:210px;line-height:1.5",
                    )}
                  >
                    {'Select a bulb to pin it in the model and see full specs.'}
                  </div>
                </div>
              </>
            ) : null}
            {view.hasBulb ? (
              <>
                <div style={css('display:flex;align-items:center;gap:11px')}>
                  <div
                    style={css(
                      'width:36px;height:36px;border-radius:50%;background:' +
                        (view.bd.kColor ?? '') +
                        ';border:1px solid #00000018;flex-shrink:0;box-shadow:0 0 14px ' +
                        (view.bd.glow ?? '') +
                        '',
                    )}
                  ></div>
                  <div>
                    <div
                      style={css(
                        "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif;line-height:1.1",
                      )}
                    >
                      {view.bd.room}
                    </div>
                    <div
                      style={css(
                        "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                      )}
                    >
                      {view.bd.fixture}
                    </div>
                  </div>
                </div>
                <div
                  style={css(
                    'display:flex;align-items:center;gap:8px;margin-top:13px;padding:9px 12px;border-radius:7px;background:' +
                      (view.bd.statusBg ?? '') +
                      ';border:1px solid ' +
                      (view.bd.statusBd ?? '') +
                      '',
                  )}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (view.bd.color ?? '') +
                        '',
                    )}
                  ></span>
                  <div
                    style={css(
                      "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:" +
                        (view.bd.color ?? '') +
                        '',
                    )}
                  >
                    {view.bd.statusFull}
                  </div>
                </div>
                <div style={css('margin-top:14px')}>
                  {(view.bd.specs ?? []).map((sp, index) => (
                    <Fragment key={sp.id ?? sp.key ?? sp.label ?? index}>
                      <div
                        style={css(
                          'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                        )}
                      >
                        <div
                          style={css(
                            "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                          )}
                        >
                          {sp.k}
                        </div>
                        <div
                          style={css(
                            "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                          )}
                        >
                          {sp.v}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div
                  style={css(
                    'margin-top:14px;display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:7px;background:var(--lift-05);border:1px solid var(--lift-08)',
                  )}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (view.locate.color ?? '') +
                        ';flex-shrink:0',
                    )}
                  ></span>
                  <div
                    style={css(
                      "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                    )}
                  >
                    {view.locate.floorLabel}
                  </div>
                  <div
                    style={css(
                      "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);margin-left:auto",
                    )}
                  >
                    {view.locate.pinNote}
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {view.isNetwork ? (
          <>
            <div
              style={css(
                'background:var(--sel-bg);color:var(--t1);border-radius:8px;padding:13px 15px;display:flex;align-items:center;gap:11px',
              )}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#5a9c6e;flex-shrink:0',
                )}
              ></span>
              <div style={css('min-width:0')}>
                <div
                  style={css(
                    "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                  )}
                >
                  {view.gateway.name}
                </div>
                <div
                  style={css(
                    "font:400 10px 'IBM Plex Mono',monospace;color:var(--t3);margin-top:2px",
                  )}
                >
                  {view.gateway.role}
                  {' · '}
                  {view.gateway.room}
                </div>
              </div>
            </div>
            <div
              style={css(
                'display:flex;justify-content:space-between;gap:10px;margin-top:9px;padding:0 2px',
              )}
            >
              <div>
                <div
                  style={css(
                    "font:400 8.5px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.06em",
                  )}
                >
                  {'UPLINK'}
                </div>
                <div
                  style={css(
                    "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;margin-top:2px",
                  )}
                >
                  {view.gateway.backhaul}
                </div>
              </div>
              <div style={css('text-align:right')}>
                <div
                  style={css(
                    "font:400 8.5px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.06em",
                  )}
                >
                  {'BROADCASTS'}
                </div>
                <div
                  style={css(
                    "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;margin-top:2px",
                  )}
                >
                  {'All 3 networks'}
                </div>
              </div>
            </div>
            <div
              style={css('height:1px;background:var(--lift-08);margin:15px 0')}
            ></div>
            {view.nodeDet.show ? (
              <>
                <div style={css('display:flex;align-items:center;gap:9px')}>
                  <span
                    style={css(
                      'width:11px;height:11px;border-radius:3px;background:' +
                        (view.nodeDet.statusColor ?? '') +
                        ';flex-shrink:0',
                    )}
                  ></span>
                  <div
                    style={css(
                      "font:600 15px 'Inter',system-ui,'Segoe UI',sans-serif",
                    )}
                  >
                    {view.nodeDet.name}
                  </div>
                  <div style={css('display:flex;gap:3px;margin-left:auto')}>
                    {(view.nodeDet.netDots ?? []).map((d, index) => (
                      <Fragment key={d.id ?? d.key ?? d.label ?? index}>
                        <span
                          style={css(
                            'width:9px;height:9px;border-radius:2px;background:' +
                              (d.color ?? '') +
                              '',
                          )}
                        ></span>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div
                  style={css(
                    "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:4px",
                  )}
                >
                  {view.nodeDet.role}
                  {' · '}
                  {view.nodeDet.room}
                </div>
                <div
                  style={css(
                    'margin-top:12px;display:grid;grid-template-columns:auto 1fr;gap:7px 12px',
                  )}
                >
                  <div
                    style={css(
                      "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4)",
                    )}
                  >
                    {'Backhaul'}
                  </div>
                  <div
                    style={css(
                      "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;text-align:right",
                    )}
                  >
                    {view.nodeDet.backhaul}
                  </div>
                  <div
                    style={css(
                      "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4)",
                    )}
                  >
                    {'Plugged into'}
                  </div>
                  <div
                    style={css(
                      "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;text-align:right",
                    )}
                  >
                    {view.nodeDet.plug}
                  </div>
                  <div
                    style={css(
                      "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4)",
                    )}
                  >
                    {'Model'}
                  </div>
                  <div
                    style={css(
                      "font:500 11px 'IBM Plex Mono',monospace;color:var(--t3);text-align:right",
                    )}
                  >
                    {view.nodeDet.model}
                  </div>
                </div>
                {view.nodeDet.hasServers ? (
                  <>
                    <div
                      style={css(
                        'margin-top:13px;padding-top:13px;border-top:1px dashed var(--lift-12)',
                      )}
                    >
                      <div
                        style={css(
                          "font:400 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.08em;margin-bottom:8px",
                        )}
                      >
                        {'ATTACHED SERVERS'}
                      </div>
                      {(view.nodeDet.servers ?? []).map((sv, index) => (
                        <Fragment key={sv.id ?? sv.key ?? sv.label ?? index}>
                          <div
                            style={css(
                              'display:flex;align-items:center;gap:8px;padding:5px 0',
                            )}
                          >
                            <span
                              style={css(
                                'width:6px;height:6px;background:#3b6fb0;transform:rotate(45deg);flex-shrink:0',
                              )}
                            ></span>
                            <div
                              style={css(
                                "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif",
                              )}
                            >
                              {sv.name}
                            </div>
                            <div
                              style={css(
                                "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                              )}
                            >
                              {sv.kind}
                            </div>
                            <div
                              style={css(
                                "margin-left:auto;font:400 9.5px 'IBM Plex Mono',monospace;color:var(--t4)",
                              )}
                            >
                              {sv.power}
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {view.isSound ? (
          <>
            <div
              style={css(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
              )}
            >
              <div>
                <div
                  style={css(
                    "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif",
                  )}
                >
                  {view.zoneDet.name}
                </div>
                <div
                  style={css(
                    "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:2px",
                  )}
                >
                  {view.zoneDet.room}
                </div>
              </div>
              <div
                style={css(
                  "font:600 11px 'IBM Plex Mono',monospace;color:var(--ring-text);background:rgba(123,92,214,0.18);border:1px solid rgba(123,92,214,0.4);padding:4px 9px;border-radius:5px;flex-shrink:0",
                )}
              >
                {view.zoneDet.config}
              </div>
            </div>
            <div
              style={css(
                'position:relative;height:172px;margin-top:13px;border:1px solid var(--lift-10);border-radius:7px;background:var(--lift-04);background-image:linear-gradient(var(--lift-05) 1px,transparent 1px),linear-gradient(90deg,var(--lift-05) 1px,transparent 1px);background-size:18px 18px;overflow:hidden',
              )}
            >
              <div
                style={css(
                  "position:absolute;left:8px;top:7px;font:500 9px 'IBM Plex Mono',monospace;color:var(--t3)",
                )}
              >
                {'SPEAKER LAYOUT'}
              </div>
              {(view.zoneDet.spk ?? []).map((p, index) => (
                <Fragment key={p.id ?? p.key ?? p.label ?? index}>
                  <div style={css(p.style)}>{p.label}</div>
                </Fragment>
              ))}
            </div>
            <div style={css('margin-top:13px')}>
              {(view.zoneDet.gear ?? []).map((g, index) => (
                <Fragment key={g.id ?? g.key ?? g.label ?? index}>
                  <div
                    style={css(
                      'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                    )}
                  >
                    <div
                      style={css(
                        "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif",
                      )}
                    >
                      {g.l}
                    </div>
                    <div
                      style={css(
                        "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);text-align:right",
                      )}
                    >
                      {g.d}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={css('display:flex;gap:7px;margin-top:12px;flex-wrap:wrap')}
            >
              <div
                style={css(
                  "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:5px 10px;border-radius:5px",
                )}
              >
                {'⚡ '}
                {view.zoneDet.power}
              </div>
              <div
                style={css(
                  "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:5px 10px;border-radius:5px",
                )}
              >
                {'♪ '}
                {view.zoneDet.source}
              </div>
            </div>
          </>
        ) : null}

        {view.isSecurity ? (
          <>
            <button
              type="button"
              className="security-live-launch"
              onClick={view.openGrid}
            >
              Open live cameras
            </button>
            <p className="security-recorded-note">
              Documented camera details below. Preview and history are
              demonstrations.
            </p>
            <div
              style={css(
                'position:relative;width:100%;aspect-ratio:16/9;border-radius:9px;overflow:hidden;background:#0b1015;border:1px solid #20303c;box-shadow:inset 0 0 60px rgba(0,0,0,0.6)',
              )}
            >
              <div
                style={css(
                  'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
                )}
              ></div>
              <div
                style={css(
                  'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,var(--lift-05) 0 1px,transparent 1px 38px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(170px) rotateX(58deg);transform-origin:bottom',
                )}
              ></div>
              <div
                style={css(
                  "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 24px 'Inter',system-ui,'Segoe UI',sans-serif;color:rgba(255,255,255,0.055);letter-spacing:0.06em;text-align:center;padding:0 14px",
                )}
              >
                {view.camDet.watermark}
              </div>
              <div
                style={css(
                  'position:absolute;left:0;right:0;height:22%;background:linear-gradient(180deg,transparent,rgba(120,160,200,0.10),transparent);animation:feedScan 4.5s linear infinite',
                )}
              ></div>
              <div
                style={css(
                  'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)',
                )}
              >
                <div
                  style={css(
                    "display:flex;align-items:center;gap:6px;font:600 10px 'IBM Plex Mono',monospace;color:" +
                      (view.camDet.liveColor ?? '') +
                      '',
                  )}
                >
                  <span
                    style={css(
                      'width:7px;height:7px;border-radius:50%;background:' +
                        (view.camDet.liveColor ?? '') +
                        ';animation:pulseDot 1.4s ease-in-out infinite',
                    )}
                  ></span>
                  {view.camDet.liveLabel}
                  {'\n            '}
                </div>
                <div
                  style={css(
                    "font:600 10px 'IBM Plex Mono',monospace;color:var(--t2)",
                  )}
                >
                  {view.camDet.res}
                </div>
              </div>
              <div
                style={css(
                  'position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)',
                )}
              >
                <div
                  style={css(
                    "font:600 10px 'IBM Plex Mono',monospace;color:#dfe7ee;text-shadow:0 1px 2px #000",
                  )}
                >
                  {view.camDet.name}
                </div>
                <div
                  style={css(
                    "font:500 10px 'IBM Plex Mono',monospace;color:#aeb9c4",
                  )}
                >
                  {view.camDet.time}
                </div>
              </div>
              {view.camDet.offline ? (
                <>
                  <div
                    style={css(
                      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,12,0.74);font:600 12px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.16em",
                    )}
                  >
                    {'NO SIGNAL'}
                  </div>
                </>
              ) : null}
            </div>
            <div
              style={css(
                'display:flex;align-items:center;gap:9px;margin-top:13px',
              )}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:' +
                    (view.camDet.statusColor ?? '') +
                    ';flex-shrink:0',
                )}
              ></span>
              <div
                style={css(
                  "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {view.camDet.name}
              </div>
              <div
                style={css(
                  "font:500 10px 'IBM Plex Mono',monospace;color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:2px 8px;border-radius:4px;margin-left:auto",
                )}
              >
                {view.camDet.type}
              </div>
            </div>
            <div
              style={css(
                "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:3px",
              )}
            >
              {view.camDet.room}
              {' · '}
              {view.camDet.coverage}
            </div>
            <div style={css('margin-top:13px')}>
              {(view.camDet.specs ?? []).map((sp, index) => (
                <Fragment key={sp.id ?? sp.key ?? sp.label ?? index}>
                  <div
                    style={css(
                      'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                    )}
                  >
                    <div
                      style={css(
                        "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                      )}
                    >
                      {sp.k}
                    </div>
                    <div
                      style={css(
                        "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                      )}
                    >
                      {sp.v}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={css('display:flex;gap:8px;margin-top:14px')}>
              <div
                onClick={view.openExpand}
                style={css(
                  "flex:1;text-align:center;font:600 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:#fff;background:#c0573b;border-radius:7px;padding:10px;cursor:pointer",
                )}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                {'⛶ Review demo history'}
              </div>
              <div
                onClick={view.openGrid}
                style={css(
                  "flex-shrink:0;text-align:center;font:600 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:#c0573b;background:rgba(192,87,59,0.14);border:1px solid rgba(192,87,59,0.34);border-radius:7px;padding:10px 13px;cursor:pointer",
                )}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                {'Live cameras'}
              </div>
            </div>
          </>
        ) : null}

        {view.isClimate ? (
          <>
            <div style={css('display:flex;align-items:center;gap:11px')}>
              <span
                style={css(
                  'width:13px;height:13px;background:var(--t4);transform:rotate(45deg);flex-shrink:0;opacity:0.7',
                )}
              ></span>
              <div>
                <div
                  style={css(
                    "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif;line-height:1.1",
                  )}
                >
                  {view.sensorDet.name}
                </div>
                <div
                  style={css(
                    "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                  )}
                >
                  {view.sensorDet.mount}
                </div>
              </div>
            </div>
            <div
              style={css(
                'display:flex;align-items:center;gap:8px;margin-top:13px;padding:9px 12px;border-radius:7px;background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34)',
              )}
            >
              <span
                style={css(
                  'width:8px;height:8px;border-radius:50%;background:#c0892f;flex-shrink:0',
                )}
              ></span>
              <div
                style={css(
                  "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--warn-text)",
                )}
              >
                {'Disconnected · awaiting commissioning'}
              </div>
            </div>
            <div style={css('display:flex;gap:9px;margin-top:13px')}>
              <div
                style={css(
                  'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:8px;padding:13px 4px',
                )}
              >
                <div
                  style={css(
                    "font:600 26px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);line-height:1",
                  )}
                >
                  {'—'}
                </div>
                <div
                  style={css(
                    "font:400 9px 'IBM Plex Mono',monospace;color:var(--t4);margin-top:4px;letter-spacing:0.06em",
                  )}
                >
                  {'TEMPERATURE °F'}
                </div>
              </div>
              <div
                style={css(
                  'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:8px;padding:13px 4px',
                )}
              >
                <div
                  style={css(
                    "font:600 26px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);line-height:1",
                  )}
                >
                  {'—'}
                </div>
                <div
                  style={css(
                    "font:400 9px 'IBM Plex Mono',monospace;color:var(--t4);margin-top:4px;letter-spacing:0.06em",
                  )}
                >
                  {'HUMIDITY %RH'}
                </div>
              </div>
            </div>
            <div style={css('margin-top:14px')}>
              <div
                style={css(
                  'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                )}
              >
                <div
                  style={css(
                    "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                  )}
                >
                  {'Mount'}
                </div>
                <div
                  style={css(
                    "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                  )}
                >
                  {view.sensorDet.mount}
                </div>
              </div>
              <div
                style={css(
                  'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                )}
              >
                <div
                  style={css(
                    "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                  )}
                >
                  {'Will report'}
                </div>
                <div
                  style={css(
                    "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                  )}
                >
                  {view.sensorDet.target}
                </div>
              </div>
              <div
                style={css(
                  'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                )}
              >
                <div
                  style={css(
                    "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                  )}
                >
                  {'Floor'}
                </div>
                <div
                  style={css(
                    "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                  )}
                >
                  {view.sensorDet.floorLabel}
                </div>
              </div>
            </div>
            <div
              style={css(
                "margin-top:13px;padding:10px 12px;border-radius:7px;background:var(--lift-05);border:1px solid var(--lift-08);font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);line-height:1.5",
              )}
            >
              {
                'Position is pinned in the model so the future install can pull power and pair to the IoT network with no re-survey.'
              }
            </div>
          </>
        ) : null}

        {view.isUpkeep ? (
          <>
            <div
              style={css(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
              )}
            >
              <div>
                <div
                  style={css(
                    "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif",
                  )}
                >
                  {view.upDet.kind}
                </div>
                <div
                  style={css(
                    "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:2px",
                  )}
                >
                  {view.upDet.device}
                </div>
              </div>
              <div
                style={css(
                  "font:600 10px 'IBM Plex Mono',monospace;color:" +
                    (view.upDet.statusColor ?? '') +
                    ';background:' +
                    (view.upDet.statusBg ?? '') +
                    ';border:1px solid ' +
                    (view.upDet.statusBd ?? '') +
                    ';padding:4px 9px;border-radius:5px;flex-shrink:0',
                )}
              >
                {view.upDet.statusLabel}
              </div>
            </div>
            <div style={css('margin-top:14px')}>
              <div
                style={css(
                  'display:flex;justify-content:space-between;align-items:baseline',
                )}
              >
                <div
                  style={css(
                    "font:500 11px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.04em",
                  )}
                >
                  {view.upDet.metricLabel}
                </div>
                <div
                  style={css(
                    "font:600 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1)",
                  )}
                >
                  {view.upDet.metricVal}
                </div>
              </div>
              <div
                style={css(
                  'height:9px;border-radius:5px;background:var(--track);margin-top:8px;overflow:hidden',
                )}
              >
                <div
                  style={css(
                    'height:100%;width:' +
                      (view.upDet.barPct ?? '') +
                      '%;background:' +
                      (view.upDet.barColor ?? '') +
                      ';border-radius:5px',
                  )}
                ></div>
              </div>
            </div>
            <div style={css('margin-top:14px')}>
              {(view.upDet.specs ?? []).map((sp, index) => (
                <Fragment key={sp.id ?? sp.key ?? sp.label ?? index}>
                  <div
                    style={css(
                      'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                    )}
                  >
                    <div
                      style={css(
                        "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                      )}
                    >
                      {sp.k}
                    </div>
                    <div
                      style={css(
                        "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                      )}
                    >
                      {sp.v}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={css(
                'margin-top:13px;padding:10px 12px;border-radius:7px;background:' +
                  (view.upDet.statusBg ?? '') +
                  ';border:1px solid ' +
                  (view.upDet.statusBd ?? '') +
                  ";font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);line-height:1.5",
              )}
            >
              {view.upDet.note}
            </div>
            <div
              style={css(
                'margin-top:12px;display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:7px;background:var(--lift-05);border:1px solid var(--lift-08)',
              )}
            >
              <span
                style={css(
                  'width:8px;height:8px;border-radius:50%;background:' +
                    (view.upDet.barColor ?? '') +
                    ';flex-shrink:0',
                )}
              ></span>
              <div
                style={css(
                  "font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                )}
              >
                {view.upDet.floorLabel}
              </div>
              <div
                style={css(
                  "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);margin-left:auto",
                )}
              >
                {'pinned in model'}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
