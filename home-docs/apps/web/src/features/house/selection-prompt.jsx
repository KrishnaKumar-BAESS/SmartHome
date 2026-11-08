import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';

/**
 * Centred over the free stage area. The entry animation runs on an inner
 * element so it cannot overwrite the outer centring transform.
 */
export function SelectionPrompt({ view }) {
  const open = view.showPrompt || view.showHint;
  const { mounted, exiting } = usePresence(open);
  if (!mounted) return null;
  const isHint = !view.showPrompt && view.showHint;
  return (
    <div
      className="hint-wrap"
      style={css(view.promptStyle)}
      data-exiting={exiting || undefined}
    >
      <div
        className={`hint surface ${isHint ? '' : 'hint--prompt '}${exiting ? 'float-out' : 'float-in'}`}
        role={isHint ? 'note' : undefined}
      >
        {isHint ? (
          <>
            <span>{view.hintText}</span>
            <button
              type="button"
              className="ia chip-button"
              onClick={view.dismissHint}
              aria-label="Dismiss the getting-started hint"
            >
              Got it
            </button>
          </>
        ) : (
          <span>{view.promptText}</span>
        )}
      </div>
    </div>
  );
}
