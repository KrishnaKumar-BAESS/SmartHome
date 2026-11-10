import { PiholePanel } from './pihole-panel';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';
import { ModeIcon } from './mode-icons';
import { CountUp } from './count-up';
import { ProvenanceTag } from './provenance-tag';
import { MODE_ACCENT } from './palette';

function Header({ title, count, onExport, exportLabel, children, tag }) {
  return (
    <div className="panel-head">
      <div className="panel-head-row">
        <div>
          <h2 className="panel-title">{title}</h2>
          {tag ?? <ProvenanceTag />}
        </div>
        <div>
          {count ? <span className="panel-count">{count}</span> : null}
          {onExport ? (
            <button
              type="button"
              className="ia icon-btn"
              onClick={onExport}
              aria-label={exportLabel || 'Export the visible list as CSV'}
              data-tip="Export CSV"
            >
              <Icon name="download" size={14} />
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
    <div className="chips" role="group" aria-label={label}>
      {(items ?? []).map((t) => (
        <button
          key={t.key}
          type="button"
          className="ia chip"
          onClick={t.onClick}
          aria-pressed={t.on}
        >
          {t.color ? (
            <span
              className="dot"
              style={{ '--c': t.color, width: 7, height: 7 }}
              aria-hidden="true"
            ></span>
          ) : null}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Option({ id, row, children, ariaLabel, className }) {
  return (
    <div
      id={`row-${id}`}
      onClick={row.onClick}
      style={css(row.rowStyle)}
      className={className ? `ia row ${className}` : 'ia row'}
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
    <div className="empty" role="status">
      <p>{text}</p>
      {action ? (
        <button type="button" className="ia chip-button" onClick={action}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

// Rows flag exceptions only: a healthy record shows no badge (its row
// label still announces the status).
function Status({ label, color }) {
  if (label === 'OK' || label === 'Online') return null;
  return (
    <span className="tag" style={{ '--c': color }}>
      {label}
    </span>
  );
}

function Metrics({ items, label, hidden, title }) {
  return (
    <div
      className="metrics"
      role="list"
      aria-label={label}
      title={title}
      hidden={hidden}
    >
      {(items ?? []).map((s) => (
        <div
          key={s.label}
          role="listitem"
          className="metric"
          style={s.color ? { '--c': s.color } : undefined}
        >
          <div className="metric-value">
            <CountUp value={s.val} />
          </div>
          <div className="metric-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="note">
      <Icon name="info" size={12} />
      <span>{children}</span>
    </div>
  );
}

export function SystemList({ view }) {
  return (
    <aside
      id="panel-left"
      ref={view.listRef}
      className="side-panel surface"
      style={css(view.listPanelStyle)}
      data-hidden={view.leftHidden ? 'true' : undefined}
      data-overlay={view.narrow ? 'true' : undefined}
      aria-label={`${view.modeLabel} inventory`}
      inert={view.leftHidden ? true : undefined}
    >
      <div className="panel-stack mode-fade" key={view.mode}>
        {view.isOverview ? (
          <>
            <Header title="Home" />
            <div className="panel-body" style={{ padding: 14 }}>
              <div
                className="stat-grid"
                role="list"
                aria-label="System summaries"
              >
                {(view.overviewStats ?? []).map((s, i) => (
                  <div role="listitem" key={s.label}>
                    <button
                      type="button"
                      onClick={s.onClick}
                      className="ia stat-card"
                      style={{
                        '--c': s.accent,
                        animation: `contentIn var(--dur-4) var(--ease-out) ${i * 40}ms both`,
                      }}
                      aria-label={`${s.label}: ${s.stat} ${s.sub}.${
                        s.bar
                          ? ` Breakdown: ${s.bar
                              .filter((b) => b.count)
                              .map((b) => `${b.label} ${b.count}`)
                              .join(', ')}.`
                          : ''
                      } Open ${s.label.toLowerCase()}`}
                    >
                      <span className="stat-head">
                        <span className="stat-icon">
                          <ModeIcon mode={s.mode} />
                        </span>
                        <Icon name="arrowRight" size={13} className="chev" />
                      </span>
                      <span className="stat-value">
                        <CountUp value={s.stat} />
                      </span>
                      <span className="stat-label">{s.name}</span>
                      <span className="stat-sub">{s.sub}</span>
                      {s.bar ? (
                        <span
                          className="stack-bar stat-bar"
                          aria-hidden="true"
                          title={s.bar
                            .filter((b) => b.count)
                            .map((b) => `${b.label} ${b.count}`)
                            .join(' · ')}
                        >
                          {s.bar
                            .filter((b) => b.count)
                            .map((b) => (
                              <span
                                key={b.label}
                                style={{ '--c': b.color, flexGrow: b.count }}
                              />
                            ))}
                        </span>
                      ) : null}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={view.goClimate}
                className="ia callout"
                style={{ '--c': MODE_ACCENT.climate, marginTop: 8 }}
              >
                <ModeIcon mode="climate" size={16} />
                <span className="grow">
                  <span className="callout-title">
                    {view.climateBanner.title}
                  </span>
                  <span className="callout-sub">{view.climateBanner.sub}</span>
                </span>
                <Icon name="arrowRight" size={13} className="chev" />
              </button>
              <h3 className="section">The house</h3>
              <dl className="kv" style={{ marginTop: 0 }}>
                {(view.quickFacts ?? []).map((f) => (
                  <div key={f.label} className="kv-row">
                    <dt>{f.label}</dt>
                    <dd>{f.val}</dd>
                  </div>
                ))}
              </dl>
              <Note>
                {`Mock inventory (${view.snapshot} snapshot). Statuses are not live telemetry.`}
              </Note>
            </div>
          </>
        ) : null}

        {view.isElectrical ? (
          <>
            <Header
              title="Circuits"
              count={`${view.ecount} of ${view.etotal}`}
              onExport={view.exportCurrent}
            >
              <Chips items={view.typeFilters} label="Circuit type" />
            </Header>
            <div className="panel-body">
              {view.circGroups.length === 0 ? (
                <Empty text="No circuits of this type." />
              ) : null}
              {(view.circGroups ?? []).map((grp) => (
                <div
                  key={grp.id}
                  role="listbox"
                  aria-label={`${grp.boxName} circuits`}
                >
                  <div
                    id={`row-panel-${grp.id}`}
                    role="option"
                    aria-selected={grp.selected}
                    tabIndex={0}
                    onKeyDown={optionOnKey}
                    onClick={grp.onClick}
                    className="ia group-head"
                    aria-label={`${grp.boxName} panel`}
                  >
                    <b>{grp.boxShort}</b>
                    <span>{grp.boxName}</span>
                  </div>
                  {(grp.items ?? []).map((c) => (
                    <Option
                      key={c.id}
                      id={c.id}
                      row={c}
                      ariaLabel={`${c.tag} ${c.label}, ${c.amp}, ${c.typeLabel}`}
                    >
                      <span
                        className="dot dot--sq"
                        style={{ '--c': c.color }}
                        aria-hidden="true"
                      ></span>
                      <div className="row-main">
                        <div className="row-title">
                          <span className="row-tag">{c.tag}</span>
                          {c.label}
                        </div>
                        <div className="row-sub">{`${c.amp} · ${c.typeLabel}`}</div>
                      </div>
                    </Option>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {view.isLighting ? (
          <>
            <Header
              title="Fixtures"
              count={view.lcount}
              onExport={view.exportCurrent}
            >
              <Metrics
                items={view.lsum}
                label="Fixture status totals for the whole inventory"
                title="Totals count fixture records (a record may hold several bulbs) across all rooms"
                hidden={view.short}
              />
              <Chips items={view.lfilters} label="Fixture status filter" />
              <select
                className="select"
                value={view.lroom}
                onChange={view.setLroom}
                aria-label="Filter fixtures by room"
              >
                {(view.lroomOpts ?? []).map((o) => (
                  <option key={o.val} value={o.val}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Header>
            <div
              className="panel-body"
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
              {(view.bulbRows ?? []).map((b) => (
                <Option
                  key={b.id}
                  id={b.id}
                  row={b}
                  ariaLabel={`${b.room}, ${b.fixture}, ${b.statusLabel}, ${b.spec}`}
                >
                  <span
                    className="kelvin"
                    style={{ '--c': b.kColor }}
                    title={b.spec}
                    aria-hidden="true"
                  ></span>
                  <div className="row-main">
                    <div className="row-title">{b.room}</div>
                    <div className="row-sub">{`${b.fixture} · ${b.kText}`}</div>
                  </div>
                  <Status label={b.statusLabel} color={b.color} />
                </Option>
              ))}
            </div>
          </>
        ) : null}

        {view.isNetwork ? (
          <>
            <Header title="Network" onExport={view.exportCurrent} />
            <div className="panel-body" style={{ padding: '12px 12px 16px' }}>
              <PiholePanel />
              <h3 className="section" style={{ marginTop: 16 }}>
                Networks
              </h3>
              <div className="links" role="list" aria-label="Recorded networks">
                {(view.networks ?? []).map((n) => (
                  <div
                    key={n.id}
                    role="listitem"
                    id={`row-net-${n.id}`}
                    tabIndex={-1}
                    className="link-row link-row--static"
                  >
                    <span
                      className="dot dot--sq"
                      style={{ '--c': n.color }}
                      aria-hidden="true"
                    ></span>
                    <div className="row-main">
                      <div className="row-title">{n.name}</div>
                      <div className="row-sub" title={n.band}>
                        {`SSID ${n.ssid}`}
                      </div>
                    </div>
                    <span className="row-meta">
                      {`${n.members} node${n.members === 1 ? '' : 's'}`}
                    </span>
                  </div>
                ))}
              </div>
              <Note>
                Discovery snapshot, Oct 14, 2026 · 10:20 MDT — not live health.
                Locations are approximate except the owner-confirmed Parlor host
                and Office router; unmanaged switches may not appear. Names
                only, no credentials.
              </Note>
              <h3 className="section">
                Devices
                <span className="num">{view.nodeList.length}</span>
              </h3>
              <div role="listbox" aria-label="Network devices">
                {(view.nodeList ?? []).map((n) => (
                  <Option
                    key={n.id}
                    id={n.id}
                    row={n}
                    ariaLabel={`${n.name}, ${n.role}, ${n.room}, ${n.statusLabel}, networks: ${n.netText}`}
                  >
                    <span
                      className="dot"
                      style={{ '--c': n.statusColor }}
                      aria-hidden="true"
                    ></span>
                    <div className="row-main">
                      <div className="row-title">{n.name}</div>
                      <div className="row-sub">{`${n.role} · ${n.room}`}</div>
                    </div>
                    <span
                      className="row-meta"
                      title={`${n.statusLabel} · ${n.netText}`}
                      aria-hidden="true"
                    >
                      {(n.netDots ?? []).map((d) => (
                        <span
                          key={d.id}
                          className="dot dot--sq"
                          style={{ '--c': d.color, width: 7, height: 7 }}
                        ></span>
                      ))}
                    </span>
                  </Option>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {view.isSound ? (
          <>
            <Header
              title="Sound zones"
              count={`${(view.zoneList ?? []).length} zones`}
              onExport={view.exportCurrent}
            />
            <div
              className="panel-body"
              style={{ padding: 12 }}
              role="listbox"
              aria-label="Sound zones"
            >
              {(view.zoneList ?? []).map((z) => (
                <div
                  key={z.id}
                  id={`row-${z.id}`}
                  onClick={z.onClick}
                  style={css(z.cardStyle)}
                  className="ia row row--card row--stack"
                  role="option"
                  aria-selected={z.selected}
                  tabIndex={0}
                  onKeyDown={optionOnKey}
                  aria-label={`${z.name} zone, ${z.config}, ${z.room}`}
                >
                  <div className="row-line">
                    <div className="row-main">
                      <div
                        className="row-title"
                        style={{ fontSize: 15, fontWeight: 600 }}
                      >
                        {z.name}
                      </div>
                      <div className="row-sub">{z.room}</div>
                    </div>
                    <span
                      className="tag tag--lg"
                      style={{ '--c': MODE_ACCENT.sound }}
                    >
                      {z.config}
                    </span>
                  </div>
                  <div
                    className="row-sub"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    <Icon name="bolt" size={12} />
                    {z.power}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {view.isSecurity ? (
          <>
            <Header
              title="Cameras"
              count={`${view.camOnline} of ${view.camTotal} online`}
              onExport={view.exportCurrent}
            >
              <button
                type="button"
                onClick={view.openGrid}
                className="ia btn btn--tone btn--block"
                style={{
                  '--c': MODE_ACCENT.security,
                  marginTop: 12,
                  justifyContent: 'flex-start',
                }}
                aria-haspopup="dialog"
              >
                <span
                  className="dot dot--pulse"
                  style={{ '--c': MODE_ACCENT.security }}
                  aria-hidden="true"
                ></span>
                Live cameras
                <Icon
                  name="grid"
                  size={13}
                  style={{ marginLeft: 'auto', opacity: 0.8 }}
                />
              </button>
              <Chips items={view.camFilters} label="Camera filter" />
            </Header>
            <div className="panel-body" role="listbox" aria-label="Cameras">
              {view.camList.length === 0 ? (
                <Empty
                  text="No cameras match this filter."
                  action={view.camFilters[0].onClick}
                  actionLabel="Show all cameras"
                />
              ) : null}
              {(view.camList ?? []).map((c) => (
                <Option
                  key={c.id}
                  id={c.id}
                  row={c}
                  ariaLabel={`${c.name}, ${c.sub}, recorded ${c.statusLabel}, ${c.res}`}
                >
                  <span
                    className="dot"
                    style={{ '--c': c.statusColor }}
                    aria-hidden="true"
                  ></span>
                  <div className="row-main">
                    <div className="row-title">{c.name}</div>
                    <div className="row-sub">{c.sub}</div>
                  </div>
                  <span className="row-meta">{c.res}</span>
                  <Status label={c.statusLabel} color={c.statusColor} />
                </Option>
              ))}
            </div>
          </>
        ) : null}

        {view.isClimate ? (
          <>
            <Header
              title="Sensors"
              onExport={view.exportCurrent}
              count={`${view.sensorsPlanned} planned`}
            />
            <div
              className="panel-body"
              role="listbox"
              aria-label="Planned sensors"
            >
              <div
                className="callout"
                style={{ '--c': '#ec9a35', margin: '0 0 6px' }}
              >
                <Icon name="info" size={14} />
                <span className="grow">
                  Temperature and humidity sensors are planned — none connected
                  yet.
                </span>
              </div>
              <div style={{ height: 8 }}></div>
              {(view.sensorList ?? []).map((s) => (
                <Option
                  key={s.id}
                  id={s.id}
                  row={s}
                  ariaLabel={`${s.name} sensor, ${s.mount}, ${s.badge.toLowerCase()}`}
                >
                  <span
                    className="dot dot--diamond dot--ring"
                    style={{ '--c': s.dot }}
                    aria-hidden="true"
                  ></span>
                  <div className="row-main">
                    <div className="row-title">{s.name}</div>
                    <div className="row-sub">{s.mount}</div>
                  </div>
                  {s.badge === 'PLANNED' ? null : (
                    <span
                      className="tag"
                      style={{ '--c': MODE_ACCENT.climate }}
                    >
                      {s.badge}
                    </span>
                  )}
                </Option>
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
              <Metrics
                items={view.upSummary}
                label="Replacement status totals for all tracked items"
                hidden={view.short}
              />
              <Chips items={view.ufilters} label="Replacement filter" />
            </Header>
            <div
              className="panel-body"
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
              {(view.upList ?? []).map((u) => (
                <Option
                  key={u.id}
                  id={u.id}
                  row={u}
                  className="row--stack"
                  ariaLabel={`${u.kind}, ${u.device}, ${u.statusLabel}, ${u.dueLabel}`}
                >
                  <div className="row-line">
                    <span
                      className="dot"
                      style={{ '--c': u.statusColor }}
                      aria-hidden="true"
                    ></span>
                    <div className="row-main">
                      <div className="row-title">{u.kind}</div>
                      <div className="row-sub">{u.device}</div>
                    </div>
                    <Status label={u.statusLabel} color={u.statusColor} />
                  </div>
                  {u.lastRefill ? (
                    <div
                      className="row-meta"
                      style={{
                        marginTop: 8,
                        marginLeft: 18,
                        color: 'var(--t2)',
                        flexWrap: 'wrap',
                        rowGap: 4,
                      }}
                    >
                      <ProvenanceTag real />
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {u.lastRefill}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className="row-line"
                    style={{ marginTop: 9, marginLeft: 18, gap: 8 }}
                  >
                    <div
                      className="bar"
                      style={{ '--c': u.barColor, flex: 1 }}
                      role="img"
                      aria-label={u.barAria}
                    >
                      <div
                        className="bar-fill"
                        style={{ width: `${u.barPct}%` }}
                      ></div>
                    </div>
                    <span className="row-meta">{u.dueLabel}</span>
                  </div>
                </Option>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
