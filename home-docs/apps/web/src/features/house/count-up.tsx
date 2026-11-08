import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/motion';

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Counts an integer up from zero when it first appears, then eases
 * between later values. Non-numeric text renders unchanged.
 */
export function CountUp({
  value,
  duration = 900,
}: {
  value: string | number;
  duration?: number;
}) {
  const target = Number(value);
  const numeric = Number.isFinite(target) && String(value).trim() !== '';
  const [shown, setShown] = useState(() =>
    numeric && !prefersReducedMotion() ? 0 : target,
  );
  const from = useRef(shown);

  useEffect(() => {
    if (!numeric) return;
    if (prefersReducedMotion()) {
      setShown(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const v = Math.round(origin + (target - origin) * easeOut(p));
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, numeric, duration]);

  if (!numeric) return <>{value}</>;
  return <>{shown}</>;
}
