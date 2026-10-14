import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

// Server-only module: never import this from browser source.
export function createPiholeService(
  base: string,
  password: string,
  request = fetch,
) {
  const url = new URL(base);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('PIHOLE_URL must be an HTTP(S) origin without credentials');
  const origin = url.origin;
  let sid = '';
  let pending: Promise<unknown> | undefined;
  let cached: unknown;
  let cachedAt = 0;
  async function call(path: string, init: RequestInit = {}) {
    return request(`${origin}/api/${path}`, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
  }
  async function login() {
    const response = await call('auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) throw new Error('auth');
    const data = await response.json();
    if (!data.session?.valid || typeof data.session.sid !== 'string')
      throw new Error('auth');
    sid = data.session.sid;
  }
  async function read(path: string) {
    let response = await call(path, { headers: { sid } });
    if (response.status === 401) {
      sid = '';
      await login();
      response = await call(path, { headers: { sid } });
    }
    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'auth'
          : 'upstream',
      );
    return response.json();
  }
  async function refresh() {
    if (!password) return { state: 'setup', dashboardUrl: `${origin}/admin/` };
    try {
      if (!sid) await login();
      const stats = await read('stats/summary');
      const dns = await read('dns/blocking');
      const metrics = {
        queries: stats.queries?.total,
        blocked: stats.queries?.blocked,
        percentBlocked: stats.queries?.percent_blocked,
        clients: stats.clients?.active,
        domains: stats.gravity?.domains_being_blocked,
      };
      if (
        Object.values(metrics).some(
          (value) =>
            typeof value !== 'number' || !Number.isFinite(value) || value < 0,
        ) ||
        !['enabled', 'disabled', 'failed', 'unknown'].includes(dns.blocking)
      )
        throw new Error('upstream');
      return {
        state: 'ready',
        dashboardUrl: `${origin}/admin/`,
        observedAt: new Date().toISOString(),
        ...metrics,
        blocking: dns.blocking,
      };
    } catch (error) {
      return {
        state:
          error instanceof Error && error.message === 'auth'
            ? 'auth'
            : 'unavailable',
        dashboardUrl: `${origin}/admin/`,
      };
    }
  }
  return async () => {
    if (cached && Date.now() - cachedAt < 10000) return cached;
    if (!pending)
      pending = refresh()
        .then((result) => {
          cached = result;
          cachedAt = Date.now();
          return result;
        })
        .finally(() => {
          pending = undefined;
        });
    return pending;
  };
}

export function piholePlugin(base: string, password: string): Plugin {
  const stats = createPiholeService(base, password);
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (req.url?.split('?')[0] !== '/api/pihole/stats') return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    const host = req.headers.host ?? '';
    const local = /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host);
    if (
      !local ||
      (req.headers.origin && req.headers.origin !== `http://${host}`) ||
      req.headers['sec-fetch-site'] === 'cross-site'
    ) {
      res.writeHead(403).end('{"state":"forbidden"}');
      return;
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      res.writeHead(405).end('{}');
      return;
    }
    void stats()
      .then((data) => res.end(JSON.stringify(data)))
      .catch(() => {
        res.writeHead(502).end('{"state":"unavailable"}');
      });
  };
  return {
    name: 'smarthome-pihole',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
