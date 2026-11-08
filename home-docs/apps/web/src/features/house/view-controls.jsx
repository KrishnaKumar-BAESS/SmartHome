import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';
import { Segmented } from './segmented';

function ToggleRow({ row, icon }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      className="ia opt-row"
      aria-pressed={row.on}
    >
      <Icon name={icon} size={14} />
      <span className="grow">{row.label}</span>
      <span className="switch" aria-hidden="true"></span>
    </button>
  );
}

function ActionRow({ row, icon }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      className="ia opt-row"
      title={row.hint}
    >
      <Icon name={icon} size={14} />
      <span className="grow">{row.label}</span>
      {row.hint ? <span className="hint">{row.hint}</span> : null}
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
      className={`dock-drawer ${exiting ? 'float-out' : 'float-in'}`}
      style={css(o.drawerStyle)}
      role="group"
      aria-label="View options"
    >
      <div className="section-label">Floors</div>
      <Segmented items={view.explodeBtns} label="Floor separation" />
      <div className="section-label">Camera</div>
      <div
        className="chips"
        style={{ marginBottom: 8 }}
        role="group"
        aria-label="Orientation presets"
      >
        {o.presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={p.onClick}
            className="ia chip"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div
        className="dock-nudge"
        role="group"
        aria-label="Rotate, tilt, and pan"
      >
        {o.nudge.map((n) => (
          <button
            key={n.key}
            type="button"
            onClick={n.onClick}
            className="ia icon-btn icon-btn--lg icon-btn--filled"
            aria-label={n.label}
            title={n.label}
          >
            <Icon name={n.icon} size={14} />
          </button>
        ))}
      </div>
      <div className="note" style={{ margin: '4px 4px 0' }}>
        {o.presetNote}
      </div>
      <div className="dock-divider"></div>
      <ActionRow row={o.resetRow} icon="reset" />
      <ActionRow row={o.fitRow} icon="expand" />
      <ActionRow row={o.resetAllRow} icon="cube" />
      <div className="dock-divider"></div>
      <ToggleRow row={o.autoRow} icon="rotateRight" />
      <ToggleRow row={o.labelsRow} icon="labels" />
      <ToggleRow row={o.legendRow} icon="legend" />
      <ToggleRow row={o.shortcutsRow} icon="list" />
      <div className="dock-divider"></div>
      <div className="section-label">Theme</div>
      <Segmented items={o.theme} label="Theme" />
    </div>
  );
}

export function ViewControls({ view }) {
  return (
    <div
      className="dock surface"
      style={css(view.ctrlClusterStyle)}
      data-popover="view"
      role="toolbar"
      aria-label="Model controls"
      aria-orientation="vertical"
    >
      {view.isNarrow ? (
        <div className="dock-panels">
          <button
            type="button"
            className="ia panel-toggle"
            onClick={view.toggleLeft}
            aria-pressed={!view.leftHidden}
            aria-controls="panel-left"
          >
            <Icon name="list" size={13} />
            {view.leftHidden ? 'List' : 'Hide list'}
          </button>
          <button
            type="button"
            className="ia panel-toggle"
            onClick={view.toggleRight}
            aria-pressed={!view.rightHidden}
            aria-controls="panel-right"
          >
            <Icon name="panel" size={13} />
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
      <div className="dock-bar">
        <button
          type="button"
          onClick={view.zoomOut}
          className="ia icon-btn icon-btn--lg"
          aria-label="Zoom out"
          title="Zoom out (−)"
          aria-disabled={view.atMin}
          disabled={view.atMin}
        >
          <Icon name="minus" size={14} />
        </button>
        <div
          className="dock-zoom"
          role="status"
          aria-live="polite"
          aria-label={`Zoom ${view.zoomPct}${view.atMin ? ', minimum' : view.atMax ? ', maximum' : ''}`}
        >
          {view.zoomPct}
        </div>
        <button
          type="button"
          onClick={view.zoomIn}
          className="ia icon-btn icon-btn--lg"
          aria-label="Zoom in"
          title="Zoom in (+)"
          aria-disabled={view.atMax}
          disabled={view.atMax}
        >
          <Icon name="plus" size={14} />
        </button>
        <div className="dock-sep" aria-hidden="true"></div>
        <button
          type="button"
          onClick={view.resetView}
          className="ia icon-btn icon-btn--lg"
          aria-label="Reset orientation"
          title="Reset orientation (0)"
        >
          <Icon name="reset" size={14} />
        </button>
        <button
          type="button"
          onClick={view.toggleViewOpts}
          className="ia icon-btn icon-btn--lg"
          aria-label="View options"
          title="View options"
          aria-expanded={view.viewOptsOpen}
          aria-controls="view-options"
        >
          <Icon name="sliders" size={15} />
        </button>
      </div>
    </div>
  );
}
