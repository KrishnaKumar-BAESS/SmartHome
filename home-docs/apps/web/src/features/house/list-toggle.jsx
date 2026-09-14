import { css } from '../../lib/css';
import { Icon } from './icons';

export function ListToggle({ view }) {
  if (view.narrow) return null;
  const label = view.leftHidden
    ? 'Show the inventory list'
    : 'Hide the inventory list';
  return (
    <button
      id="toggle-left"
      type="button"
      className="ia panel-tab"
      onClick={view.toggleLeft}
      style={css(view.leftTabStyle)}
      aria-label={label}
      title={label}
      aria-expanded={!view.leftHidden}
      aria-controls="panel-left"
    >
      <Icon name={view.leftHidden ? 'chevronRight' : 'chevronLeft'} size={14} />
    </button>
  );
}
