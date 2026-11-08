import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

export function SceneLegend({ view }) {
  const { mounted, exiting } = usePresence(!!view.showLegend);
  if (!mounted) return null;
  return (
    <div
      className={`legend surface ${exiting ? 'float-out' : 'float-in'}`}
      style={css(view.legendPanelStyle)}
      role="region"
      aria-label="Legend"
    >
      <div className="section-label">{view.legendTitle}</div>
      {(view.legendItems ?? []).map((l) => (
        <div className="legend-item" key={l.label}>
          <span
            className={[
              'dot',
              l.shape === 'sq' ? 'dot--sq' : '',
              l.diamond ? 'dot--diamond' : '',
              l.ring ? 'dot--ring' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ '--c': l.color }}
            aria-hidden="true"
          ></span>
          {l.label}
        </div>
      ))}
      {view.legendNote ? (
        <div className="note">
          <Icon name="info" size={12} />
          <span>{view.legendNote}</span>
        </div>
      ) : null}
    </div>
  );
}
