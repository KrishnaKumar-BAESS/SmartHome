import { useEffect, useState } from 'react';
import type { Status } from './watering-protocol';

/** Wall-clock milliseconds, ticking only while `active`. */
export function useNow(active: boolean, interval = 100) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [active, interval]);
  return now;
}

/** `12 s ago`, `3 min ago`. */
export function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

/**
 * Remaining time as of now, derived from the last report. The firmware
 * reports `remaining` at the moment it answered; the browser only counts
 * down from that anchor and never past zero.
 */
export function useCountdown(status: Status, observed: number, now: number) {
  // The longest remaining time seen in this state stands in for its length.
  const [peak, setPeak] = useState({
    state: status.state,
    max: status.remaining,
  });
  if (peak.state !== status.state)
    setPeak({ state: status.state, max: status.remaining });
  else if (status.remaining > peak.max)
    setPeak({ state: peak.state, max: status.remaining });
  const remaining = Math.max(0, status.remaining - (now - observed));
  const max = Math.max(peak.max, status.remaining);
  const progress = max > 0 ? 1 - remaining / max : 0;
  return { remaining, progress };
}
