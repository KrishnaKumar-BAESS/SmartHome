import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';

/**
 * Centered over the free stage area. The entry animation runs on an inner
 * element so it cannot overwrite the outer centering transform.
 */
export function SelectionPrompt({ view }) {
  const open = view.showPrompt || view.showHint;
  const { mounted, exiting } = usePresence(open);
  if (!mounted) return null;
  const isHint = !view.showPrompt && view.showHint;
  return (
    <div style={css(view.promptStyle)} data-exiting={exiting || undefined}>
      <div
        className={exiting ? 'float-out' : undefined}
        style={css(view.promptInnerStyle)}
        role={isHint ? 'note' : undefined}
      >
        {isHint ? (
          <span style={css('display:inline-flex;align-items:center;gap:10px')}>
            <span>{view.hintText}</span>
            <button
              type="button"
              className="link-button"
              onClick={view.dismissHint}
              aria-label="Dismiss the getting-started hint"
            >
              Got it
            </button>
          </span>
        ) : (
          view.promptText
        )}
      </div>
    </div>
  );
}
