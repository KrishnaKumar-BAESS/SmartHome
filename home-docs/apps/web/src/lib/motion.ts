/** True when the user asked the platform to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export type TweenHandle = { cancel: () => void };

/**
 * Interpolate a set of numeric values over `duration` milliseconds.
 * Honors reduced motion by jumping straight to the target.
 */
export function tween(
  from: Record<string, number>,
  to: Record<string, number>,
  duration: number,
  apply: (values: Record<string, number>, done: boolean) => void,
): TweenHandle {
  const keys = Object.keys(to);
  const unchanged = keys.every((k) => Math.abs(to[k] - from[k]) < 1e-6);
  if (unchanged || prefersReducedMotion() || duration <= 0) {
    apply({ ...to }, true);
    return { cancel: () => {} };
  }
  const start = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const e = easeInOutCubic(p);
    const values: Record<string, number> = {};
    for (const k of keys) values[k] = from[k] + (to[k] - from[k]) * e;
    apply(values, p >= 1);
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return { cancel: () => cancelAnimationFrame(raf) };
}
