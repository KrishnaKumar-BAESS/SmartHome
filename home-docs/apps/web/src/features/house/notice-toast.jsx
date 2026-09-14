import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

/** Short confirmations (isolation cleared, copied, hidden selection). */
export function NoticeToast({ view }) {
  const notice = view.notice;
  const { mounted, exiting } = usePresence(!!notice);
  if (!mounted) return null;
  const n = notice || view._lastNotice || {};
  const bottom = view.narrow ? view.layout.bottomPx + 60 : 74;
  return (
    <div
      role="status"
      className={exiting ? 'float-out' : 'float-in'}
      style={css(
        `position:absolute;left:0;right:0;margin:0 auto;width:fit-content;bottom:calc(${bottom}px + env(safe-area-inset-bottom));z-index:40;max-width:calc(100% - 32px);display:flex;align-items:center;gap:12px;padding:10px 12px 10px 14px;border-radius:12px;background:var(--popover);border:1px solid var(--lift-10);box-shadow:0 18px 44px -14px var(--shadow-2);color:var(--t1);font:500 12px 'Inter',system-ui,'Segoe UI',sans-serif`,
      )}
    >
      <span style={css('min-width:0')}>{n.text}</span>
      {n.action ? (
        <button
          type="button"
          className="ia chip-button"
          onClick={() => {
            n.action.onClick();
            view.dismissNotice();
          }}
        >
          {n.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="ia icon-button"
        onClick={view.dismissNotice}
        aria-label="Dismiss notice"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}
