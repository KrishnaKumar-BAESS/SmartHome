import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function DetailsToggle({ view }) {
  return (
    <>
      <div
        onClick={view.toggleRight}
        style={css(view.rightTabStyle)}
        role="button"
        tabIndex={0}
        onKeyDown={activateOnKey}
      >
        {view.rightTabChevron}
      </div>
    </>
  );
}
