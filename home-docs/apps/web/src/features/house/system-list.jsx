import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function SystemList({ view }) {
  return (
    <aside style={css(view.listPanelStyle)}>
      {view.isOverview ? (
        <>
          <div
            style={css(
              'padding:16px 17px 13px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                "font:600 15px 'Inter',system-ui,'Segoe UI',sans-serif;letter-spacing:-0.01em",
              )}
            >
              {'Home Documentation'}
            </div>
            <div
              style={css(
                "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:3px;line-height:1.45",
              )}
            >
              {
                'Every circuit, bulb, node and speaker — mapped to where it physically lives.'
              }
            </div>
          </div>
          <div style={css('overflow:auto;padding:14px 16px 18px')}>
            <div
              style={css('display:grid;grid-template-columns:1fr 1fr;gap:9px')}
            >
              {(view.overviewStats ?? []).map((s, index) => (
                <Fragment key={s.id ?? s.key ?? s.label ?? index}>
                  <div
                    onClick={s.onClick}
                    style={css(
                      'background:var(--lift-04);border:1px solid var(--lift-08);border-left:3px solid ' +
                        (s.accent ?? '') +
                        ';border-radius:7px;padding:11px 12px;cursor:pointer',
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    <div
                      style={css(
                        "font:500 9px 'IBM Plex Mono',monospace;color:var(--t3);letter-spacing:0.08em",
                      )}
                    >
                      {s.label}
                    </div>
                    <div
                      style={css(
                        "font:600 23px 'Inter',system-ui,'Segoe UI',sans-serif;margin-top:5px;line-height:1",
                      )}
                    >
                      {s.stat}
                    </div>
                    <div
                      style={css(
                        "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);margin-top:2px",
                      )}
                    >
                      {s.sub}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              onClick={view.goClimate}
              style={css(
                'display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;background:rgba(63,154,140,0.14);border:1px solid rgba(63,154,140,0.32);border-radius:7px;cursor:pointer',
              )}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
            >
              <span
                style={css(
                  'width:10px;height:10px;background:#3f9a8c;transform:rotate(45deg);flex-shrink:0;opacity:0.7',
                )}
              ></span>
              <div
                style={css(
                  "flex:1;font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--teal-text)",
                )}
              >
                {view.climateBannerText}
              </div>
              <div
                style={css(
                  "font:500 10px 'IBM Plex Mono',monospace;color:#3f9a8c",
                )}
              >
                {'→'}
              </div>
            </div>
            <div
              style={css(
                "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em;margin:18px 2px 8px",
              )}
            >
              {'THE HOUSE'}
            </div>
            {(view.quickFacts ?? []).map((f, index) => (
              <Fragment key={f.id ?? f.key ?? f.label ?? index}>
                <div
                  style={css(
                    'display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                  )}
                >
                  <div
                    style={css(
                      "font:400 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);flex-shrink:0",
                    )}
                  >
                    {f.label}
                  </div>
                  <div
                    style={css(
                      "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);text-align:right",
                    )}
                  >
                    {f.val}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isElectrical ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between',
              )}
            >
              <div
                style={css(
                  "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {'Circuits'}
              </div>
              <div
                style={css(
                  "font:400 10.5px 'IBM Plex Mono',monospace;color:var(--t4)",
                )}
              >
                {view.ecount}
                {' shown'}
              </div>
            </div>
            <div
              style={css('display:flex;gap:5px;flex-wrap:wrap;margin-top:11px')}
            >
              {(view.typeFilters ?? []).map((t, index) => (
                <Fragment key={t.id ?? t.key ?? t.label ?? index}>
                  <div
                    style={css(t.style)}
                    onClick={t.onClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    {t.label}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css('overflow:auto;padding:8px 11px 14px')}>
            {(view.circGroups ?? []).map((grp, index) => (
              <Fragment key={grp.id ?? grp.key ?? grp.label ?? index}>
                <div
                  style={css(
                    'display:flex;align-items:baseline;gap:8px;padding:11px 5px 6px',
                  )}
                >
                  <div
                    style={css(
                      "font:600 10px 'IBM Plex Mono',monospace;color:var(--t1);letter-spacing:0.06em",
                    )}
                  >
                    {grp.boxShort}
                  </div>
                  <div
                    style={css(
                      "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                    )}
                  >
                    {grp.boxName}
                  </div>
                </div>
                {(grp.items ?? []).map((c, index) => (
                  <Fragment key={c.id ?? c.key ?? c.label ?? index}>
                    <div
                      onClick={c.onClick}
                      style={css(c.rowStyle)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={activateOnKey}
                    >
                      <span style={css(c.dotStyle)}></span>
                      <div style={css(c.tagStyle)}>{c.tag}</div>
                      <div style={css(c.labelStyle)}>{c.label}</div>
                      <div style={css(c.ampStyle)}>{c.amp}</div>
                    </div>
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isLighting ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between',
              )}
            >
              <div
                style={css(
                  "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {'Bulbs'}
              </div>
              <div
                style={css(
                  "font:400 10.5px 'IBM Plex Mono',monospace;color:var(--t4)",
                )}
              >
                {view.lcount}
              </div>
            </div>
            <div style={css('display:flex;gap:6px;margin-top:11px')}>
              {(view.lsum ?? []).map((s, index) => (
                <Fragment key={s.id ?? s.key ?? s.label ?? index}>
                  <div
                    style={css(
                      'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:6px;padding:7px 4px',
                    )}
                  >
                    <div
                      style={css(
                        "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif;color:" +
                          (s.color ?? '') +
                          ';line-height:1',
                      )}
                    >
                      {s.val}
                    </div>
                    <div
                      style={css(
                        "font:400 8.5px 'IBM Plex Mono',monospace;color:var(--t4);margin-top:3px;letter-spacing:0.03em",
                      )}
                    >
                      {s.label}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={css('display:flex;gap:5px;flex-wrap:wrap;margin-top:10px')}
            >
              {(view.lfilters ?? []).map((f, index) => (
                <Fragment key={f.id ?? f.key ?? f.label ?? index}>
                  <div
                    style={css(f.style)}
                    onClick={f.onClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    {f.label}
                  </div>
                </Fragment>
              ))}
              <select
                value={view.lroom}
                onChange={view.setLroom}
                style={css(
                  "flex:1;min-width:0;padding:5px 8px;border:1px solid var(--lift-12);border-radius:6px;background:var(--lift-06);font:500 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);cursor:pointer",
                )}
              >
                {(view.lroomOpts ?? []).map((o, index) => (
                  <Fragment key={o.id ?? o.key ?? o.label ?? index}>
                    <option value={o.val}>{o.label}</option>
                  </Fragment>
                ))}
              </select>
            </div>
          </div>
          <div style={css('overflow:auto;padding:9px 11px 14px')}>
            {(view.bulbRows ?? []).map((b, index) => (
              <Fragment key={b.id ?? b.key ?? b.label ?? index}>
                <div
                  onClick={b.onClick}
                  style={css(b.rowStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (b.color ?? '') +
                        ';flex-shrink:0',
                    )}
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div
                      style={css(
                        "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
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
                  <span
                    style={css(
                      'width:13px;height:13px;border-radius:50%;background:' +
                        (b.kColor ?? '') +
                        ';border:1px solid #00000018;flex-shrink:0',
                    )}
                    title={b.spec}
                  ></span>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isNetwork ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
              )}
            >
              {'Networks'}
            </div>
            <div
              style={css(
                'display:flex;flex-direction:column;gap:5px;margin-top:10px',
              )}
            >
              {(view.networks ?? []).map((n, index) => (
                <Fragment key={n.id ?? n.key ?? n.label ?? index}>
                  <div style={css('display:flex;align-items:center;gap:8px')}>
                    <span
                      style={css(
                        'width:9px;height:9px;border-radius:2px;background:' +
                          (n.color ?? '') +
                          ';flex-shrink:0',
                      )}
                    ></span>
                    <div
                      style={css(
                        "font:500 11.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1)",
                      )}
                    >
                      {n.name}
                    </div>
                    <div
                      style={css(
                        "font:400 10px 'IBM Plex Mono',monospace;color:var(--t4);margin-left:auto",
                      )}
                    >
                      {n.band}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css('overflow:auto;padding:11px 13px 14px')}>
            <div
              style={css(
                "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em;margin:2px 2px 8px",
              )}
            >
              {'MESH NODES'}
            </div>
            {(view.nodeList ?? []).map((n, index) => (
              <Fragment key={n.id ?? n.key ?? n.label ?? index}>
                <div
                  onClick={n.onClick}
                  style={css(n.rowStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (n.statusColor ?? '') +
                        ';flex-shrink:0',
                    )}
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div
                      style={css(
                        "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {n.name}
                    </div>
                    <div
                      style={css(
                        "font:400 10px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {n.role}
                      {' · '}
                      {n.room}
                    </div>
                  </div>
                  <div style={css('display:flex;gap:3px;flex-shrink:0')}>
                    {(n.netDots ?? []).map((d, index) => (
                      <Fragment key={d.id ?? d.key ?? d.label ?? index}>
                        <span
                          style={css(
                            'width:8px;height:8px;border-radius:2px;background:' +
                              (d.color ?? '') +
                              '',
                          )}
                        ></span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isSound ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
              )}
            >
              {'Sound Zones'}
            </div>
            <div
              style={css(
                "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:3px",
              )}
            >
              {
                'Two full surround zones — select one to light its speakers in the model.'
              }
            </div>
          </div>
          <div style={css('overflow:auto;padding:12px 13px 14px')}>
            {(view.zoneList ?? []).map((z, index) => (
              <Fragment key={z.id ?? z.key ?? z.label ?? index}>
                <div
                  onClick={z.onClick}
                  style={css(z.cardStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <div
                    style={css(
                      'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
                    )}
                  >
                    <div>
                      <div
                        style={css(
                          "font:600 14px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1)",
                        )}
                      >
                        {z.name}
                      </div>
                      <div
                        style={css(
                          "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);margin-top:2px",
                        )}
                      >
                        {z.room}
                      </div>
                    </div>
                    <div
                      style={css(
                        "font:600 10px 'IBM Plex Mono',monospace;color:var(--ring-text);background:rgba(123,92,214,0.18);border:1px solid rgba(123,92,214,0.4);padding:3px 8px;border-radius:4px;flex-shrink:0",
                      )}
                    >
                      {z.config}
                    </div>
                  </div>
                  <div style={css('display:flex;gap:14px;margin-top:9px')}>
                    <div
                      style={css(
                        "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3)",
                      )}
                    >
                      {'⚡ '}
                      {z.power}
                    </div>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isSecurity ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between',
              )}
            >
              <div
                style={css(
                  "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {'Camera inventory'}
              </div>
              <div
                onClick={view.openGrid}
                style={css(
                  "font:600 10px 'IBM Plex Mono',monospace;color:#c0573b;background:rgba(192,87,59,0.16);border:1px solid rgba(192,87,59,0.34);padding:4px 9px;border-radius:6px;cursor:pointer;white-space:nowrap;flex-shrink:0",
                )}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                {'▦ Live cameras'}
              </div>
            </div>
            <div
              style={css(
                "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:4px",
              )}
            >
              {view.camOnline}
              {' of '}
              {view.camTotal}
              {' recorded as online · select for documented details'}
            </div>
            <div
              style={css('display:flex;gap:5px;flex-wrap:wrap;margin-top:10px')}
            >
              {(view.camFilters ?? []).map((f, index) => (
                <Fragment key={f.id ?? f.key ?? f.label ?? index}>
                  <div
                    style={css(f.style)}
                    onClick={f.onClick}
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
          <div style={css('overflow:auto;padding:9px 11px 14px')}>
            {(view.camList ?? []).map((c, index) => (
              <Fragment key={c.id ?? c.key ?? c.label ?? index}>
                <div
                  onClick={c.onClick}
                  style={css(c.rowStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (c.statusColor ?? '') +
                        ';flex-shrink:0',
                    )}
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div
                      style={css(
                        "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {c.name}
                    </div>
                    <div
                      style={css(
                        "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {c.sub}
                    </div>
                  </div>
                  <div
                    style={css(
                      "font:500 9px 'IBM Plex Mono',monospace;color:var(--t4);flex-shrink:0",
                    )}
                  >
                    {c.res}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isClimate ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between',
              )}
            >
              <div
                style={css(
                  "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {'Climate Sensors'}
              </div>
              <div
                style={css(
                  "font:600 9px 'IBM Plex Mono',monospace;color:var(--warn-text);background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34);padding:3px 8px;border-radius:5px",
                )}
              >
                {'PLANNED'}
              </div>
            </div>
            <div
              style={css(
                "font:400 11px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t3);margin-top:4px;line-height:1.45",
              )}
            >
              {view.sensorsPlanned}
              {
                ' temp / humidity sensors mapped for the smart-home rollout — none connected yet.'
              }
            </div>
          </div>
          <div style={css('overflow:auto;padding:9px 11px 14px')}>
            {(view.sensorList ?? []).map((s, index) => (
              <Fragment key={s.id ?? s.key ?? s.label ?? index}>
                <div
                  onClick={s.onClick}
                  style={css(s.rowStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <span
                    style={css(
                      'width:9px;height:9px;background:' +
                        (s.dot ?? '') +
                        ';transform:rotate(45deg);flex-shrink:0;opacity:0.75',
                    )}
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div
                      style={css(
                        "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {s.name}
                    </div>
                    <div
                      style={css(
                        "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                      )}
                    >
                      {s.mount}
                    </div>
                  </div>
                  <div
                    style={css(
                      "font:600 8.5px 'IBM Plex Mono',monospace;color:var(--t4);flex-shrink:0",
                    )}
                  >
                    {s.badge}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isUpkeep ? (
        <>
          <div
            style={css(
              'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between',
              )}
            >
              <div
                style={css(
                  "font:600 13px 'Inter',system-ui,'Segoe UI',sans-serif",
                )}
              >
                {'Replacements'}
              </div>
              <div
                style={css(
                  "font:400 10.5px 'IBM Plex Mono',monospace;color:var(--t4)",
                )}
              >
                {view.upTotal}
                {' tracked'}
              </div>
            </div>
            <div style={css('display:flex;gap:6px;margin-top:11px')}>
              {(view.upSummary ?? []).map((s, index) => (
                <Fragment key={s.id ?? s.key ?? s.label ?? index}>
                  <div
                    style={css(
                      'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:6px;padding:7px 4px',
                    )}
                  >
                    <div
                      style={css(
                        "font:600 16px 'Inter',system-ui,'Segoe UI',sans-serif;color:" +
                          (s.color ?? '') +
                          ';line-height:1',
                      )}
                    >
                      {s.val}
                    </div>
                    <div
                      style={css(
                        "font:400 8.5px 'IBM Plex Mono',monospace;color:var(--t4);margin-top:3px;letter-spacing:0.03em",
                      )}
                    >
                      {s.label}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css('overflow:auto;padding:9px 11px 14px')}>
            {(view.upList ?? []).map((u, index) => (
              <Fragment key={u.id ?? u.key ?? u.label ?? index}>
                <div
                  onClick={u.onClick}
                  style={css(u.rowStyle)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  <div style={css('display:flex;align-items:center;gap:9px')}>
                    <span
                      style={css(
                        'width:9px;height:9px;border-radius:50%;background:' +
                          (u.statusColor ?? '') +
                          ';flex-shrink:0',
                      )}
                    ></span>
                    <div style={css('flex:1;min-width:0')}>
                      <div
                        style={css(
                          "font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                        )}
                      >
                        {u.kind}
                      </div>
                      <div
                        style={css(
                          "font:400 10px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                        )}
                      >
                        {u.device}
                      </div>
                    </div>
                    <div
                      style={css(
                        "font:500 9.5px 'IBM Plex Mono',monospace;color:" +
                          (u.statusColor ?? '') +
                          ';flex-shrink:0',
                      )}
                    >
                      {u.dueLabel}
                    </div>
                  </div>
                  <div
                    style={css(
                      'height:5px;border-radius:3px;background:var(--track);margin-top:8px;overflow:hidden',
                    )}
                  >
                    <div
                      style={css(
                        'height:100%;width:' +
                          (u.barPct ?? '') +
                          '%;background:' +
                          (u.barColor ?? '') +
                          ';border-radius:3px',
                      )}
                    ></div>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}
