/*
 * Offline shell for the installed home-docs app (HTTPS origins only; browsers
 * do not run service workers on plain-HTTP LAN addresses).
 *
 * - The page itself is fetched from the network first; the last good copy is
 *   used only when the network fails, so a deploy is picked up on next load.
 * - Hashed files under /assets/ never change, so they are served from cache.
 * - Everything else (Pi-hole stats, /healthz, the embedded camera player,
 *   other origins) is left to the network and never cached.
 *
 * Kill switch: replace this file with one that calls
 * `self.registration.unregister()` and deletes caches; browsers re-check
 * /sw.js on every navigation because it is served with no-cache.
 */
const CACHE = 'house-docs-v1';
const SHELL = new URL('./', self.registration.scope).href;
const MAX_ASSETS = 60;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trim(cache) {
  const keys = (await cache.keys()).filter((r) =>
    new URL(r.url).pathname.includes('/assets/'),
  );
  // Oldest entries first: drop what earlier releases left behind.
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - MAX_ASSETS))
      .map((r) => cache.delete(r)),
  );
}

async function page(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(SHELL, response.clone());
      void trim(cache);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(SHELL);
    if (cached) return cached;
    throw error;
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    if (url.searchParams.has('embedded')) return;
    if (url.pathname === '/' || url.pathname === '/index.html')
      event.respondWith(page(request));
    return;
  }
  if (
    url.pathname.startsWith('/assets/') &&
    !url.pathname.endsWith('.webmanifest')
  )
    event.respondWith(asset(request));
});
