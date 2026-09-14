import { Fragment } from 'react';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";

const H2 = `font:600 13px ${FONT};margin:0`;
const COUNT = `font:400 11px ${MONO};color:var(--t3)`;
const HEAD =
  'padding:14px 16px 12px;border-bottom:1px solid var(--lift-08);flex-shrink:0';
const ROW_T = `font:500 12px ${FONT};color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
const ROW_S = `font:400 11px ${FONT};color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
const SECTION = `font:500 10px ${MONO};color:var(--t3);letter-spacing:0.12em;margin:2px 2px 8px`;

function Header({ title, count, onExport, exportLabel, children }) {
  return (
    <div style={css(HEAD)}>
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;gap:8px',
        )}
      >
        <h2 style={css(H2)}>{title}</h2>
        <div style={css('display:flex;align-items:center;gap:6px;min-width:0')}>
          {count ? <div style={css(COUNT)}>{count}</div> : null}
          {onExport ? (
            <button
              type="button"
              className="ia icon-button"
              onClick={onExport}
              aria-label={exportLabel || 'Export the visible list as CSV'}
              title="Export CSV"
            >
              <Icon name="download" size={13} />
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function Chips({ items, label }) {
  return (
    <div
      style={css('display:flex;gap:5px;flex-wrap:wrap;margin-top:11px')}
      role="group"
      aria-label={label}
    >
      {(items ?? []).map((t, index) => (
        <Fragment key={t.key ?? index}>
          <button
            type="button"
            className="ia"
            style={css(t.style)}
            onClick={t.onClick}
            aria-pressed={t.on}
          >
            {t.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function Option({ id, row, children, ariaLabel }) {
  return (
    <div
      id={`row-${id}`}
      onClick={row.onClick}
      style={css(row.rowStyle)}
      className="ia"
      role="option"
      aria-selected={!!row.selected}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={optionOnKey}
    >
      {children}
    </div>
  );
}

function Empty({ text, action, actionLabel }) {
  return (
    <div
      style={css(
        `padding:28px 14px;text-align:center;font:400 12px ${FONT};color:var(--t3);line-height:1.5`,
      )}
      role="status"
    >
      <div>{text}</div>
      {action ? (
        <button
          type="button"
          className="ia link-button"
          onClick={action}
          style={css('margin-top:8px')}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function StatusText({ label, color }) {
  return (
    <span
      style={css(
        `font:600 10px ${MONO};letter-spacing:0.04em;color:${color};flex-shrink:0`,
      )}
    >
      {label}
    </span>
  );
}

export function SystemList({ view }) {
  return (
    <aside
      id="panel-left"
      ref={view.listRef}
      style={css(view.listPanelStyle)}
      aria-label={`${view.modeLabel} inventory`}
      inert={view.leftHidden ? true : undefined}
    >
      {view.isOverview ? (
        <>
          <div
            style={css(
              'padding:16px 17px 13px;border-bottom:1px solid var(--lift-08);flex-shrink:0',
            )}
          >
            <h2
              style={css(
                `font:600 15px ${FONT};letter-spacing:-0.01em;margin:0`,
              )}
            >
              {'Home Documentation'}
            </h2>
            <div
              style={css(
                `font:400 12px ${FONT};color:var(--t3);margin-top:3px;line-height:1.45`,
              )}
            >
              {
                'Every circuit, fixture, node and speaker — recorded where it physically lives.'
              }
            </div>
          </div>
          <div style={css('overflow:auto;padding:14px 16px 18px')}>
            <div
              style={css('display:grid;grid-template-columns:1fr 1fr;gap:9px')}
              role="list"
              aria-label="System summaries"
            >
              {(view.overviewStats ?? []).map((s, index) => (
                <div role="listitem" key={s.label ?? index}>
                  <button
                    type="button"
                    onClick={s.onClick}
                    className="ia stat-card"
                    style={css(
                      'width:100%;text-align:left;background:var(--lift-04);border:1px solid var(--lift-08);border-left:3px solid ' +
                        (s.accent ?? '') +
                        ';border-radius:7px;padding:11px 12px;cursor:pointer;color:inherit',
                    )}
                    aria-label={`${s.label}: ${s.stat} ${s.sub}. Open ${s.label.toLowerCase()}`}
                  >
                    <div
                      style={css(
                        `font:500 10px ${MONO};color:var(--t3);letter-spacing:0.08em`,
                      )}
                    >
                      {s.label}
                    </div>
                    <div
                      className="count-up"
                      style={css(
                        `font:600 23px ${FONT};margin-top:5px;line-height:1`,
                      )}
                    >
                      {s.stat}
                    </div>
                    <div
                      style={css(
                        `font:400 11px ${FONT};color:var(--t3);margin-top:2px`,
                      )}
                    >
                      {s.sub}
                    </div>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={view.goClimate}
              className="ia"
              style={css(
                'width:100%;display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;background:rgba(63,154,140,0.14);border:1px solid rgba(63,154,140,0.32);border-radius:7px;cursor:pointer;text-align:left;color:inherit',
              )}
            >
              <span
                style={css(
                  'width:10px;height:10px;background:#3f9a8c;transform:rotate(45deg);flex-shrink:0;opacity:0.7',
                )}
                aria-hidden="true"
              ></span>
              <div
                style={css(
                  `flex:1;font:500 12px ${FONT};color:var(--teal-text)`,
                )}
              >
                {view.climateBannerText}
              </div>
              <Icon name="arrowRight" size={12} style={{ color: '#3f9a8c' }} />
            </button>
            <h3 style={css(`${SECTION};margin:18px 2px 8px`)}>{'THE HOUSE'}</h3>
            <dl style={css('margin:0')}>
              {(view.quickFacts ?? []).map((f, index) => (
                <div
                  key={f.label ?? index}
                  style={css(
                    'display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                  )}
                >
                  <dt
                    style={css(
                      `font:400 12px ${FONT};color:var(--t3);flex-shrink:0`,
                    )}
                  >
                    {f.label}
                  </dt>
                  <dd
                    style={css(
                      `font:500 12px ${FONT};color:var(--t1);text-align:right;margin:0`,
                    )}
                  >
                    {f.val}
                  </dd>
                </div>
              ))}
            </dl>
            <div
              style={css(
                `font:400 11px ${FONT};color:var(--t4);margin-top:12px;line-height:1.45`,
              )}
            >
              {`Recorded inventory as of ${view.snapshot}. Statuses are documentation, not live telemetry.`}
            </div>
          </div>
        </>
      ) : null}

      {view.isElectrical ? (
        <>
          <Header
            title="Circuits"
            count={`${view.ecount} shown`}
            onExport={view.exportCurrent}
          >
            <Chips items={view.typeFilters} label="Circuit type" />
          </Header>
          <div style={css('overflow:auto;padding:8px 11px 14px')}>
            {view.circGroups.length === 0 ? (
              <Empty text="No circuits of this type." />
            ) : null}
            {(view.circGroups ?? []).map((grp, index) => (
              <Fragment key={grp.id ?? index}>
                <div role="listbox" aria-label={`${grp.boxName} circuits`}>
                  <div
                    id={`row-panel-${grp.id}`}
                    role="option"
                    aria-selected={grp.selected}
                    tabIndex={0}
                    onKeyDown={optionOnKey}
                    onClick={grp.onClick}
                    className="ia"
                    style={css(
                      'display:flex;align-items:baseline;gap:8px;padding:9px 6px 6px;border-radius:6px;cursor:pointer;margin-top:4px' +
                        (grp.selected
                          ? ';background:var(--lift-06);box-shadow:inset 0 0 0 1.5px #3b6fb0'
                          : ''),
                    )}
                    aria-label={`${grp.boxName} panel`}
                  >
                    <div
                      style={css(
                        `font:600 11px ${MONO};color:var(--t1);letter-spacing:0.06em`,
                      )}
                    >
                      {grp.boxShort}
                    </div>
                    <div
                      style={css(
                        `font:400 11px ${FONT};color:var(--t3);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                      )}
                    >
                      {grp.boxName}
                    </div>
                  </div>
                  {(grp.items ?? []).map((c, index) => (
                    <Fragment key={c.id ?? index}>
                      <Option
                        id={c.id}
                        row={c}
                        ariaLabel={`${c.tag} ${c.label}, ${c.amp}, ${c.typeLabel}`}
                      >
                        <span style={css(c.dotStyle)} aria-hidden="true"></span>
                        <div style={css(c.tagStyle)}>{c.tag}</div>
                        <div style={css(c.labelStyle)}>{c.label}</div>
                        <div style={css(c.ampStyle)}>{c.amp}</div>
                      </Option>
                    </Fragment>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isLighting ? (
        <>
          <Header
            title="Fixture records"
            count={view.lcount}
            onExport={view.exportCurrent}
          >
            <div
              style={css('display:flex;gap:6px;margin-top:11px')}
              role="list"
              aria-label="Fixture status totals for the whole inventory"
              hidden={view.short}
            >
              {(view.lsum ?? []).map((s, index) => (
                <div
                  key={s.label ?? index}
                  role="listitem"
                  style={css(
                    'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:6px;padding:7px 4px',
                  )}
                >
                  <div
                    style={css(
                      `font:600 16px ${FONT};color:${s.color ?? 'var(--t1)'};line-height:1`,
                    )}
                  >
                    {s.val}
                  </div>
                  <div
                    style={css(
                      `font:400 10px ${MONO};color:var(--t3);margin-top:3px;letter-spacing:0.03em`,
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={css(
                `font:400 10px ${FONT};color:var(--t4);margin-top:4px`,
              )}
            >
              {
                'Totals count fixture records (a record may hold several bulbs) · all rooms'
              }
            </div>
            <Chips items={view.lfilters} label="Fixture status filter" />
            <select
              value={view.lroom}
              onChange={view.setLroom}
              aria-label="Filter fixtures by room"
              style={css(
                `width:100%;margin-top:6px;padding:6px 8px;border:1px solid var(--lift-12);border-radius:6px;background:var(--lift-06);font:500 11px ${FONT};color:var(--t1);cursor:pointer`,
              )}
            >
              {(view.lroomOpts ?? []).map((o, index) => (
                <option key={o.val ?? index} value={o.val}>
                  {o.label}
                </option>
              ))}
            </select>
          </Header>
          <div
            style={css('overflow:auto;padding:9px 11px 14px')}
            role="listbox"
            aria-label="Fixture records"
          >
            {view.bulbRows.length === 0 ? (
              <Empty
                text={`No fixture records match ${view.lroomLabel !== 'All rooms' ? view.lroomLabel + ' and ' : ''}the current filter.`}
                action={() => {
                  view.lfilters[0].onClick();
                  view.setLroom({ target: { value: 'all' } });
                }}
                actionLabel="Reset filters"
              />
            ) : null}
            {(view.bulbRows ?? []).map((b, index) => (
              <Fragment key={b.id ?? index}>
                <Option
                  id={b.id}
                  row={b}
                  ariaLabel={`${b.room}, ${b.fixture}, ${b.statusLabel}, ${b.spec}`}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (b.color ?? '') +
                        ';flex-shrink:0',
                    )}
                    aria-hidden="true"
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css(ROW_T)}>{b.room}</div>
                    <div style={css(ROW_S)}>{b.fixture}</div>
                  </div>
                  <StatusText label={b.statusLabel} color={b.color} />
                  <span
                    style={css(
                      `display:inline-flex;align-items:center;gap:4px;font:500 10px ${MONO};color:var(--t3);flex-shrink:0`,
                    )}
                    title={b.spec}
                  >
                    <span
                      style={css(
                        'width:11px;height:11px;border-radius:50%;background:' +
                          (b.kColor ?? '') +
                          ';border:1px solid #00000018;flex-shrink:0',
                      )}
                      aria-hidden="true"
                    ></span>
                    {b.kText}
                  </span>
                </Option>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isNetwork ? (
        <>
          <Header title="Networks" onExport={view.exportCurrent}>
            <div
              style={css(
                'display:flex;flex-direction:column;gap:5px;margin-top:10px',
              )}
              role="list"
              aria-label="Recorded networks"
            >
              {(view.networks ?? []).map((n, index) => (
                <div
                  key={n.id ?? index}
                  role="listitem"
                  id={`row-net-${n.id}`}
                  tabIndex={-1}
                  style={css(
                    'display:flex;align-items:center;gap:8px;border-radius:6px',
                  )}
                >
                  <span
                    style={css(
                      'width:9px;height:9px;border-radius:2px;background:' +
                        (n.color ?? '') +
                        ';flex-shrink:0',
                    )}
                    aria-hidden="true"
                  ></span>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css(`font:500 12px ${FONT};color:var(--t1)`)}>
                      {n.name}
                    </div>
                    <div style={css(`font:400 10px ${MONO};color:var(--t3)`)}>
                      {`SSID ${n.ssid} · ${n.members} node${n.members === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <div style={css(`font:400 11px ${MONO};color:var(--t3)`)}>
                    {n.band}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={css(
                `font:400 10px ${FONT};color:var(--t4);margin-top:6px`,
              )}
            >
              {'Recorded names only — no credentials are stored or shown.'}
            </div>
          </Header>
          <div style={css('overflow:auto;padding:11px 13px 14px')}>
            <h3 style={css(SECTION)}>{'MESH NODES'}</h3>
            <div role="listbox" aria-label="Mesh nodes">
              {(view.nodeList ?? []).map((n, index) => (
                <Fragment key={n.id ?? index}>
                  <Option
                    id={n.id}
                    row={n}
                    ariaLabel={`${n.name}, ${n.role}, ${n.room}, ${n.statusLabel}, networks: ${n.netText}`}
                  >
                    <span
                      style={css(
                        'width:8px;height:8px;border-radius:50%;background:' +
                          (n.statusColor ?? '') +
                          ';flex-shrink:0',
                      )}
                      aria-hidden="true"
                    ></span>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css(ROW_T)}>{n.name}</div>
                      <div style={css(ROW_S)}>
                        {n.role}
                        {' · '}
                        {n.room}
                      </div>
                    </div>
                    <StatusText label={n.statusLabel} color={n.statusColor} />
                    <div
                      style={css('display:flex;gap:3px;flex-shrink:0')}
                      title={n.netText}
                      aria-hidden="true"
                    >
                      {(n.netDots ?? []).map((d, index) => (
                        <span
                          key={d.id ?? index}
                          style={css(
                            'width:8px;height:8px;border-radius:2px;background:' +
                              (d.color ?? ''),
                          )}
                        ></span>
                      ))}
                    </div>
                  </Option>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {view.isSound ? (
        <>
          <Header title="Sound zones" onExport={view.exportCurrent}>
            <div
              style={css(
                `font:400 11px ${FONT};color:var(--t3);margin-top:3px`,
              )}
            >
              {
                'Two documented surround zones. Selecting one marks its room with a schematic speaker cluster.'
              }
            </div>
          </Header>
          <div
            style={css('overflow:auto;padding:12px 13px 14px')}
            role="listbox"
            aria-label="Sound zones"
          >
            {(view.zoneList ?? []).map((z, index) => (
              <Fragment key={z.id ?? index}>
                <div
                  id={`row-${z.id}`}
                  onClick={z.onClick}
                  style={css(z.cardStyle)}
                  className="ia"
                  role="option"
                  aria-selected={z.selected}
                  tabIndex={0}
                  onKeyDown={optionOnKey}
                  aria-label={`${z.name} zone, ${z.config}, ${z.room}`}
                >
                  <div
                    style={css(
                      'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
                    )}
                  >
                    <div>
                      <div style={css(`font:600 15px ${FONT};color:var(--t1)`)}>
                        {z.name}
                      </div>
                      <div
                        style={css(
                          `font:400 11px ${FONT};color:var(--t3);margin-top:2px`,
                        )}
                      >
                        {z.room}
                      </div>
                    </div>
                    <div
                      style={css(
                        `font:600 11px ${MONO};color:var(--ring-text);background:rgba(123,92,214,0.18);border:1px solid rgba(123,92,214,0.4);padding:3px 8px;border-radius:4px;flex-shrink:0`,
                      )}
                    >
                      {z.config}
                    </div>
                  </div>
                  <div
                    style={css(
                      `display:flex;align-items:center;gap:5px;margin-top:9px;font:400 11px ${FONT};color:var(--t3)`,
                    )}
                  >
                    <Icon name="bolt" size={11} />
                    {z.power}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isSecurity ? (
        <>
          <Header title="Camera inventory" onExport={view.exportCurrent}>
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px',
              )}
            >
              <div style={css(`font:400 11px ${FONT};color:var(--t3)`)}>
                {view.camOnline}
                {' of '}
                {view.camTotal}
                {' recorded as online'}
              </div>
              <button
                type="button"
                onClick={view.openGrid}
                className="ia"
                style={css(
                  `display:inline-flex;align-items:center;gap:5px;font:600 11px ${MONO};color:var(--alert-text);background:rgba(192,87,59,0.16);border:1px solid rgba(192,87,59,0.34);padding:4px 9px;border-radius:6px;cursor:pointer;white-space:nowrap;flex-shrink:0`,
                )}
                aria-haspopup="dialog"
              >
                <Icon name="grid" size={11} />
                {'Live cameras'}
              </button>
            </div>
            <Chips items={view.camFilters} label="Camera filter" />
          </Header>
          <div
            style={css('overflow:auto;padding:9px 11px 14px')}
            role="listbox"
            aria-label="Cameras"
          >
            {view.camList.length === 0 ? (
              <Empty
                text="No cameras match this filter."
                action={view.camFilters[0].onClick}
                actionLabel="Show all cameras"
              />
            ) : null}
            {(view.camList ?? []).map((c, index) => (
              <Fragment key={c.id ?? index}>
                <Option
                  id={c.id}
                  row={c}
                  ariaLabel={`${c.name}, ${c.sub}, recorded ${c.statusLabel}, ${c.res}`}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (c.statusColor ?? '') +
                        ';flex-shrink:0',
                    )}
                    aria-hidden="true"
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css(ROW_T)}>{c.name}</div>
                    <div style={css(ROW_S)}>{c.sub}</div>
                  </div>
                  <StatusText label={c.statusLabel} color={c.statusColor} />
                  <div
                    style={css(
                      `font:500 10px ${MONO};color:var(--t3);flex-shrink:0`,
                    )}
                  >
                    {c.res}
                  </div>
                </Option>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isClimate ? (
        <>
          <Header title="Climate sensors" onExport={view.exportCurrent}>
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px',
              )}
            >
              <div
                style={css(
                  `font:400 11px ${FONT};color:var(--t3);line-height:1.45`,
                )}
              >
                {view.sensorsPlanned}
                {' temp / humidity sensors planned — none connected yet.'}
              </div>
              <div
                style={css(
                  `font:600 10px ${MONO};color:var(--warn-text);background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34);padding:3px 8px;border-radius:5px;flex-shrink:0`,
                )}
              >
                {'PLANNED'}
              </div>
            </div>
          </Header>
          <div
            style={css('overflow:auto;padding:9px 11px 14px')}
            role="listbox"
            aria-label="Planned sensors"
          >
            {(view.sensorList ?? []).map((s, index) => (
              <Fragment key={s.id ?? index}>
                <Option
                  id={s.id}
                  row={s}
                  ariaLabel={`${s.name} sensor, ${s.mount}, ${s.badge.toLowerCase()}`}
                >
                  <span
                    style={css(
                      'width:9px;height:9px;background:' +
                        (s.dot ?? '') +
                        ';transform:rotate(45deg);flex-shrink:0;opacity:0.75',
                    )}
                    aria-hidden="true"
                  ></span>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css(ROW_T)}>{s.name}</div>
                    <div style={css(ROW_S)}>{s.mount}</div>
                  </div>
                  <StatusText label={s.badge} color="var(--t3)" />
                </Option>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      {view.isUpkeep ? (
        <>
          <Header
            title="Replacements"
            count={view.upCount}
            onExport={view.exportCurrent}
          >
            <div
              style={css('display:flex;gap:6px;margin-top:11px')}
              role="list"
              aria-label="Replacement status totals for all tracked items"
              hidden={view.short}
            >
              {(view.upSummary ?? []).map((s, index) => (
                <div
                  key={s.label ?? index}
                  role="listitem"
                  style={css(
                    'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:6px;padding:7px 4px',
                  )}
                >
                  <div
                    style={css(
                      `font:600 16px ${FONT};color:${s.color ?? 'var(--t1)'};line-height:1`,
                    )}
                  >
                    {s.val}
                  </div>
                  <div
                    style={css(
                      `font:400 10px ${MONO};color:var(--t3);margin-top:3px;letter-spacing:0.03em`,
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={css(
                `font:400 10px ${FONT};color:var(--t4);margin-top:4px`,
              )}
            >
              {`Recorded as of ${view.snapshot} · statuses do not advance automatically`}
            </div>
            <Chips items={view.ufilters} label="Replacement filter" />
          </Header>
          <div
            style={css('overflow:auto;padding:9px 11px 14px')}
            role="listbox"
            aria-label="Replacement items"
          >
            {view.upList.length === 0 ? (
              <Empty
                text="No items match this filter."
                action={view.ufilters[0].onClick}
                actionLabel="Show all items"
              />
            ) : null}
            {(view.upList ?? []).map((u, index) => (
              <Fragment key={u.id ?? index}>
                <Option
                  id={u.id}
                  row={u}
                  ariaLabel={`${u.kind}, ${u.device}, ${u.statusLabel}, ${u.dueLabel}`}
                >
                  <div style={css('display:flex;align-items:center;gap:9px')}>
                    <span
                      style={css(
                        'width:9px;height:9px;border-radius:50%;background:' +
                          (u.statusColor ?? '') +
                          ';flex-shrink:0',
                      )}
                      aria-hidden="true"
                    ></span>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css(ROW_T)}>{u.kind}</div>
                      <div style={css(ROW_S)}>{u.device}</div>
                    </div>
                    <StatusText label={u.statusLabel} color={u.statusColor} />
                  </div>
                  <div
                    style={css(
                      'display:flex;align-items:center;gap:8px;margin-top:8px',
                    )}
                  >
                    <div
                      style={css(
                        'flex:1;height:5px;border-radius:3px;background:var(--track);overflow:hidden',
                      )}
                      role="img"
                      aria-label={u.barAria}
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
                    <div
                      style={css(
                        `font:500 10px ${MONO};color:var(--t3);flex-shrink:0`,
                      )}
                    >
                      {u.dueLabel}
                    </div>
                  </div>
                </Option>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}
