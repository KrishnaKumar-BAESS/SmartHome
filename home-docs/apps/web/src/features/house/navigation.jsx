import { useEffect, useRef } from 'react';
import { useIndicator } from '../../lib/use-indicator';
import { ModeIcon } from './mode-icons';

const ORDER = [
  'overview',
  'electrical',
  'lighting',
  'network',
  'sound',
  'security',
  'climate',
  'upkeep',
];

export function Navigation({ view }) {
  const ref = useRef(null);
  const { rect, settled } = useIndicator(ref, `${view.mode}|${view.narrow}`);
  // The phone row scrolls sideways: keep the active view in sight.
  useEffect(() => {
    if (!view.narrow) return;
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [view.mode, view.narrow]);
  return (
    <nav
      ref={ref}
      aria-label="Documentation views"
      className={`nav-rail surface ${view.narrow ? 'nav-rail-row' : 'nav-rail--wide'}`}
    >
      {rect ? (
        <span
          className="nav-indicator"
          aria-hidden="true"
          style={{
            width: rect.w,
            height: rect.h,
            transform: `translate(${rect.x}px, ${rect.y}px)`,
            transition: settled ? undefined : 'none',
          }}
        />
      ) : null}
      {ORDER.map((key) => {
        const item = view.nav[key];
        return (
          <button
            key={key}
            onClick={item.onClick}
            type="button"
            className={item.active ? 'nav-button is-active' : 'nav-button'}
            aria-label={item.label}
            data-tip={view.narrow ? undefined : item.label}
            data-tip-kbd={item.kbd}
            data-tip-side="right"
            aria-pressed={item.active}
            aria-current={item.active ? 'page' : undefined}
            data-mode={key}
            data-active={item.active ? 'true' : undefined}
          >
            <ModeIcon mode={key} size={view.narrow ? 17 : 20} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
