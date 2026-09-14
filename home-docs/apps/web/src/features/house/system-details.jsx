import { Fragment } from 'react';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';
import { FeedClock } from './feed-clock';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";
const SECTION = `font:500 10px ${MONO};color:var(--t3);letter-spacing:0.1em;margin:18px 0 7px`;
const KEY = `font:400 12px ${FONT};color:var(--t3)`;
const VAL = `font:500 12px ${FONT};color:var(--t1);text-align:right`;
const NOTE = `font:400 11px ${FONT};color:var(--t3);line-height:1.5`;
const TITLE = `font:600 16px ${FONT};line-height:1.15;margin:0`;
const SUB = `font:400 12px ${FONT};color:var(--t3);margin-top:2px`;

function Notice({ notice, tone }) {
  if (!notice) return null;
  const warn = tone !== 'info';
  return (
    <div
      role="status"
      style={css(
        `display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:9px 12px;border-radius:7px;background:${warn ? 'rgba(192,137,47,0.14)' : 'var(--lift-05)'};border:1px solid ${warn ? 'rgba(192,137,47,0.34)' : 'var(--lift-08)'}`,
      )}
    >
      <div
        style={css(
          `flex:1;font:500 12px ${FONT};color:${warn ? 'var(--warn-text)' : 'var(--t2)'}`,
        )}
      >
        {notice.text}
      </div>
      {notice.onClick ? (
        <button
          type="button"
          className="ia chip-button"
          onClick={notice.onClick}
        >
          {notice.label}
        </button>
      ) : null}
    </div>
  );
}

