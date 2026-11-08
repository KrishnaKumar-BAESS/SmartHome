/**
 * Offline support for the installed app. Service workers only run on secure
 * origins (the private HTTPS hostnames), never on plain-HTTP LAN addresses,
 * local development, or the embedded camera player.
 */
const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);

export function offlineCapable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    !LOCAL.has(window.location.hostname) &&
    !new URLSearchParams(window.location.search).has('embedded')
  );
}

export function registerOffline(): void {
  if (!offlineCapable()) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

/** True when this page came from the offline cache (the host is unreachable). */
export async function servedOffline(): Promise<boolean> {
  if (!offlineCapable() || !navigator.serviceWorker.controller) return false;
  try {
    const res = await fetch('./healthz', { cache: 'no-store' });
    return !res.ok;
  } catch {
    return true;
  }
}
