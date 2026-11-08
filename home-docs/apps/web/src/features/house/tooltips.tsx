import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Tip = {
  text: string;
  kbd: string | null;
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'right' | 'left';
};

const DELAY = 420;
const WARM = 900; // after one tip closes, the next shows at once for a moment
const GAP = 8;

/** Single-line labels that ellipsize; hovering one shows its full text. */
const CLIPPED =
  '.row-title, .row-sub, .result-title, .result-sub, .group-head span, .feed-name';

function clippedText(el: Element | null): string | null {
  if (!el || el.hasAttribute('title')) return null;
  if (el.scrollWidth <= el.clientWidth + 1) return null;
  return el.textContent?.trim() || null;
}

/** The element whose tooltip a pointer at `target` should show. */
function tipTarget(target: Element | null): Element | null {
  const clipped = target?.closest?.(CLIPPED) ?? null;
  if (clipped && clippedText(clipped)) return clipped;
  return target?.closest?.('[data-tip]') ?? null;
}

function place(el: Element): Tip | null {
  const text = el.getAttribute('data-tip') ?? clippedText(el);
  if (!text) return null;
  const r = el.getBoundingClientRect();
  const want = el.getAttribute('data-tip-side');
  let side: Tip['side'] =
    want === 'right' || want === 'left' || want === 'top'
      ? want
      : r.bottom + 40 > window.innerHeight
        ? 'top'
        : 'bottom';
  if (side === 'right' && r.right + 160 > window.innerWidth) side = 'left';
  const pos =
    side === 'right'
      ? { x: r.right + GAP, y: r.top + r.height / 2 }
      : side === 'left'
        ? { x: r.left - GAP, y: r.top + r.height / 2 }
        : side === 'top'
          ? { x: r.left + r.width / 2, y: r.top - GAP }
          : { x: r.left + r.width / 2, y: r.bottom + GAP };
  return { text, kbd: el.getAttribute('data-tip-kbd'), side, ...pos };
}

/**
 * One delegated tooltip for every `[data-tip]` element: mouse hover after a
 * short delay, or keyboard focus. Truncated list labels show their full text
 * on mouse hover too. Touch never triggers it, so taps stay
 * clean. Accessible names still come from aria-label.
 */
export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef(0);
  const warmUntil = useRef(0);
  const current = useRef<Element | null>(null);

  useEffect(() => {
    const hide = () => {
      window.clearTimeout(timer.current);
      if (current.current) warmUntil.current = performance.now() + WARM;
      current.current = null;
      setTip(null);
    };
    const show = (el: Element, now: boolean) => {
      window.clearTimeout(timer.current);
      current.current = el;
      const go = () => {
        if (current.current === el && el.isConnected) setTip(place(el));
      };
      if (now || performance.now() < warmUntil.current) go();
      else timer.current = window.setTimeout(go, DELAY);
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = tipTarget(e.target as Element | null);
      if (el === current.current) return;
      if (el) show(el, false);
      else if (current.current) hide();
    };
    const focus = (e: FocusEvent) => {
      const el = e.target as Element | null;
      if (el?.matches?.('[data-tip]:focus-visible')) show(el, true);
    };
    const blur = (e: FocusEvent) => {
      if (e.target === current.current) hide();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);
    document.addEventListener('keydown', key, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', blur);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);

  if (!tip) return null;
  return <TipBubble tip={tip} />;
}

/** Positions itself, then nudges inside the viewport once measured. */
function TipBubble({ tip }: { tip: Tip }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    // Measure relative to the unshifted position of this tip.
    setShift((prev) => {
      const left = r.left - prev,
        right = r.right - prev;
      if (right > window.innerWidth - margin)
        return window.innerWidth - margin - right;
      if (left < margin) return margin - left;
      return 0;
    });
  }, [tip]);
  return (
    <div
      className="tooltip"
      data-side={tip.side}
      role="presentation"
      aria-hidden="true"
      ref={ref}
      style={{ left: tip.x + shift, top: tip.y }}
    >
      <span>{tip.text}</span>
      {tip.kbd ? <kbd>{tip.kbd}</kbd> : null}
    </div>
  );
}