function Specs({ rows }) {
  return (
    <dl style={css('margin:14px 0 0')}>
      {(rows ?? []).map((sp, index) => (
        <div
          key={sp.k ?? index}
          style={css(
            'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06);flex-wrap:wrap',
          )}
        >
          <dt style={css(KEY)}>{sp.k}</dt>
          <dd style={css(`${VAL};margin:0;min-width:0`)}>
            {sp.ref ? <CircuitRef link={sp.ref} text={sp.v} /> : sp.v}
            {sp.note ? (
              <span
                style={css(
                  `display:block;font:400 10px ${FONT};color:var(--t4)`,
                )}
              >
                {sp.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A recorded power reference rendered as a link when it resolves, otherwise flagged. */
function CircuitRef({ link, text }) {
  if (!link) return text;
  if (link.verified)
    return (
      <span
        style={css(
          'display:inline-flex;align-items:center;gap:6px;justify-content:flex-end;flex-wrap:wrap',
        )}
      >
        <span>{text}</span>
        <button
          type="button"
          className="ia link-button"
          onClick={link.onClick}
          aria-label={link.label}
        >
          {`Open ${link.tag}`}
        </button>
      </span>
    );
  return (
    <span
      style={css(
        'display:inline-flex;align-items:center;gap:6px;justify-content:flex-end;flex-wrap:wrap',
      )}
    >
      <span>{text}</span>
      <span
        style={css(
          `font:600 10px ${MONO};color:var(--warn-text);background:rgba(192,137,47,0.14);border:1px solid rgba(192,137,47,0.34);padding:1px 6px;border-radius:4px`,
        )}
        title={link.label}
      >
        {'UNVERIFIED'}
      </span>
    </span>
  );
}

function Related({ rows, room, title }) {
  if (!rows || rows.length === 0) return null;
  return (
    <>
      <h3 style={css(SECTION)}>
        {title || (room ? `ALSO IN ${room.toUpperCase()}` : 'RELATED')}
      </h3>
      <div role="list">
        {rows.map((r) => (
          <button
            key={`${r.kind}-${r.id}`}
            type="button"
            className="ia row-button"
            onClick={r.onClick}
            role="listitem"
            style={css(
              'width:100%;display:flex;align-items:center;gap:9px;padding:7px 4px;border:0;border-bottom:1px solid var(--lift-06);background:transparent;cursor:pointer;text-align:left;color:inherit;border-radius:4px',
            )}
          >
            <span style={css(r.swatch)} aria-hidden="true"></span>
            <span style={css('flex:1;min-width:0')}>
              <span
                style={css(
                  `display:block;font:500 12px ${FONT};color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                )}
              >
                {r.label}
              </span>
              <span
                style={css(
                  `display:block;font:400 10px ${FONT};color:var(--t3)`,
                )}
              >
                {r.kind} · {r.sub}
              </span>
            </span>
            <Icon name="arrowRight" size={12} style={{ color: 'var(--t4)' }} />
          </button>
        ))}
      </div>
    </>
  );
}

function Badge({ label, color, bg, bd }) {
  return (
    <span
      style={css(
        `font:600 10px ${MONO};color:${color};background:${bg};border:1px solid ${bd};padding:4px 9px;border-radius:5px;flex-shrink:0;letter-spacing:0.04em`,
      )}
    >
      {label}
    </span>
  );
}

function DemoFeed({ det, big }) {
  return (
    <div
      role="img"
      aria-label={`${det.name}: demonstration camera preview, not live video`}
      style={css(
        `position:relative;width:100%;aspect-ratio:16/9;border-radius:9px;overflow:hidden;background:#0b1015;border:1px solid #20303c;box-shadow:inset 0 0 60px rgba(0,0,0,0.6)${big ? ';flex:1;min-height:0;aspect-ratio:auto' : ''}`,
      )}
    >
      <div
        style={css(
          'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
        )}
      ></div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 38px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(170px) rotateX(58deg);transform-origin:bottom',
        )}
      ></div>
      <div
        style={css(
          `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 ${big ? 40 : 24}px ${FONT};color:rgba(255,255,255,0.055);letter-spacing:0.06em;text-align:center;padding:0 14px`,
        )}
      >
        {det.watermark}
      </div>
      <div
        className="feed-scan"
        style={css(
          'position:absolute;left:0;right:0;height:22%;background:linear-gradient(180deg,transparent,rgba(120,160,200,0.10),transparent);animation:feedScan 4.5s linear infinite',
        )}
      ></div>
      {det.offline ? (
        <div
          style={css(
            `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,12,0.74);font:600 12px ${MONO};color:#aeb9c4;letter-spacing:0.16em`,
          )}
        >
          {'NO SIGNAL'}
        </div>
      ) : null}
      <div
        style={css(
          'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)',
        )}
      >
        <div
          style={css(
            `display:flex;align-items:center;gap:6px;font:600 10px ${MONO};color:${det.liveColor}`,
          )}
        >
          <span
            style={css(
              `width:7px;height:7px;border-radius:50%;background:${det.liveColor};animation:pulseDot 1.4s ease-in-out infinite`,
            )}
          ></span>
          {det.liveLabel}
        </div>
        <div style={css(`font:600 10px ${MONO};color:#dfe7ee`)}>{det.res}</div>
      </div>
      <div
        style={css(
          'position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)',
        )}
      >
        <div
          style={css(
            `font:600 10px ${MONO};color:#dfe7ee;text-shadow:0 1px 2px #000;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
          )}
        >
          {det.name}
        </div>
        <div style={css(`font:500 10px ${MONO};color:#aeb9c4;flex-shrink:0`)}>
          <FeedClock />
        </div>
      </div>
    </div>
  );
}

export { DemoFeed };

export function SystemDetails({ view }) {
  return (
    <aside
      id="panel-right"
      ref={view.detailsRef}
      style={css(view.detailPanelStyle)}
      aria-label={`${view.modeLabel} details`}
      inert={view.rightHidden ? true : undefined}
    >
      <div
        style={css('padding:17px 18px 20px')}
        key={view.mode}
        className="mode-fade"
      >
        <Notice notice={view.filterNotice} />
        <Notice notice={view.isoNotice} />

        {view.isOverview ? (
          <>
            {view.roomDet ? (
              <>
                <div
                  style={css(
                    'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
                  )}
                >
                  <div style={css('min-width:0')}>
                    <h2 style={css(TITLE)}>{view.roomDet.name}</h2>
                    <div style={css(SUB)}>
                      {view.roomDet.floorLabel}
                      {view.roomDet.aliases.length
                        ? ` · also recorded as ${view.roomDet.aliases.join(', ')}`
                        : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ia icon-button"
                    onClick={view.roomDet.clear}
                    aria-label="Close room summary"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
                <div
                  style={css(
                    'display:flex;gap:6px;margin-top:12px;flex-wrap:wrap',
                  )}
                >
                  <button
                    type="button"
                    className="ia chip-button"
                    onClick={view.roomDet.isolate}
                    aria-pressed={view.roomDet.isolated}
                  >
                    {view.roomDet.isolated
                      ? 'Isolated in model'
                      : 'Isolate this room'}
                  </button>
                </div>
                {view.roomDet.related.length ? (
                  <Related
                    rows={view.roomDet.related}
                    title="RECORDED IN THIS ROOM"
                  />
                ) : (
                  <div style={css(`${NOTE};margin-top:14px`)}>
                    {
                      'No circuits, fixtures, devices, or maintenance items are recorded for this room.'
                    }
                  </div>
                )}
                <div
                  style={css(
                    'height:1px;background:var(--lift-08);margin:16px 0',
                  )}
                ></div>
              </>
            ) : null}
            <button
              type="button"
              onClick={view.goLighting}
              className="ia"
              style={css(
                'width:100%;display:flex;align-items:center;gap:11px;padding:12px 14px;background:rgba(192,137,47,0.16);border:1px solid rgba(192,137,47,0.34);border-radius:8px;cursor:pointer;text-align:left;color:inherit',
              )}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#c0892f;flex-shrink:0;animation:pulseDot 1.8s ease-in-out infinite',
                )}
                aria-hidden="true"
              ></span>
              <div
                style={css(
                  `font:500 12px ${FONT};color:var(--warn-text);flex:1`,
                )}
              >
                {view.alertText}
              </div>
              <Icon
                name="arrowRight"
                size={12}
                style={{ color: 'var(--warn-text)' }}
              />
            </button>
            <button
              type="button"
              onClick={view.goUpkeep}
              className="ia"
              style={css(
                'width:100%;display:flex;align-items:center;gap:11px;padding:12px 14px;margin-top:9px;background:rgba(192,87,59,0.16);border:1px solid rgba(192,87,59,0.34);border-radius:8px;cursor:pointer;text-align:left;color:inherit',
              )}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#c0573b;flex-shrink:0;animation:pulseDot 1.8s ease-in-out infinite',
                )}
                aria-hidden="true"
              ></span>
              <div
                style={css(
                  `font:500 12px ${FONT};color:var(--alert-text);flex:1`,
                )}
              >
                {view.upAlertText}
              </div>
              <Icon
                name="arrowRight"
                size={12}
                style={{ color: 'var(--alert-text)' }}
              />
            </button>
            <h3 style={css(SECTION)}>
              {'FIXTURES NEEDING ATTENTION · ALL ROOMS'}
            </h3>
            <div role="listbox" aria-label="Fixtures needing attention">
              {(view.needs ?? []).map((b, index) => (
                <Fragment key={b.id ?? index}>
                  <div
                    onClick={b.onClick}
                    className="ia"
                    style={css(
                      'display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--lift-06);cursor:pointer;border-radius:4px',
                    )}
                    role="option"
                    aria-selected={false}
                    tabIndex={0}
                    onKeyDown={optionOnKey}
                    aria-label={`${b.room}, ${b.fixture}, ${b.statusLabel}`}
                  >
                    <span style={css(b.dotStyle)} aria-hidden="true"></span>
                    <div style={css('min-width:0;flex:1')}>
                      <div
                        style={css(
                          `font:500 12px ${FONT};overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                        )}
                      >
                        {b.room}
                      </div>
                      <div
                        style={css(
                          `font:400 11px ${FONT};color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                        )}
                      >
                        {b.fixture}
                      </div>
                    </div>
                    <div
                      style={css(
                        `font:600 10px ${MONO};color:${b.color};flex-shrink:0`,
                      )}
                    >
                      {b.statusLabel}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={css(`${NOTE};margin-top:12px`)}>
              {
                'Select a room in the model or search for one to see everything recorded there.'
              }
            </div>
          </>
        ) : null}

        {view.isElectrical ? (
          <>
            {view.noSel ? (
              <div
                style={css(
                  'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:11px;padding:48px 18px;color:var(--t3)',
                )}
              >
                <div
                  style={css(
                    'width:24px;height:24px;border:1.5px solid var(--t3);transform:rotate(45deg)',
                  )}
                  aria-hidden="true"
                ></div>
                <div
                  style={css(
                    `font:400 13px ${FONT};max-width:230px;line-height:1.5`,
                  )}
                >
                  {
                    'Select a circuit to highlight the rooms it serves. The drawn path is a schematic association, not the physical wiring route.'
                  }
                </div>
              </div>
            ) : null}
            {view.panelDet ? (
              <>
                <div style={css('display:flex;align-items:center;gap:9px')}>
                  <span
                    style={css(
                      'width:12px;height:12px;border-radius:3px;flex-shrink:0;background:#3b6fb0',
                    )}
                    aria-hidden="true"
                  ></span>
                  <h2
                    style={css(
                      `font:600 16px ${MONO};color:var(--t1);margin:0`,
                    )}
                  >
                    {view.panelDet.short}
                  </h2>
                  <Badge
                    label="PANEL"
                    color="var(--t3)"
                    bg="var(--lift-06)"
                    bd="var(--lift-10)"
                  />
                </div>
                <div
                  style={css(
                    `font:500 15px ${FONT};color:var(--t1);margin-top:12px;line-height:1.35`,
                  )}
                >
                  {view.panelDet.name}
                </div>
                <div
                  style={css(
                    `font:400 12px ${FONT};color:var(--t3);margin-top:6px`,
                  )}
                >
                  {view.panelDet.loc}
                </div>
                <Specs
                  rows={[
                    { k: 'Size', v: view.panelDet.size },
                    { k: 'Spaces', v: String(view.panelDet.total) },
                    {
                      k: 'Documented circuits',
                      v: String(view.panelDet.documented),
                    },
                  ]}
                />
                <h3 style={css(SECTION)}>{'BY TYPE'}</h3>
                {view.panelDet.byType.map((t) => (
                  <div
                    key={t.type}
                    style={css(
                      'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--lift-06)',
                    )}
                  >
                    <span
                      style={css(
                        `width:9px;height:9px;border-radius:2px;background:${t.color}`,
                      )}
                      aria-hidden="true"
                    ></span>
                    <span style={css(`flex:1;font:500 12px ${FONT}`)}>
                      {t.type}
                    </span>
                    <span style={css(`font:500 11px ${MONO};color:var(--t3)`)}>
                      {t.count}
                    </span>
                  </div>
                ))}
                <div style={css(`${NOTE};margin-top:12px`)}>
                  {'Select a circuit in the list for its served rooms.'}
                </div>
              </>
            ) : null}
            {view.hasSel ? (
              <>
                <div
                  style={css(
                    'display:flex;align-items:center;gap:9px;flex-wrap:wrap',
                  )}
                >
                  <span
                    style={css(
                      'width:12px;height:12px;border-radius:3px;flex-shrink:0;background:' +
                        (view.circDet.typeColor ?? ''),
                    )}
                    aria-hidden="true"
                  ></span>
                  <h2
                    style={css(
                      `font:600 16px ${MONO};color:var(--t1);margin:0`,
                    )}
                  >
                    {view.circDet.tag}
                  </h2>
                  <button
                    type="button"
                    className="ia icon-button"
                    onClick={view.circDet.copyTag}
                    aria-label={`Copy circuit tag ${view.circDet.tag}`}
                    title="Copy tag"
                  >
                    <Icon name="copy" size={12} />
                  </button>
                  <div
                    style={css(
                      `font:500 11px ${MONO};color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:2px 8px;border-radius:4px;margin-left:auto`,
                    )}
                  >
                    {view.circDet.amp}
                    {' · '}
                    {view.circDet.typeLabel}
                  </div>
                </div>
                <div
                  style={css(
                    `font:500 15px ${FONT};color:var(--t1);margin-top:12px;line-height:1.35`,
                  )}
                >
                  {view.circDet.label}
                </div>
                <div
                  style={css(
                    `font:400 12px ${FONT};color:var(--t3);margin-top:8px`,
                  )}
                >
                  {'Fed from '}
                  <button
                    type="button"
                    className="ia link-button"
                    onClick={view.circDet.openPanel}
                  >
                    {view.circDet.boxName}
                  </button>
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
                      'width:7px;height:7px;border-radius:50%;background:#c0892f;flex-shrink:0',
                    )}
                    aria-hidden="true"
                  ></span>
                  <div
                    style={css(`font:500 12px ${FONT};color:var(--warn-text)`)}
                  >
                    {view.circDet.spansText}
                  </div>
                </div>
                <h3 style={css(SECTION)}>
                  {'SERVES '}
                  {view.circDet.loadCount}
                  {' AREAS'}
                </h3>
                {(view.circDet.rooms ?? []).map((r, index) => (
                  <div
                    key={r.id ?? index}
                    style={css(
                      'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--lift-06);flex-wrap:wrap',
                    )}
                  >
                    <span style={css(r.fdot)} aria-hidden="true"></span>
                    <div
                      style={css(
                        `font:500 12px ${FONT};color:var(--t1);flex:1;min-width:0`,
                      )}
                    >
                      {r.name}
                      {r.hidden ? (
                        <span
                          style={css(
                            `font:400 10px ${FONT};color:var(--warn-text)`,
                          )}
                        >
                          {' '}
                          · hidden by isolation
                        </span>
                      ) : null}
                    </div>
                    {r.cycle ? (
                      <button
                        type="button"
                        className="ia link-button"
                        onClick={r.cycle}
                        aria-label={`Show the next of ${r.otherCount + 1} circuits serving ${r.name}`}
                      >
                        {`+${r.otherCount} more`}
                      </button>
                    ) : null}
                    <div style={css(`font:400 11px ${MONO};color:var(--t3)`)}>
                      {r.floorLabel}
                    </div>
                  </div>
                ))}
                <div style={css(`${NOTE};margin-top:10px`)}>
                  {
                    'Path in the model is a schematic panel-to-room association drawn from room centers, not the surveyed cable route.'
                  }
                </div>
                <Related
                  rows={view.circDet.related}
                  room={view.circDet.relatedRoom}
                />
              </>
            ) : null}
          </>
        ) : null}

        {view.isLighting ? (
          <>
            {view.noBulb ? (
              <div
                style={css(
                  'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:11px;padding:48px 18px;color:var(--t3)',
                )}
              >
                <div
                  style={css(
                    'width:22px;height:22px;border-radius:50%;border:1.5px solid var(--t3)',
                  )}
                  aria-hidden="true"
                ></div>
                <div
                  style={css(
                    `font:400 13px ${FONT};max-width:220px;line-height:1.5`,
                  )}
                >
                  {
                    'Select a fixture record to pin its room in the model and see its recorded specification.'
                  }
                </div>
              </div>
            ) : null}
            {view.hasBulb ? (
              <>
                <div style={css('display:flex;align-items:center;gap:11px')}>
                  <div
                    style={css(
                      'width:36px;height:36px;border-radius:50%;background:' +
                        (view.bd.kColor ?? '') +
                        ';border:1px solid #00000018;flex-shrink:0;box-shadow:0 0 14px ' +
                        (view.bd.glow ?? ''),
                    )}
                    aria-hidden="true"
                  ></div>
                  <div style={css('min-width:0')}>
                    <h2 style={css(TITLE)}>{view.bd.room}</h2>
                    <div style={css(SUB)}>{view.bd.fixture}</div>
                  </div>
                </div>
                <div
                  style={css(
                    'display:flex;align-items:center;gap:8px;margin-top:13px;padding:9px 12px;border-radius:7px;background:' +
                      (view.bd.statusBg ?? '') +
                      ';border:1px solid ' +
                      (view.bd.statusBd ?? ''),
                  )}
                >
                  <span
                    style={css(
                      'width:8px;height:8px;border-radius:50%;background:' +
                        (view.bd.color ?? ''),
                    )}
                    aria-hidden="true"
                  ></span>
                  <div
                    style={css(
                      `font:500 12px ${FONT};color:${view.bd.color ?? ''}`,
                    )}
                  >
                    {view.bd.statusFull}
                  </div>
                </div>
                <div style={css(`${NOTE};margin-top:8px`)}>
                  {`Status and replacement date are recorded values from the ${view.snapshot} inventory snapshot; nothing here is computed from today's date.`}
                </div>
                <Specs rows={view.bd.specs} />
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
                    aria-hidden="true"
                  ></span>
                  <div style={css(`font:500 12px ${FONT};color:var(--t3)`)}>
                    {view.locate.floorLabel}
                  </div>
                  <div
                    style={css(
                      `font:400 11px ${FONT};color:var(--t3);margin-left:auto`,
                    )}
                  >
                    {view.locate.pinNote}
                  </div>
                </div>
                {view.bd.circuits.length ? (
                  <>
                    <h3 style={css(SECTION)}>{'ROOM CIRCUITS'}</h3>
                    {view.bd.circuits.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="ia row-button"
                        onClick={c.onClick}
                        style={css(
                          'width:100%;display:flex;align-items:center;gap:9px;padding:7px 4px;border:0;border-bottom:1px solid var(--lift-06);background:transparent;cursor:pointer;text-align:left;color:inherit;border-radius:4px',
                        )}
                      >
                        <span
                          style={css(
                            `font:600 11px ${MONO};color:var(--t2);width:44px`,
                          )}
                        >
                          {c.tag}
                        </span>
                        <span
                          style={css(
                            `flex:1;font:500 12px ${FONT};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                          )}
                        >
                          {c.label}
                        </span>
                        <Icon
                          name="arrowRight"
                          size={12}
                          style={{ color: 'var(--t4)' }}
                        />
                      </button>
                    ))}
                  </>
                ) : null}
                <Related rows={view.bd.related} room={view.bd.relatedRoom} />
              </>
            ) : null}
          </>
        ) : null}

        {view.isNetwork ? (
          <>
            {!view.nodeDet.isGateway ? (
              <button
                type="button"
                className="ia"
                onClick={view.gateway.onClick}
                style={css(
                  'width:100%;background:var(--lift-05);color:var(--t1);border:1px solid var(--lift-08);border-radius:8px;padding:11px 13px;display:flex;align-items:center;gap:11px;cursor:pointer;text-align:left',
                )}
                aria-label={`Open ${view.gateway.name}, ${view.gateway.role}`}
              >
                <span
                  style={css(
                    'width:9px;height:9px;border-radius:50%;background:#5a9c6e;flex-shrink:0',
                  )}
                  aria-hidden="true"
                ></span>
                <div style={css('min-width:0;flex:1')}>
                  <div style={css(`font:600 12px ${FONT}`)}>
                    {view.gateway.name}
                  </div>
                  <div
                    style={css(
                      `font:400 10px ${MONO};color:var(--t3);margin-top:2px`,
                    )}
                  >
                    {view.gateway.role}
                    {' · '}
                    {view.gateway.room}
                    {' · uplink '}
                    {view.gateway.backhaul}
                  </div>
                </div>
                <Icon
                  name="arrowRight"
                  size={12}
                  style={{ color: 'var(--t4)' }}
                />
              </button>
            ) : null}
            <div
              style={css(
                `display:flex;align-items:center;gap:9px;${view.nodeDet.isGateway ? '' : 'margin-top:14px'}`,
              )}
            >
              <span
                style={css(
                  'width:11px;height:11px;border-radius:3px;background:' +
                    (view.nodeDet.statusColor ?? '') +
                    ';flex-shrink:0',
                )}
                aria-hidden="true"
              ></span>
              <h2 style={css(`${TITLE};flex:1;min-width:0`)}>
                {view.nodeDet.name}
              </h2>
              <Badge
                label={view.nodeDet.statusLabel}
                color={view.nodeDet.statusColor}
                bg="var(--lift-05)"
                bd="var(--lift-10)"
              />
            </div>
            <div style={css(SUB)}>
              {view.nodeDet.role}
              {' · '}
              {view.nodeDet.room}
            </div>
            {view.nodeDet.statusNote ? (
              <div
                style={css(
                  `margin-top:10px;padding:8px 12px;border-radius:7px;background:rgba(192,137,47,0.14);border:1px solid rgba(192,137,47,0.34);font:500 12px ${FONT};color:var(--warn-text)`,
                )}
              >
                {view.nodeDet.statusNote}
              </div>
            ) : null}
            <Specs
              rows={[
                { k: 'Networks', v: view.nodeDet.netText },
                { k: 'Backhaul', v: view.nodeDet.backhaul },
                {
                  k: 'Plugged into',
                  v: view.nodeDet.plug,
                  ref: view.nodeDet.plugRef,
                },
                {
                  k: 'Model',
                  v: view.nodeDet.modelPlaceholder
                    ? 'not recorded'
                    : view.nodeDet.model,
                  note: view.nodeDet.modelPlaceholder
                    ? `inventory placeholder ${view.nodeDet.model}`
                    : '',
                },
                ...(view.nodeDet.isGateway
                  ? [{ k: 'Broadcasts', v: 'All recorded networks' }]
                  : []),
              ]}
            />
            {view.nodeDet.hasServers ? (
              <>
                <h3 style={css(SECTION)}>{'ATTACHED SERVERS'}</h3>
                <div role="listbox" aria-label="Attached servers">
                  {(view.nodeDet.servers ?? []).map((sv, index) => (
                    <div
                      key={sv.id ?? index}
                      id={`row-server-${sv.id}`}
                      role="option"
                      aria-selected={sv.selected}
                      tabIndex={0}
                      onKeyDown={optionOnKey}
                      onClick={sv.onClick}
                      className="ia"
                      style={css(
                        'display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:6px;cursor:pointer;flex-wrap:wrap' +
                          (sv.selected
                            ? ';background:var(--lift-06);box-shadow:inset 0 0 0 1.5px #3f9a8c'
                            : ''),
                      )}
                      aria-label={`${sv.name}, ${sv.kind}, power ${sv.power}`}
                    >
                      <span
                        style={css(
                          'width:6px;height:6px;background:#3b6fb0;transform:rotate(45deg);flex-shrink:0',
                        )}
                        aria-hidden="true"
                      ></span>
                      <div style={css(`font:500 12px ${FONT}`)}>{sv.name}</div>
                      <div style={css(`font:400 11px ${FONT};color:var(--t3)`)}>
                        {sv.kind}
                      </div>
                      <div
                        style={css(
                          `margin-left:auto;font:400 10px ${MONO};color:var(--t3)`,
                        )}
                      >
                        <CircuitRef link={sv.powerRef} text={sv.power} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <Related rows={view.nodeDet.related} room={view.nodeDet.room} />
          </>
        ) : null}

        {view.isSound ? (
          <>
            <div
              style={css(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
              )}
            >
              <div style={css('min-width:0')}>
                <h2 style={css(TITLE)}>{view.zoneDet.name}</h2>
                <div style={css(SUB)}>{view.zoneDet.room}</div>
              </div>
              <abbr
                title={view.zoneDet.configNote}
                style={css(
                  `font:600 11px ${MONO};color:var(--ring-text);background:rgba(123,92,214,0.18);border:1px solid rgba(123,92,214,0.4);padding:4px 9px;border-radius:5px;flex-shrink:0;text-decoration:none`,
                )}
              >
                {view.zoneDet.config}
              </abbr>
            </div>
            <div
              style={css(`${NOTE};margin-top:6px`)}
            >{`${view.zoneDet.config.split(' ')[0]} = ${view.zoneDet.configNote}.`}</div>
            <div
              role="img"
              aria-label="Generic 7.2.4 speaker placement diagram — schematic, not a surveyed layout"
              style={css(
                'position:relative;height:172px;margin-top:13px;border:1px solid var(--lift-10);border-radius:7px;background:var(--lift-04);background-image:linear-gradient(var(--lift-05) 1px,transparent 1px),linear-gradient(90deg,var(--lift-05) 1px,transparent 1px);background-size:18px 18px;overflow:hidden',
              )}
            >
              <div
                style={css(
                  `position:absolute;left:8px;top:7px;font:500 10px ${MONO};color:var(--t3)`,
                )}
              >
                {'GENERIC PLACEMENT · SCHEMATIC'}
              </div>
              {(view.zoneDet.spk ?? []).map((p) => (
                <div key={p.key} style={css(p.style)} title={p.name}>
                  {p.label}
                </div>
              ))}
            </div>
            <div style={css(`${NOTE};margin-top:6px`)}>
              {
                'Both zones share this diagram; the model marks the room with a seven-square sketch. Neither is a measured speaker position.'
              }
            </div>
            <dl style={css('margin:13px 0 0')}>
              {(view.zoneDet.gear ?? []).map((g, index) => (
                <div
                  key={g.l ?? index}
                  style={css(
                    'display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--lift-06)',
                  )}
                >
                  <dt style={css(`font:500 12px ${FONT}`)}>{g.l}</dt>
                  <dd
                    style={css(
                      `font:400 12px ${FONT};color:var(--t3);text-align:right;margin:0`,
                    )}
                  >
                    {g.placeholder
                      ? g.d.replace('[ model ]', 'model not recorded')
                      : g.d}
                  </dd>
                </div>
              ))}
            </dl>
            <div
              style={css('display:flex;gap:7px;margin-top:12px;flex-wrap:wrap')}
            >
              <div
                style={css(
                  `display:inline-flex;align-items:center;gap:6px;font:400 12px ${FONT};color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:5px 10px;border-radius:5px;flex-wrap:wrap`,
                )}
              >
                <Icon name="bolt" size={12} />
                {view.zoneDet.power}
                {view.zoneDet.powerRefs.map((l) =>
                  l.verified ? (
                    <button
                      key={l.tag}
                      type="button"
                      className="ia link-button"
                      onClick={l.onClick}
                    >
                      {`Open ${l.tag}`}
                    </button>
                  ) : (
                    <span
                      key={l.tag}
                      style={css(
                        `font:600 10px ${MONO};color:var(--warn-text)`,
                      )}
                    >
                      {`${l.tag} unverified`}
                    </span>
                  ),
                )}
              </div>
              <div
                style={css(
                  `display:inline-flex;align-items:center;gap:6px;font:400 12px ${FONT};color:var(--t3);background:var(--lift-06);border:1px solid var(--lift-10);padding:5px 10px;border-radius:5px`,
                )}
              >
                <Icon name="note" size={12} />
                {view.zoneDet.source}
              </div>
            </div>
            <Related rows={view.zoneDet.related} room={view.zoneDet.name} />
          </>
        ) : null}

        {view.isSecurity ? (
          <>
            <button
              type="button"
              onClick={view.openGrid}
              className="ia"
              style={css(
                `display:flex;align-items:center;gap:9px;width:100%;appearance:none;font:600 12px ${FONT};color:#fff;background:#c0573b;border:0;border-radius:7px;padding:10px 12px;cursor:pointer;text-align:left`,
              )}
              aria-haspopup="dialog"
            >
              <span
                aria-hidden="true"
                style={css(
                  'width:7px;height:7px;border-radius:50%;background:#fff;flex-shrink:0;animation:pulseDot 1.4s ease-in-out infinite',
                )}
              ></span>
              {'Open live cameras'}
              <span
                style={css(
                  `margin-left:auto;font:600 10px ${MONO};letter-spacing:0.1em;opacity:0.85`,
                )}
              >
                {'XFINITY'}
              </span>
            </button>
            <div style={css(`${NOTE};margin:8px 0 12px`)}>
              {
                'Recorded camera details below. The preview and event history are demonstrations, not live video.'
              }
            </div>
            <DemoFeed det={view.camDet} />
            <div
              style={css(
                'display:flex;align-items:center;gap:9px;margin-top:13px;flex-wrap:wrap',
              )}
            >
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:' +
                    (view.camDet.statusColor ?? '') +
                    ';flex-shrink:0',
                )}
                aria-hidden="true"
              ></span>
              <h2 style={css(`${TITLE};min-width:0`)}>{view.camDet.name}</h2>
              <button
                type="button"
                className="ia icon-button"
                onClick={view.camDet.copyName}
                aria-label={`Copy camera name ${view.camDet.name}`}
                title="Copy name"
              >
                <Icon name="copy" size={12} />
              </button>
              <div style={css('margin-left:auto;display:flex;gap:5px')}>
                <Badge
                  label={view.camDet.statusLabel.toUpperCase()}
                  color={view.camDet.statusColor}
                  bg="var(--lift-05)"
                  bd="var(--lift-10)"
                />
                <Badge
                  label={view.camDet.type.toUpperCase()}
                  color="var(--t3)"
                  bg="var(--lift-06)"
                  bd="var(--lift-10)"
                />
              </div>
            </div>
            <div style={css(SUB)}>
              {view.camDet.room}
              {' · '}
              {view.camDet.coverage}
            </div>
            {view.camDet.floorConflict ? (
              <div
                role="note"
                style={css(
                  `margin-top:10px;padding:9px 12px;border-radius:7px;background:rgba(192,137,47,0.14);border:1px solid rgba(192,137,47,0.34);font:500 12px ${FONT};color:var(--warn-text);line-height:1.45`,
                )}
              >
                {view.camDet.floorConflict}
              </div>
            ) : null}
            <Specs rows={view.camDet.specs} />
            <div style={css('display:flex;gap:8px;margin-top:14px')}>
              <button
                type="button"
                onClick={view.openExpand}
                className="ia"
                style={css(
                  `flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:600 12px ${FONT};color:var(--alert-text);background:rgba(192,87,59,0.14);border:1px solid rgba(192,87,59,0.34);border-radius:7px;padding:10px;cursor:pointer`,
                )}
                aria-haspopup="dialog"
              >
                <Icon name="expand" size={13} />
                {'Review demo history'}
              </button>
            </div>
            <Related rows={view.camDet.related} room={view.camDet.room} />
          </>
        ) : null}

        {view.isClimate ? (
          <>
            <div style={css('display:flex;align-items:center;gap:11px')}>
              <span
                style={css(
                  'width:13px;height:13px;background:var(--t4);transform:rotate(45deg);flex-shrink:0;opacity:0.7',
                )}
                aria-hidden="true"
              ></span>
              <div style={css('min-width:0')}>
                <h2 style={css(TITLE)}>{view.sensorDet.name}</h2>
                <div style={css(SUB)}>{view.sensorDet.mount}</div>
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
                aria-hidden="true"
              ></span>
              <div style={css(`font:500 12px ${FONT};color:var(--warn-text)`)}>
                {'Planned · not installed · no readings'}
              </div>
            </div>
            <div
              style={css('display:flex;gap:9px;margin-top:13px')}
              aria-hidden="true"
            >
              {['TEMPERATURE °F', 'HUMIDITY %RH'].map((l) => (
                <div
                  key={l}
                  style={css(
                    'flex:1;text-align:center;background:var(--lift-04);border:1px solid var(--lift-08);border-radius:8px;padding:13px 4px',
                  )}
                >
                  <div
                    style={css(
                      `font:600 26px ${FONT};color:var(--t3);line-height:1`,
                    )}
                  >
                    {'—'}
                  </div>
                  <div
                    style={css(
                      `font:400 10px ${MONO};color:var(--t3);margin-top:4px;letter-spacing:0.06em`,
                    )}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
            <Specs
              rows={[
                { k: 'Mount', v: view.sensorDet.mount },
                {
                  k: 'Will report',
                  v: view.sensorDet.target,
                  note: view.sensorDet.targetNote,
                },
                { k: 'Floor', v: view.sensorDet.floorLabel },
              ]}
            />
            <div
              style={css(
                `margin-top:13px;padding:10px 12px;border-radius:7px;background:var(--lift-05);border:1px solid var(--lift-08);${NOTE}`,
              )}
            >
              {
                'The marker records the intended room and wall for a future install. It is not a measured mounting coordinate; confirm power and IoT-network reach on site before installing.'
              }
            </div>
            <Related rows={view.sensorDet.related} room={view.sensorDet.name} />
          </>
        ) : null}

        {view.isUpkeep ? (
          <>
            <div
              style={css(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:10px',
              )}
            >
              <div style={css('min-width:0')}>
                <h2 style={css(TITLE)}>{view.upDet.kind}</h2>
                <div style={css(SUB)}>{view.upDet.device}</div>
              </div>
              <Badge
                label={view.upDet.statusLabel}
                color={view.upDet.statusColor}
                bg={view.upDet.statusBg}
                bd={view.upDet.statusBd}
              />
            </div>
            <div style={css('margin-top:14px')}>
              <div
                style={css(
                  'display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap',
                )}
              >
                <div
                  style={css(
                    `font:500 11px ${MONO};color:var(--t3);letter-spacing:0.04em`,
                  )}
                >
                  {view.upDet.metricLabel}
                </div>
                <div style={css(`font:600 12px ${FONT};color:var(--t1)`)}>
                  {view.upDet.metricVal}
                </div>
              </div>
              <div
                style={css(
                  'height:9px;border-radius:5px;background:var(--track);margin-top:8px;overflow:hidden',
                )}
                role="img"
                aria-label={`${view.upDet.barPct}% ${view.upDet.barMeaning}`}
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
              <div
                style={css(
                  `display:flex;justify-content:space-between;font:400 10px ${MONO};color:var(--t4);margin-top:4px`,
                )}
              >
                <span>
                  {view.upDet.barMeaning === 'remaining' ? 'empty' : '0 used'}
                </span>
                <span>
                  {view.upDet.barMeaning === 'remaining'
                    ? 'full'
                    : 'rated life'}
                </span>
              </div>
            </div>
            <div style={css(`${NOTE};margin-top:10px`)}>
              {`Usage, level, and status are recorded values as of the ${view.snapshot} inventory snapshot. They do not advance with the calendar.`}
            </div>
            <Specs rows={view.upDet.specs} />
            <div
              style={css(
                'margin-top:13px;padding:10px 12px;border-radius:7px;background:' +
                  (view.upDet.statusBg ?? '') +
                  ';border:1px solid ' +
                  (view.upDet.statusBd ?? '') +
                  `;${NOTE}`,
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
                aria-hidden="true"
              ></span>
              <div style={css(`font:500 12px ${FONT};color:var(--t3)`)}>
                {view.upDet.floorLabel}
              </div>
              <div
                style={css(
                  `font:400 11px ${FONT};color:var(--t3);margin-left:auto`,
                )}
              >
                {view.upDet.pinNote}
              </div>
            </div>
            {view.upDet.roomItems.length ? (
              <>
                <h3 style={css(SECTION)}>{'SAME ROOM · OTHER ITEMS'}</h3>
                <div
                  role="listbox"
                  aria-label="Other replacement items in this room"
                >
                  {view.upDet.roomItems.map((u) => (
                    <div
                      key={u.id}
                      role="option"
                      aria-selected={false}
                      tabIndex={0}
                      onKeyDown={optionOnKey}
                      onClick={u.onClick}
                      className="ia"
                      style={css(
                        'display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--lift-06);cursor:pointer;border-radius:4px',
                      )}
                      aria-label={`${u.kind}, ${u.statusLabel}`}
                    >
                      <span
                        style={css(
                          `width:8px;height:8px;border-radius:50%;background:${u.color};flex-shrink:0`,
                        )}
                        aria-hidden="true"
                      ></span>
                      <span style={css(`flex:1;font:500 12px ${FONT}`)}>
                        {u.kind}
                      </span>
                      <span
                        style={css(`font:600 10px ${MONO};color:${u.color}`)}
                      >
                        {u.statusLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <Related
              rows={view.upDet.related}
              room={
                view.upDet.floorLabel === '—'
                  ? ''
                  : view.upDet.device.split(' · ').pop()
              }
              title="RELATED RECORDS IN THIS ROOM"
            />
          </>
        ) : null}
      </div>
    </aside>
  );
}
