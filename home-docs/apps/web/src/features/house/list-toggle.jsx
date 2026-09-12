import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function ListToggle({ view }) {
  return (
    <>
      <div
        onClick={view.toggleLeft}
        style={css(view.leftTabStyle)}
        role="button"
        tabIndex={0}
        onKeyDown={activateOnKey}
      >
        {view.leftTabChevron}
      </div>
    </>
  );
}
