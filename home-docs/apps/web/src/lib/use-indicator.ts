import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export type IndicatorRect = { x: number; y: number; w: number; h: number };

/**
 * Track the box of the container's `[data-active="true"]` child so a
 * single highlight element can slide between options. `settled` stays
 * false for the first frame so callers can place the highlight without
 * animating it in from the corner.
 */
export function useIndicator(
  container: RefObject<HTMLElement | null>,
  activeKey: unknown,
) {
  const [rect, setRect] = useState<IndicatorRect | null>(null);
  const [settled, setSettled] = useState(false);

  // Its own effect so StrictMode's double mount cannot cancel it for good.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[data-active="true"]');
      if (!el) {
        setRect(null);
        return;
      }
      setRect({
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [container, activeKey]);

  return { rect, settled };
}
