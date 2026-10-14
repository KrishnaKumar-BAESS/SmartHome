import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AgentKeys, digest, HttpError, type Scope } from './agent-keys.js';

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}
async function body(
  request: IncomingMessage,
  maximum = 32_000,
): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new HttpError(400, 'INVALID_ARGUMENT', 'JSON is required.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk);
    if (size > maximum)
      throw new HttpError(413, 'TOO_LARGE', 'Request exceeds the size limit.');
    chunks.push(Buffer.from(chunk));
  }
  let data: unknown;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new HttpError(400, 'INVALID_ARGUMENT', 'Invalid JSON.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new HttpError(400, 'INVALID_ARGUMENT', 'Expected an object.');
  return data as Record<string, unknown>;
}
type Tab = {
  id: string;
  session: string;
  response: ServerResponse;
  connectedAt: string;
};
type Pending = {
  tab: string;
  key: string;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
const methods: Record<string, { scope: Scope; arguments: number }> = {
  describe: { scope: 'data:read', arguments: 0 },
  getData: { scope: 'data:read', arguments: 0 },
  query: { scope: 'data:read', arguments: 1 },
  getRecord: { scope: 'data:read', arguments: 2 },
  getState: { scope: 'view:read', arguments: 0 },
  execute: { scope: 'view:write', arguments: 1 },
};

export class AgentService {
  private sessions = new Map<string, number>();
  private tabs = new Map<string, Tab>();
  private pending = new Map<string, Pending>();
  private attempts: number[] = [];
  private adminHash: string;
  private maintenance: ReturnType<typeof setInterval>;
  constructor(
    private keys: AgentKeys,
    adminToken: string,
    private timeout = 10_000,
  ) {
    this.adminHash = digest(adminToken);
    this.maintenance = setInterval(() => {
      for (const [id, expires] of this.sessions)
        if (expires <= Date.now()) this.endSession(id);
    }, 15_000);
    this.maintenance.unref();
  }
  private session(request: IncomingMessage) {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('smarthome_admin='))
      ?.slice('smarthome_admin='.length);
    const id = cookie ? digest(cookie) : '';
    const expiry = this.sessions.get(id);
    if (!expiry || expiry <= Date.now()) {
      if (expiry) this.endSession(id);
      throw new HttpError(
        401,
        'ADMIN_REQUIRED',
        'Sign in to the local admin console.',
      );
    }
    return id;
  }
  private endSession(id: string) {
    this.sessions.delete(id);
    for (const tab of this.tabs.values())
      if (tab.session === id) this.closeTab(tab.id);
  }
  private closeTab(id: string) {
    const tab = this.tabs.get(id);
    this.tabs.delete(id);
    tab?.response.end();
    for (const [requestId, pending] of this.pending)
      if (pending.tab === id)
        this.finish(
          requestId,
          new HttpError(503, 'TAB_DISCONNECTED', 'Atlas tab disconnected.'),
        );
  }
  private finish(id: string, error?: Error, result?: unknown) {
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    if (error) pending.reject(error);
    else pending.resolve(result);
  }
  close() {
    clearInterval(this.maintenance);
    for (const id of this.tabs.keys()) this.closeTab(id);
    this.sessions.clear();
  }
  async handle(
    request: IncomingMessage,
    response: ServerResponse,
    port: number,
  ): Promise<boolean> {
    let url: URL;
    try {
      url = new URL(request.url || '/', 'http://localhost');
    } catch {
      json(response, 400, {
        error: { code: 'INVALID_ARGUMENT', message: 'Invalid request URL.' },
      });
      return true;
    }
    if (!url.pathname.startsWith('/api/agent/')) return false;
    try {
      const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
      const origin = request.headers.origin;
      if (
        !hosts.includes(request.headers.host || '') ||
        request.headers['sec-fetch-site'] === 'cross-site' ||
        (origin !== undefined &&
          !hosts.some((host) => origin === `http://${host}`))
      )
        throw new HttpError(
          403,
          'LOCAL_ONLY',
          'Only local, same-origin requests are accepted.',
        );
      const path = url.pathname.slice('/api/agent'.length);
      const isProgram = path.startsWith('/v1/');
      if (
        !isProgram &&
        request.method !== 'GET' &&
        origin !== `http://${request.headers.host}`
      )
        throw new HttpError(
          403,
          'ORIGIN_REQUIRED',
          'A matching Origin is required.',
        );

      if (path === '/admin/login' && request.method === 'POST') {
        this.attempts = this.attempts.filter(
          (time) => time > Date.now() - 60_000,
        );
        if (this.attempts.length >= 5)
          throw new HttpError(
            429,
            'RATE_LIMITED',
            'Too many sign-in attempts. Try again in one minute.',
          );
        const input = await body(request);
        if (
          typeof input.token !== 'string' ||
          digest(input.token) !== this.adminHash
        ) {
          this.attempts.push(Date.now());
          throw new HttpError(
            401,
            'INVALID_ADMIN',
            'Administrator token is incorrect.',
          );
        }
        if (this.sessions.size >= 20)
          throw new HttpError(
            429,
            'SESSION_LIMIT',
            'Too many administrator sessions. Restart the service to clear them.',
          );
        const token = randomBytes(32).toString('base64url');
        this.sessions.set(digest(token), Date.now() + 8 * 60 * 60 * 1000);
        response.setHeader(
          'Set-Cookie',
          `smarthome_admin=${token}; HttpOnly; SameSite=Strict; Path=/api/agent; Max-Age=28800`,
        );
        json(response, 200, { ok: true });
        return true;
      }

      if (path === '/bridge/status' && request.method === 'GET') {
        let ready = false;
        try {
          this.session(request);
          ready = true;
        } catch {
          /* Not signed in yet. */
        }
        json(response, 200, { ready });
        return true;
      }
      if (!isProgram) {
        const session = this.session(request);
        if (path === '/admin/logout' && request.method === 'POST') {
          this.endSession(session);
          response.setHeader(
            'Set-Cookie',
            'smarthome_admin=; HttpOnly; SameSite=Strict; Path=/api/agent; Max-Age=0',
          );
          json(response, 200, { ok: true });
        } else if (path === '/admin/keys' && request.method === 'GET') {
          json(response, 200, {
            keys: this.keys.list(),
            tabs: [...this.tabs.values()].map(({ id, connectedAt }) => ({
              id,
              connectedAt,
            })),
          });
        } else if (path === '/admin/keys' && request.method === 'POST') {
          json(response, 201, await this.keys.create(await body(request)));
        } else if (
          /^\/admin\/keys\/[a-f0-9-]{36}$/.test(path) &&
          request.method === 'PATCH'
        ) {
          const id = path.split('/').at(-1)!;
          const key = await this.keys.update(id, await body(request));
          this.cancelKey(id);
          json(response, 200, { key });
        } else if (
          /^\/admin\/keys\/[a-f0-9-]{36}$/.test(path) &&
          request.method === 'DELETE'
        ) {
          const id = path.split('/').at(-1)!;
          const key = await this.keys.revoke(id);
          this.cancelKey(id);
          json(response, 200, { key });
        } else if (path === '/bridge/events' && request.method === 'GET') {
          if (this.tabs.size >= 20)
            throw new HttpError(
              429,
              'TAB_LIMIT',
              'Too many connected atlas tabs.',
            );
          const id = randomUUID();
          response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
          });
          this.tabs.set(id, {
            id,
            session,
            response,
            connectedAt: new Date().toISOString(),
          });
          response.write(
            `event: ready\ndata: ${JSON.stringify({ tabId: id })}\n\n`,
          );
          const keepAlive = setInterval(
            () => response.write(': keepalive\n\n'),
            15_000,
          );
          response.on('close', () => {
            clearInterval(keepAlive);
            this.closeTab(id);
          });
        } else if (path === '/bridge/reply' && request.method === 'POST') {
          const input = await body(request, 2_000_000);
          const pending =
            typeof input.id === 'string'
              ? this.pending.get(input.id)
              : undefined;
          const tab = pending ? this.tabs.get(pending.tab) : undefined;
          if (!pending || tab?.session !== session || tab.id !== input.tabId)
            throw new HttpError(
              404,
              'NOT_FOUND',
              'Request is no longer pending.',
            );
          if (input.ok === true)
            this.finish(input.id as string, undefined, input.result);
          else {
            const error = input.error as
              { code?: string; message?: string } | undefined;
            const codes = ['INVALID_ARGUMENT', 'NOT_FOUND', 'UNAVAILABLE'];
            this.finish(
              input.id as string,
              new HttpError(
                error?.code === 'NOT_FOUND'
                  ? 404
                  : error?.code === 'UNAVAILABLE'
                    ? 503
                    : 400,
                codes.includes(error?.code ?? '')
                  ? error!.code!
                  : 'COMMAND_FAILED',
                typeof error?.message === 'string'
                  ? error.message.slice(0, 500)
                  : 'Atlas request failed.',
              ),
            );
          }
          json(response, 200, { ok: true });
        } else throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.');
        return true;
      }

      const bearer = request.headers.authorization;
      if (!bearer?.startsWith('Bearer '))
        throw new HttpError(
          401,
          'KEY_REQUIRED',
          'Supply an API key in Authorization: Bearer.',
        );
      const token = bearer.slice(7);
      const key = this.keys.authorize(token);
      if (path === '/v1/tabs' && request.method === 'GET') {
        await this.keys.used(key.id);
        this.keys.authorize(token);
        json(response, 200, {
          tabs: [...this.tabs.values()].map(({ id, connectedAt }) => ({
            id,
            connectedAt,
          })),
        });
        return true;
      }
      const match = path.match(/^\/v1\/tabs\/([a-f0-9-]{36})\/call$/);
      if (!match || request.method !== 'POST')
        throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.');
      const input = await body(request);
      if (
        typeof input.method !== 'string' ||
        !Object.hasOwn(methods, input.method)
      )
        throw new HttpError(400, 'INVALID_ARGUMENT', 'Unknown method.');
      const method = methods[input.method];
      const args = input.args ?? [];
      if (!Array.isArray(args) || args.length !== method.arguments)
        throw new HttpError(
          400,
          'INVALID_ARGUMENT',
          `Expected ${method.arguments} arguments.`,
        );
      this.keys.authorize(token, method.scope);
      const tab = this.tabs.get(match[1]);
      if (!tab || (this.sessions.get(tab.session) ?? 0) <= Date.now())
        throw new HttpError(
          503,
          'TAB_UNAVAILABLE',
          'Open the atlas after signing in to the admin console.',
        );
      if (this.pending.size >= 100)
        throw new HttpError(429, 'BUSY', 'Too many pending requests.');
      await this.keys.used(key.id);
      this.keys.authorize(token, method.scope);
      if (this.tabs.get(tab.id) !== tab)
        throw new HttpError(503, 'TAB_DISCONNECTED', 'Atlas tab disconnected.');
      const result = await new Promise<unknown>((resolve, reject) => {
        const id = randomUUID();
        const timer = setTimeout(
          () =>
            this.finish(
              id,
              new HttpError(
                504,
                'TIMEOUT',
                'Atlas did not reply in time. A command may already have executed; inspect state before retrying.',
              ),
            ),
          this.timeout,
        );
        this.pending.set(id, {
          tab: tab.id,
          key: key.id,
          resolve,
          reject,
          timer,
        });
        tab.response.write(
          `data: ${JSON.stringify({ id, method: input.method, args })}\n\n`,
        );
      });
      this.keys.authorize(token, method.scope);
      // Write-only keys acknowledge changes without returning view state.
      json(
        response,
        200,
        input.method === 'execute' &&
          !this.keys.authorize(token).scopes.includes('view:read')
          ? { ok: true }
          : { result },
      );
    } catch (error) {
      if (!response.headersSent)
        json(response, error instanceof HttpError ? error.status : 500, {
          error: {
            code: error instanceof HttpError ? error.code : 'INTERNAL_ERROR',
            message:
              error instanceof HttpError
                ? error.message
                : 'The local service could not complete the request.',
          },
        });
      else response.end();
    }
    return true;
  }
  private cancelKey(id: string) {
    for (const [requestId, pending] of this.pending)
      if (pending.key === id)
        this.finish(
          requestId,
          new HttpError(
            401,
            'KEY_CHANGED',
            'API key was revoked or its permissions changed.',
          ),
        );
  }
}
