import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './motion';

/**
 * Keep an overlay mounted for `ms` after it closes so an exit transition can
 * play. Returns whether to render and whether the element is on its way out.
 */
export function usePresence(open: boolean, ms = 180) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (prefersReducedMotion()) {
      setMounted(false);
      return;
    }
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted: open || mounted, exiting: !open && mounted };
}
