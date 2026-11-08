import { useRef, type MouseEvent } from 'react';
import { useIndicator } from '../../lib/use-indicator';

export type SegmentItem = {
  key: string;
  label: string;
  on: boolean;
  onClick: (e?: MouseEvent<HTMLButtonElement>) => void;
};

/** Mutually exclusive options with a thumb that slides to the active one. */
export function Segmented({
  items,
  label,
  className,
}: {
  items: SegmentItem[];
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = items.find((i) => i.on)?.key ?? null;
  const { rect, settled } = useIndicator(ref, active);
  return (
    <div
      ref={ref}
      className={className ? `seg ${className}` : 'seg'}
      role="group"
      aria-label={label}
    >
      {rect ? (
        <span
          className="seg-thumb"
          aria-hidden="true"
          style={{
            width: rect.w,
            height: rect.h,
            transform: `translate(${rect.x}px, ${rect.y}px)`,
            transition: settled ? undefined : 'none',
          }}
        />
      ) : null}
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="seg-btn"
          aria-pressed={item.on}
          data-active={item.on ? 'true' : undefined}
          onClick={(e) => item.onClick(e)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
