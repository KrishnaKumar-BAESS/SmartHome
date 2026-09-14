import { css } from '../../lib/css';
import { Icon } from './icons';

export function DetailsToggle({ view }) {
  if (view.narrow) return null;
  const label = view.rightHidden
    ? 'Show the details panel'
    : 'Hide the details panel';
  return (
    <button
      id="toggle-right"
      type="button"
      className="ia panel-tab"
      onClick={view.toggleRight}
      style={css(view.rightTabStyle)}
      aria-label={label}
      title={label}
      aria-expanded={!view.rightHidden}
      aria-controls="panel-right"
    >
      <Icon
        name={view.rightHidden ? 'chevronLeft' : 'chevronRight'}
        size={14}
      />
    </button>
  );
}
