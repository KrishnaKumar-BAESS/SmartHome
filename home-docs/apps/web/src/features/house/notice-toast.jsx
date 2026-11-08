import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

/** Short confirmations (isolation cleared, copied, hidden selection). */
export function NoticeToast({ view }) {
  const notice = view.notice;
  const { mounted, exiting } = usePresence(!!notice);
  if (!mounted) return null;
  const n = notice || view._lastNotice || {};
  const bottom = view.narrow ? view.layout.bottomPx + 64 : 80;
  return (
    <div
      role="status"
      className={`toast surface-pop ${exiting ? 'float-out' : 'float-in'}`}
      style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom))` }}
    >
      <span>{n.text}</span>
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
        className="ia icon-btn"
        style={{ borderRadius: '50%' }}
        onClick={view.dismissNotice}
        aria-label="Dismiss notice"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}
