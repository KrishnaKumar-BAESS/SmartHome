import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

function ToggleRow({ row, icon }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      className="ia row-button"
      style={css(row.style)}
      aria-pressed={row.on}
    >
      <span
        style={css(
          'width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1',
        )}
      >
        <Icon name={icon} size={13} />
      </span>
      <span style={css('flex:1;text-align:left')}>{row.label}</span>
      <span style={css(row.toggle)} aria-hidden="true"></span>
    </button>
  );
}

function ActionRow({ row, icon }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      className="ia row-button"
      style={css(row.style)}
      title={row.hint}
    >
      <span
        style={css(
          'width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1',
        )}
      >
        <Icon name={icon} size={13} />
      </span>
      <span style={css('flex:1;text-align:left')}>{row.label}</span>
      {row.hint ? (
        <span
          style={css("font:400 10px 'IBM Plex Mono',monospace;color:var(--t4)")}
        >
          {row.hint}
        </span>
      ) : null}
    </button>
  );
}

function Drawer({ view }) {
  const { mounted, exiting } = usePresence(view.viewOptsOpen);
  if (!mounted) return null;
  const o = view.viewOpts;
  return (
    <div
      id="view-options"
      className={exiting ? 'float-out' : 'float-in'}
      style={css(o.drawerStyle)}
      role="group"
      aria-label="View options"
    >
      <div style={css(o.sectionLabelStyle)}>{'FLOOR VIEW'}</div>
      <div
        style={css('display:flex;gap:4px;margin-bottom:6px')}
        role="group"
        aria-label="Floor separation"
      >
        {view.explodeBtns.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={b.onClick}
            className="ia"
            style={css(b.style)}
            aria-pressed={b.on}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div style={css(o.sectionLabelStyle)}>{'ORIENTATION'}</div>
      <div
        style={css('display:flex;gap:4px;margin-bottom:6px')}
        role="group"
        aria-label="Orientation presets"
      >
        {o.presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={p.onClick}
            className="ia"
            style={css(o.presetStyle)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div
        style={css('display:flex;gap:4px;margin-bottom:6px')}
        role="group"
        aria-label="Rotate, tilt, and pan"
      >
        {o.nudge.map((n) => (
          <button
            key={n.key}
            type="button"
            onClick={n.onClick}
            className="ia"
            style={css(o.nudgeStyle)}
            aria-label={n.label}
            title={n.label}
          >
            <Icon name={n.icon} size={14} />
          </button>
        ))}
      </div>
      <div
        style={css(
          "font:400 10px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);line-height:1.4;margin-bottom:6px",
        )}
      >
        {o.presetNote}
      </div>
      <div style={css(o.divStyle)}></div>
      <ActionRow row={o.resetRow} icon="reset" />
      <ActionRow row={o.fitRow} icon="expand" />
      <ActionRow row={o.resetAllRow} icon="cube" />
      <div style={css(o.divStyle)}></div>
      <ToggleRow row={o.autoRow} icon="rotateRight" />
      <ToggleRow row={o.labelsRow} icon="labels" />
      <ToggleRow row={o.legendRow} icon="legend" />
      <ToggleRow row={o.shortcutsRow} icon="list" />
      <div style={css(o.divStyle)}></div>
      <div style={css(o.sectionLabelStyle)}>{'THEME'}</div>
      <div style={css('display:flex;gap:4px')} role="group" aria-label="Theme">
        {o.theme.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={t.onClick}
            className="ia"
            style={css(t.style)}
            aria-pressed={t.on}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ViewControls({ view }) {
  return (
    <div
      style={css(view.ctrlClusterStyle)}
      data-popover="view"
      role="toolbar"
      aria-label="Model controls"
      aria-orientation="vertical"
    >
      {view.isNarrow ? (
        <div style={css('display:flex;border-bottom:1px solid var(--lift-10)')}>
          <button
            type="button"
            className="ia panel-toggle"
            onClick={view.toggleLeft}
            aria-pressed={!view.leftHidden}
            aria-controls="panel-left"
          >
            <Icon name="list" size={12} />
            {view.leftHidden ? 'List' : 'Hide list'}
          </button>
          <button
            type="button"
            className="ia panel-toggle"
            onClick={view.toggleRight}
            aria-pressed={!view.rightHidden}
            aria-controls="panel-right"
          >
            <Icon name="panel" size={12} />
            {view.rightHidden ? 'Details' : 'Hide details'}
          </button>
          <button
            type="button"
            className="ia panel-toggle"
            onClick={view.togglePanels}
            aria-pressed={view.panelsHidden}
          >
            {view.panelsHidden ? 'Show panels' : 'Show model'}
          </button>
        </div>
      ) : null}
      <Drawer view={view} />
      <div style={css(view.zoomBarStyle)}>
        <button
          type="button"
          onClick={view.zoomOut}
          className="ia"
          style={css(view.zoomBtnStyle(view.atMin))}
          aria-label="Zoom out"
          title="Zoom out (−)"
          aria-disabled={view.atMin}
          disabled={view.atMin}
        >
          <Icon name="minus" size={14} />
        </button>
        <div
          style={css(view.zoomPctStyle)}
          role="status"
          aria-live="polite"
          aria-label={`Zoom ${view.zoomPct}${view.atMin ? ', minimum' : view.atMax ? ', maximum' : ''}`}
        >
          {view.zoomPct}
        </div>
        <button
          type="button"
          onClick={view.zoomIn}
          className="ia"
          style={css(view.zoomBtnStyle(view.atMax))}
          aria-label="Zoom in"
          title="Zoom in (+)"
          aria-disabled={view.atMax}
          disabled={view.atMax}
        >
          <Icon name="plus" size={14} />
        </button>
        <div
          style={css(
            'width:1px;height:16px;background:var(--lift-12);margin:0 3px;flex-shrink:0',
          )}
        ></div>
        <button
          type="button"
          onClick={view.toggleViewOpts}
          className="ia"
          style={css(view.viewOptsBtnStyle)}
          aria-label="View options"
          title="View options"
          aria-expanded={view.viewOptsOpen}
          aria-controls="view-options"
        >
          <Icon name="sliders" size={14} />
        </button>
      </div>
    </div>
  );
}
