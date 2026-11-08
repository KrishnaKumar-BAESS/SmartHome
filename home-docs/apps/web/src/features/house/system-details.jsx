import { useRef } from 'react';
import { PiholePanel } from './pihole-panel';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';
import { ModeIcon } from './mode-icons';
import { ProvenanceTag } from './provenance-tag';
import { FeedClock } from './feed-clock';
import { MODE_ACCENT, STATUS } from './palette';

const WARN = STATUS.soon;

function Notice({ notice, tone }) {
  if (!notice) return null;
  const warn = tone !== 'info';
  return (
    <div
      role="status"
      className={warn ? 'callout float-in' : 'callout callout--plain float-in'}
      style={warn ? { '--c': WARN } : undefined}
    >
      <Icon name="alert" size={14} />
      <span className="grow">{notice.text}</span>
      {notice.onClick ? (
        <button
          type="button"
          className="ia chip-button chip-button--tone"
          style={warn ? { '--c': WARN } : undefined}
          onClick={notice.onClick}
        >
          {notice.label}
        </button>
      ) : null}
    </div>
  );
}

function Note({ children, style }) {
  return (
    <div className="note" style={style}>
      <Icon name="info" size={12} />
      <span>{children}</span>
    </div>
  );
}

function Specs({ rows }) {
  return (
    <dl className="kv">
      {(rows ?? []).map((sp) => (
        <div
          key={sp.k}
          className={
            typeof sp.v === 'string' && sp.v.length > 34
              ? 'kv-row kv-row--stack'
              : 'kv-row'
          }
        >
          <dt>{sp.k}</dt>
          <dd>
            {sp.ref ? <CircuitRef link={sp.ref} text={sp.v} /> : sp.v}
            {sp.note ? <span className="kv-note">{sp.note}</span> : null}
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
      <span className="inline-ref">
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
    <span className="inline-ref">
      <span>{text}</span>
      <span className="tag" style={{ '--c': WARN }} title={link.label}>
        Unverified
      </span>
    </span>
  );
}

function Related({ rows, room, title }) {
  if (!rows || rows.length === 0) return null;
  return (
    <>
      <h3 className="section">
        {title || (room ? `Also in ${room}` : 'Related')}
        <span className="num">{rows.length}</span>
      </h3>
      <div className="links" role="list">
        {rows.map((r) => (
          <button
            key={`${r.kind}-${r.id}`}
            type="button"
            className="ia link-row"
            onClick={r.onClick}
            role="listitem"
          >
            <span
              className={r.square ? 'dot dot--sq' : 'dot'}
              style={{ '--c': r.accent }}
              aria-hidden="true"
            ></span>
            <span className="row-main">
              <span className="row-title" style={{ display: 'block' }}>
                {r.label}
              </span>
              <span className="row-sub" style={{ display: 'block' }}>
                {r.kind} · {r.sub}
              </span>
            </span>
            <Icon name="arrowRight" size={13} className="chev" />
          </button>
        ))}
      </div>
    </>
  );
}

function Badge({ label, color, plain }) {
  return (
    <span
      className={plain ? 'tag tag--lg tag--plain' : 'tag tag--lg'}
      style={color ? { '--c': color } : undefined}
    >
      {label}
    </span>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <ModeIcon mode={icon} size={22} />
      </span>
      <p>{text}</p>
    </div>
  );
}

function DemoFeed({ det, big }) {
  return (
    <div
      role="img"
      aria-label={`${det.name}: demonstration camera preview, not live video`}
      className={big ? 'feed feed--big' : 'feed'}
    >
      <div className="feed-bg"></div>
      <div className="feed-floor"></div>
      <div className="feed-mark">{det.watermark}</div>
      <div className="feed-scan"></div>
      {det.offline ? <div className="feed-offline">NO SIGNAL</div> : null}
      <div className="feed-top">
        <span className="feed-live" style={{ '--c': det.liveColor }}>
          <span className="dot dot--pulse" style={{ '--c': det.liveColor }} />
          {det.liveLabel}
        </span>
        <span>{det.res}</span>
      </div>
      <div className="feed-bottom">
        <span className="feed-name">{det.name}</span>
        <span className="feed-dim">
          <FeedClock />
        </span>
      </div>
    </div>
  );
}

export { DemoFeed };

/**
 * Phone sheet handle: drag down to dismiss, or tap to hide. The sheet
 * follows the finger, then either slides away or springs back.
 */
function SheetGrip({ sheet, onDismiss }) {
  const start = useRef(null);
  const dragged = useRef(false);
  const end = (e, cancel) => {
    const s = start.current;
    start.current = null;
    const el = sheet.current;
    if (!s || !el) return;
    const dy = Math.max(0, e.clientY - s.y);
    dragged.current = dy > 6;
    el.style.transition = '';
    el.style.translate = '';
    if (!cancel && dy > 72) onDismiss();
  };
  return (
    <button
      type="button"
      className="sheet-grip-hit"
      aria-label="Hide the details panel"
      onClick={() => {
        // A drag already decided; a tap or Enter/Space hides the sheet.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onDismiss();
      }}
      onPointerDown={(e) => {
        start.current = { y: e.clientY };
        dragged.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
        if (sheet.current) sheet.current.style.transition = 'none';
      }}
      onPointerMove={(e) => {
        if (!start.current || !sheet.current) return;
        const dy = Math.max(0, e.clientY - start.current.y);
        sheet.current.style.translate = `0 ${dy}px`;
      }}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
    >
      <span className="sheet-grip" aria-hidden="true" />
    </button>
  );
}

export function SystemDetails({ view }) {
  const sheet = useRef(null);
  return (
    <aside
      ref={sheet}
      id="panel-right"
      className={`side-panel surface ${view.narrow ? 'side-panel--sheet' : ''}`}
      style={css(view.detailPanelStyle)}
      data-hidden={view.rightHidden ? 'true' : undefined}
      aria-label={`${view.modeLabel} details`}
      inert={view.rightHidden ? true : undefined}
    >
      {view.narrow ? (
        <SheetGrip sheet={sheet} onDismiss={view.toggleRight} />
      ) : null}
      <div className="panel-scroll" ref={view.detailsRef}>
        <div className="panel-inner mode-fade" key={view.mode}>
          <div className="det-top">
            <span className="section-label">{view.modeLabel}</span>
            <ProvenanceTag />
          </div>
          <div className="notice-stack">
            <Notice notice={view.filterNotice} />
            <Notice notice={view.isoNotice} />
          </div>

          {view.isOverview ? (
            <>
              {view.roomDet ? (
                <div className="float-in" key={view.roomDet.id}>
                  <div className="det-head">
                    <div className="det-head-main">
                      <h2 className="det-title">{view.roomDet.name}</h2>
                      <div className="det-sub">
                        {view.roomDet.floorLabel}
                        {view.roomDet.aliases.length
                          ? ` · also recorded as ${view.roomDet.aliases.join(', ')}`
                          : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ia icon-btn"
                      onClick={view.roomDet.clear}
                      aria-label="Close room summary"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                  <div className="det-actions">
                    <button
                      type="button"
                      className={`ia btn ${view.roomDet.isolated ? 'is-on' : ''}`}
                      onClick={view.roomDet.isolate}
                      aria-pressed={view.roomDet.isolated}
                    >
                      <Icon name="layers" size={13} />
                      {view.roomDet.isolated
                        ? 'Isolated in model'
                        : 'Isolate this room'}
                    </button>
                  </div>
                  {view.roomDet.related.length ? (
                    <Related
                      rows={view.roomDet.related}
                      title="Recorded in this room"
                    />
                  ) : (
                    <Note style={{ marginTop: 16 }}>
                      Nothing is recorded for this room yet.
                    </Note>
                  )}
                  <div
                    style={{
                      height: 1,
                      background: 'var(--line)',
                      margin: '20px 0',
                    }}
                  ></div>
                </div>
              ) : null}
              <h2 className="panel-title" style={{ marginBottom: 12 }}>
                Needs attention
              </h2>
              <button
                type="button"
                onClick={view.goLighting}
                className="ia callout"
                style={{ '--c': WARN }}
              >
                <span
                  className="dot dot--pulse"
                  style={{ '--c': WARN }}
                  aria-hidden="true"
                ></span>
                <span className="grow">
                  <span className="callout-title">{view.alert.title}</span>
                  <span className="callout-sub">{view.alert.sub}</span>
                </span>
                <Icon name="arrowRight" size={13} className="chev" />
              </button>
              <button
                type="button"
                onClick={view.goUpkeep}
                className="ia callout"
                style={{ '--c': STATUS.overdue }}
              >
                <span
                  className="dot dot--pulse"
                  style={{ '--c': STATUS.overdue }}
                  aria-hidden="true"
                ></span>
                <span className="grow">
                  <span className="callout-title">{view.upAlert.title}</span>
                  <span className="callout-sub">{view.upAlert.sub}</span>
                </span>
                <Icon name="arrowRight" size={13} className="chev" />
              </button>
              <h3 className="section">
                Fixtures needing attention
                <span className="num">{(view.needs ?? []).length}</span>
              </h3>
              <div
                className="links"
                role="listbox"
                aria-label="Fixtures needing attention"
              >
                {(view.needs ?? []).map((b) => (
                  <div
                    key={b.id}
                    onClick={b.onClick}
                    className="ia link-row"
                    role="option"
                    aria-selected={false}
                    tabIndex={0}
                    onKeyDown={optionOnKey}
                    aria-label={`${b.room}, ${b.fixture}, ${b.statusLabel}`}
                  >
                    <span
                      className="dot"
                      style={{ '--c': b.color }}
                      aria-hidden="true"
                    ></span>
                    <div className="row-main">
                      <div className="row-title">{b.room}</div>
                      <div className="row-sub">{b.fixture}</div>
                    </div>
                    <span className="tag" style={{ '--c': b.color }}>
                      {b.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
              {view.roomDet ? null : (
                <Note>Select a room in the model to see what it holds.</Note>
              )}
            </>
          ) : null}

          {view.isElectrical ? (
            <>
              {view.noSel ? (
                <Empty
                  icon="electrical"
                  text="Select a circuit to light up the rooms it serves."
                />
              ) : null}
              {view.noSel ? (
                <Note style={{ justifyContent: 'center' }}>
                  Drawn paths are schematic associations, not wiring routes.
                </Note>
              ) : null}
              {view.panelDet ? (
                <>
                  <div className="det-head det-head--center">
                    <span
                      className="det-icon"
                      style={{ '--c': MODE_ACCENT.electrical }}
                    >
                      <ModeIcon mode="electrical" />
                    </span>
                    <div className="det-head-main">
                      <h2 className="det-title det-title--mono">
                        {view.panelDet.short}
                      </h2>
                      <div className="det-sub">{view.panelDet.loc}</div>
                    </div>
                    <Badge label="Panel" plain />
                  </div>
                  <div className="det-lead">{view.panelDet.name}</div>
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
                  <h3 className="section">By type</h3>
                  <div className="links">
                    {view.panelDet.byType.map((t) => (
                      <div key={t.type} className="link-row link-row--static">
                        <span
                          className="dot dot--sq"
                          style={{ '--c': t.color }}
                          aria-hidden="true"
                        ></span>
                        <span className="row-main row-title">{t.type}</span>
                        <span className="row-meta">{t.count}</span>
                        <div
                          className="bar"
                          style={{ '--c': t.color, width: 60 }}
                          aria-hidden="true"
                        >
                          <div
                            className="bar-fill"
                            style={{
                              width: `${view.panelDet.documented ? (t.count / view.panelDet.documented) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {view.hasSel ? (
                <>
                  <div className="det-head det-head--center">
                    <span
                      className="det-icon"
                      style={{ '--c': view.circDet.typeColor }}
                    >
                      <ModeIcon mode="electrical" />
                    </span>
                    <div className="det-head-main">
                      <h2 className="det-title det-title--mono">
                        {view.circDet.tag}
                      </h2>
                      <div className="det-sub">{`${view.circDet.amp} · ${view.circDet.typeLabel}`}</div>
                    </div>
                    <button
                      type="button"
                      className="ia icon-btn"
                      onClick={view.circDet.copyTag}
                      aria-label={`Copy circuit tag ${view.circDet.tag}`}
                      data-tip="Copy tag"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                  <div className="det-lead">{view.circDet.label}</div>
                  <div className="det-meta">
                    {'Fed from '}
                    <button
                      type="button"
                      className="ia link-button"
                      onClick={view.circDet.openPanel}
                    >
                      {view.circDet.boxName}
                    </button>
                    {` · ${view.circDet.boxLoc}`}
                  </div>
                  <div
                    className="callout"
                    style={{ '--c': view.circDet.typeColor, marginTop: 14 }}
                  >
                    <Icon name="layers" size={14} />
                    <span className="grow">{view.circDet.spansText}</span>
                  </div>
                  <h3 className="section">
                    Serves
                    <span className="num">
                      {`${view.circDet.loadCount} ${view.circDet.loadCount === 1 ? 'area' : 'areas'}`}
                    </span>
                  </h3>
                  <div className="links">
                    {(view.circDet.rooms ?? []).map((r) => (
                      <div
                        key={r.id}
                        className="link-row link-row--static"
                        style={{ flexWrap: 'wrap' }}
                      >
                        <span
                          className="dot"
                          style={{ '--c': r.floorColor }}
                          aria-hidden="true"
                        ></span>
                        <div className="row-main">
                          <div className="row-title">{r.name}</div>
                          <div className="row-sub">
                            {r.floorLabel}
                            {r.hidden ? (
                              <span
                                className="tone-text"
                                style={{ '--c': WARN }}
                              >
                                {' · hidden by isolation'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {r.cycle ? (
                          <button
                            type="button"
                            className="ia chip"
                            onClick={r.cycle}
                            aria-label={`Show the next of ${r.otherCount + 1} circuits serving ${r.name}`}
                          >
                            {`+${r.otherCount} more`}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <Note>
                    The model path is a schematic panel-to-room association, not
                    the surveyed cable route.
                  </Note>
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
                <Empty
                  icon="lighting"
                  text="Select a fixture to pin its room and see its specification."
                />
              ) : null}
              {view.hasBulb ? (
                <>
                  <div className="det-head det-head--center">
                    <span
                      className="det-icon det-icon--glow"
                      style={{ '--c': view.bd.kColor }}
                      aria-hidden="true"
                    ></span>
                    <div className="det-head-main">
                      <h2 className="det-title">{view.bd.room}</h2>
                      <div className="det-sub">{view.bd.fixture}</div>
                    </div>
                    <Badge label={view.bd.statusLabel} color={view.bd.color} />
                  </div>
                  <div
                    className="callout"
                    style={{ '--c': view.bd.color, marginTop: 16 }}
                  >
                    <span
                      className="dot"
                      style={{ '--c': view.bd.color }}
                      aria-hidden="true"
                    ></span>
                    <span className="grow">{view.bd.statusFull}</span>
                  </div>
                  <Note>
                    {`Status and dates are mock values (${view.snapshot} snapshot), not computed from today.`}
                  </Note>
                  <Specs rows={view.bd.specs} />
                  <div
                    className="callout callout--plain"
                    style={{ marginTop: 10 }}
                  >
                    <Icon name="pin" size={14} />
                    <span className="grow">{view.locate.floorLabel}</span>
                    <span style={{ color: 'var(--t5)', fontWeight: 400 }}>
                      {view.locate.pinNote}
                    </span>
                  </div>
                  {view.bd.circuits.length ? (
                    <>
                      <h3 className="section">Room circuits</h3>
                      <div className="links">
                        {view.bd.circuits.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="ia link-row"
                            onClick={c.onClick}
                          >
                            <span className="row-tag">{c.tag}</span>
                            <span className="row-main row-title">
                              {c.label}
                            </span>
                            <Icon
                              name="arrowRight"
                              size={13}
                              className="chev"
                            />
                          </button>
                        ))}
                      </div>
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
                  className="ia callout callout--plain"
                  onClick={view.gateway.onClick}
                  aria-label={`Open ${view.gateway.name}, ${view.gateway.role}`}
                  style={{ marginBottom: 18 }}
                >
                  <span
                    className="dot"
                    style={{ '--c': STATUS.ok }}
                    aria-hidden="true"
                  ></span>
                  <span className="grow">
                    <span className="row-title" style={{ display: 'block' }}>
                      {view.gateway.name}
                    </span>
                    <span className="row-sub" style={{ display: 'block' }}>
                      {`${view.gateway.role} · ${view.gateway.room} · uplink ${view.gateway.backhaul}`}
                    </span>
                  </span>
                  <Icon name="arrowRight" size={13} className="chev" />
                </button>
              ) : null}
              <div className="det-head det-head--center">
                <span
                  className="det-icon"
                  style={{ '--c': MODE_ACCENT.network }}
                >
                  <ModeIcon mode="network" />
                </span>
                <div className="det-head-main">
                  <h2 className="det-title">{view.nodeDet.name}</h2>
                  <div className="det-sub">{`${view.nodeDet.role} · ${view.nodeDet.room}`}</div>
                </div>
              </div>
              <div className="det-actions">
                <Badge
                  label={view.nodeDet.statusLabel}
                  color={view.nodeDet.statusColor}
                />
              </div>
              {view.nodeDet.id === 'n7' ? <PiholePanel /> : null}
              {view.nodeDet.statusNote ? (
                <Note>{view.nodeDet.statusNote}</Note>
              ) : null}
              <Specs
                rows={[
                  { k: 'IP address', v: view.nodeDet.ip },
                  { k: 'MAC address', v: view.nodeDet.mac },
                  { k: 'Last observed', v: view.nodeDet.observedAt },
                  { k: 'Placement', v: view.nodeDet.location },
                  { k: 'Evidence', v: view.nodeDet.evidence },
                  { k: 'Networks', v: view.nodeDet.netText || 'Unverified' },
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
                  <h3 className="section">Attached servers</h3>
                  <div
                    className="links"
                    role="listbox"
                    aria-label="Attached servers"
                  >
                    {(view.nodeDet.servers ?? []).map((sv) => (
                      <div
                        key={sv.id}
                        id={`row-server-${sv.id}`}
                        role="option"
                        aria-selected={sv.selected}
                        tabIndex={0}
                        onKeyDown={optionOnKey}
                        onClick={sv.onClick}
                        className="ia row"
                        style={{
                          '--ac': MODE_ACCENT.network,
                          flexWrap: 'wrap',
                          margin: 0,
                        }}
                        aria-label={`${sv.name}, ${sv.kind}, power ${sv.power}`}
                      >
                        <span
                          className="dot dot--diamond"
                          style={{ '--c': MODE_ACCENT.network }}
                          aria-hidden="true"
                        ></span>
                        <div className="row-main">
                          <div className="row-title">{sv.name}</div>
                          <div className="row-sub">{sv.kind}</div>
                        </div>
                        <div className="row-meta">
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
              <div className="det-head det-head--center">
                <span className="det-icon" style={{ '--c': MODE_ACCENT.sound }}>
                  <ModeIcon mode="sound" />
                </span>
                <div className="det-head-main">
                  <h2 className="det-title">{view.zoneDet.name}</h2>
                  <div className="det-sub">{view.zoneDet.room}</div>
                </div>
                <abbr
                  title={view.zoneDet.configNote}
                  className="tag tag--lg"
                  style={{ '--c': MODE_ACCENT.sound }}
                >
                  {view.zoneDet.config}
                </abbr>
              </div>
              <div className="det-meta" style={{ marginTop: 12 }}>
                {`${view.zoneDet.config.split(' ')[0]} = ${view.zoneDet.configNote}.`}
              </div>
              <div
                className="speaker-map"
                role="img"
                aria-label="Generic 7.2.4 speaker placement diagram — schematic, not a surveyed layout"
              >
                <span className="tag tag--plain">Schematic</span>
                {(view.zoneDet.spk ?? []).map((p) => (
                  <div
                    key={p.key}
                    className={p.seat ? 'speaker speaker--seat' : 'speaker'}
                    style={css(p.style)}
                    title={p.name}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
              <Note>
                Generic placement shared by both zones — not measured speaker
                positions.
              </Note>
              <dl className="kv">
                {(view.zoneDet.gear ?? []).map((g) => (
                  <div key={g.l} className="kv-row">
                    <dt>{g.l}</dt>
                    <dd>
                      {g.placeholder
                        ? g.d.replace('[ model ]', 'model not recorded')
                        : g.d}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="links" style={{ marginTop: 10 }}>
                <div
                  className="link-row link-row--static"
                  style={{ flexWrap: 'wrap' }}
                >
                  <Icon name="bolt" size={14} style={{ color: 'var(--t4)' }} />
                  <span
                    className="row-main row-sub row-sub--wrap"
                    style={{ color: 'var(--t2)' }}
                  >
                    {view.zoneDet.power}
                  </span>
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
                      <span key={l.tag} className="tag" style={{ '--c': WARN }}>
                        {`${l.tag} unverified`}
                      </span>
                    ),
                  )}
                </div>
                <div className="link-row link-row--static">
                  <Icon name="note" size={14} style={{ color: 'var(--t4)' }} />
                  <span
                    className="row-main row-sub"
                    style={{ color: 'var(--t2)' }}
                  >
                    {view.zoneDet.source}
                  </span>
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
                className="ia btn btn--tone btn--block"
                style={{
                  '--c': MODE_ACCENT.security,
                  justifyContent: 'flex-start',
                }}
                aria-haspopup="dialog"
              >
                <span
                  className="dot dot--pulse"
                  style={{ '--c': MODE_ACCENT.security }}
                  aria-hidden="true"
                ></span>
                Open live cameras
                <span
                  style={{
                    marginLeft: 'auto',
                    font: '600 11px var(--mono)',
                    letterSpacing: '0.1em',
                    opacity: 0.8,
                  }}
                >
                  XFINITY
                </span>
              </button>
              <div style={{ height: 16 }}></div>
              <DemoFeed det={view.camDet} />
              <Note>
                Mock camera details. The preview and event history are
                demonstrations, not live video.
              </Note>
              <div
                className="det-head det-head--center"
                style={{ marginTop: 16 }}
              >
                <div className="det-head-main">
                  <h2 className="det-title">{view.camDet.name}</h2>
                  <div className="det-sub">{`${view.camDet.room} · ${view.camDet.coverage}`}</div>
                </div>
                <button
                  type="button"
                  className="ia icon-btn"
                  onClick={view.camDet.copyName}
                  aria-label={`Copy camera name ${view.camDet.name}`}
                  data-tip="Copy name"
                >
                  <Icon name="copy" size={14} />
                </button>
              </div>
              <div className="det-actions">
                <Badge
                  label={view.camDet.statusLabel}
                  color={view.camDet.statusColor}
                />
                <Badge label={view.camDet.type} plain />
              </div>
              {view.camDet.floorConflict ? (
                <div
                  role="note"
                  className="callout"
                  style={{
                    '--c': WARN,
                    marginTop: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <Icon name="alert" size={14} style={{ marginTop: 2 }} />
                  <span className="grow">{view.camDet.floorConflict}</span>
                </div>
              ) : null}
              <Specs rows={view.camDet.specs} />
              <button
                type="button"
                onClick={view.openExpand}
                className="ia btn btn--tone btn--block"
                style={{ '--c': MODE_ACCENT.security, marginTop: 12 }}
                aria-haspopup="dialog"
              >
                <Icon name="expand" size={14} />
                Review demo history
              </button>
              <Related rows={view.camDet.related} room={view.camDet.room} />
            </>
          ) : null}

          {view.isClimate ? (
            <>
              <div className="det-head det-head--center">
                <span
                  className="det-icon"
                  style={{ '--c': MODE_ACCENT.climate }}
                >
                  <ModeIcon mode="climate" />
                </span>
                <div className="det-head-main">
                  <h2 className="det-title">{view.sensorDet.name}</h2>
                  <div className="det-sub">{view.sensorDet.mount}</div>
                </div>
                <Badge label="Planned" color={WARN} />
              </div>
              <div
                className="metrics"
                style={{ marginTop: 16 }}
                aria-hidden="true"
              >
                {['Temperature °F', 'Humidity %RH'].map((l) => (
                  <div key={l} className="metric metric--big">
                    <div className="metric-value">—</div>
                    <div className="metric-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="callout" style={{ '--c': WARN, marginTop: 10 }}>
                <span
                  className="dot"
                  style={{ '--c': WARN }}
                  aria-hidden="true"
                />
                <span className="grow">
                  Planned · not installed · no readings
                </span>
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
              <Note>
                The marker shows the intended room and wall, not a measured
                mount point. Confirm power and IoT reach on site before
                installing.
              </Note>
              <Related
                rows={view.sensorDet.related}
                room={view.sensorDet.name}
              />
            </>
          ) : null}

          {view.isUpkeep ? (
            <>
              <div className="det-head det-head--center">
                <span
                  className="det-icon"
                  style={{ '--c': view.upDet.statusColor }}
                >
                  <ModeIcon mode="upkeep" />
                </span>
                <div className="det-head-main">
                  <h2 className="det-title">{view.upDet.kind}</h2>
                  <div className="det-sub">{view.upDet.device}</div>
                </div>
                <Badge
                  label={view.upDet.statusLabel}
                  color={view.upDet.statusColor}
                />
              </div>
              <div className="kv" style={{ padding: '14px 14px 12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="section-label">
                    {view.upDet.metricLabel}
                  </span>
                  <span
                    className="num"
                    style={{ font: '600 13px var(--font)', color: 'var(--t1)' }}
                  >
                    {view.upDet.metricVal}
                  </span>
                </div>
                <div
                  className="bar bar--lg"
                  style={{ '--c': view.upDet.barColor, marginTop: 10 }}
                  role="img"
                  aria-label={`${view.upDet.barPct}% ${view.upDet.barMeaning}`}
                >
                  <div
                    className="bar-fill"
                    key={view.upDet.id}
                    style={{ width: `${view.upDet.barPct}%` }}
                  ></div>
                </div>
                <div className="bar-scale">
                  <span>
                    {view.upDet.barMeaning === 'remaining' ? 'Empty' : '0 used'}
                  </span>
                  <span>
                    {view.upDet.barMeaning === 'remaining'
                      ? 'Full'
                      : 'Rated life'}
                  </span>
                </div>
              </div>
              <Note>
                {`Mock values (${view.snapshot} snapshot) unless tagged REAL DATA — they don’t advance with the calendar.`}
              </Note>
              {view.upDet.refills.length ? (
                <div
                  className="kv"
                  style={{
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${STATUS.real} 40%, transparent)`,
                    padding: '10px 14px',
                  }}
                  aria-label="Real refill log"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span className="section-label">Refill log</span>
                    <ProvenanceTag real />
                  </div>
                  {view.upDet.refills.map((r) => (
                    <div key={r.date + r.item} className="kv-row">
                      <dt style={{ color: 'var(--t1)', fontWeight: 500 }}>
                        {`${r.bags} bags · ${r.item}`}
                      </dt>
                      <dd className="num" style={{ color: 'var(--t3)' }}>
                        {r.date}
                      </dd>
                    </div>
                  ))}
                </div>
              ) : null}
              <Specs rows={view.upDet.specs} />
              <div
                className="callout"
                style={{
                  '--c': view.upDet.statusColor,
                  marginTop: 10,
                  alignItems: 'flex-start',
                  fontWeight: 400,
                }}
              >
                <Icon name="note" size={14} style={{ marginTop: 2 }} />
                <span className="grow">{view.upDet.note}</span>
              </div>
              <div className="callout callout--plain" style={{ marginTop: 8 }}>
                <Icon name="pin" size={14} />
                <span className="grow">{view.upDet.floorLabel}</span>
                {view.upDet.locationReal ? <ProvenanceTag real /> : null}
                <span style={{ color: 'var(--t5)', fontWeight: 400 }}>
                  {view.upDet.pinNote}
                </span>
              </div>
              {view.upDet.roomItems.length ? (
                <>
                  <h3 className="section">Same room</h3>
                  <div
                    className="links"
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
                        className="ia link-row"
                        aria-label={`${u.kind}, ${u.statusLabel}`}
                      >
                        <span
                          className="dot"
                          style={{ '--c': u.color }}
                          aria-hidden="true"
                        ></span>
                        <span className="row-main row-title">{u.kind}</span>
                        <span className="tag" style={{ '--c': u.color }}>
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
                title="Related records in this room"
              />
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
