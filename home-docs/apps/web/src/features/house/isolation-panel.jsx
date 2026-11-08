import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';
import { Segmented } from './segmented';

/** Nonmodal disclosure: the model stays usable while it is open. */
export function IsolationPanel({ view }) {
  const { mounted, exiting } = usePresence(view.showIsoPanel);
  if (!mounted) return null;
  return (
    <section
      id="isolation-panel"
      className={`iso-panel surface-pop ${exiting ? 'float-out' : 'float-in'}`}
      style={css(view.isoPanelStyle)}
      aria-labelledby="isolation-title"
      data-popover="iso"
    >
      <div className="panel-head">
        <div className="panel-head-row">
          <h2 id="isolation-title" className="panel-title">
            Isolate
          </h2>
          <div>
            {view.isoActive ? (
              <button
                type="button"
                onClick={view.isoClear}
                className="ia link-button"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={view.closeIso}
              className="ia icon-btn"
              aria-label="Close isolate view"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        </div>
        <div className="panel-count" style={{ marginTop: 2 }}>
          {view.isoCountLabel}
        </div>
        <Segmented items={view.isoFloors ?? []} label="Floor" />
      </div>
      <div className="panel-body" style={{ padding: '4px 14px 16px' }}>
        {(view.isoRoomGroups ?? []).map((g) => (
          <div key={g.key}>
            <h3 className="iso-group">{g.label}</h3>
            <div className="chips" role="group" aria-label={`${g.label} rooms`}>
              {(g.rooms ?? []).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={r.onClick}
                  className="ia chip"
                  aria-pressed={r.on}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
