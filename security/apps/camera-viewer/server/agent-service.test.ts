import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createViewerServer } from './app.js';
import { AgentKeys } from './agent-keys.js';
import { AgentService } from './agent-service.js';

let directory: string;
let base: string;
let keys: AgentKeys;
let app: ReturnType<typeof createViewerServer>;
const admin = 'test-operator-secret';
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'smarthome-agent-http-'));
  keys = new AgentKeys(join(directory, 'keys.local'));
  await keys.load();
  const options = {
    port: 0,
    webRoot: '/not-served',
    allowedHosts: new Set<string>(),
    names: {},
    agentService: new AgentService(keys, admin, 200),
  };
  app = createViewerServer(options);
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  options.port = (app.server.address() as AddressInfo).port;
  base = `http://127.0.0.1:${options.port}`;
});
afterEach(async () => {
  const closed = once(app.server, 'close');
  app.close();
  app.server.closeAllConnections();
  await closed;
  await rm(directory, { recursive: true, force: true });
});
async function login() {
  const response = await fetch(`${base}/api/agent/admin/login`, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: admin }),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('set-cookie')).toContain(
    'HttpOnly; SameSite=Strict',
  );
  return response.headers.get('set-cookie')!.split(';')[0];
}
it('separates administrator sessions from API keys and rejects cross-origin and credentialless management', async () => {
  expect((await fetch(`${base}/api/agent/admin/keys`)).status).toBe(401);
  const { token } = await keys.create({
    name: 'Agent',
    scopes: ['data:read', 'view:write'],
  });
  expect(
    (
      await fetch(`${base}/api/agent/admin/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status,
  ).toBe(401);
  expect((await fetch(`${base}/api/agent/v1/tabs`)).status).toBe(401);
  const cookie = await login();
  expect(await (await fetch(`${base}/api/agent/bridge/status`)).json()).toEqual(
    { ready: false },
  );
  expect(
    await (
      await fetch(`${base}/api/agent/bridge/status`, {
        headers: { Cookie: cookie },
      })
    ).json(),
  ).toEqual({ ready: true });
  expect(
    (
      await fetch(`${base}/api/agent/admin/keys`, {
        headers: { Cookie: cookie, Origin: 'https://example.com' },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fetch(`${base}/api/agent/admin/keys`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fetch(`${base}/api/agent/bridge/events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status,
  ).toBe(401);
  const list = await fetch(`${base}/api/agent/admin/keys`, {
    headers: { Cookie: cookie },
  });
  expect(list.status).toBe(200);
  expect(await list.text()).not.toContain(token);
});
it('checks scope before dispatch and fails closed when a tab is unavailable', async () => {
  const { token } = await keys.create({
    name: 'Reader',
    scopes: ['data:read'],
  });
  const call = (method: string, args: unknown[]) =>
    fetch(
      `${base}/api/agent/v1/tabs/00000000-0000-0000-0000-000000000000/call`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, args }),
      },
    );
  expect((await call('execute', [{ type: 'view.reset' }])).status).toBe(403);
  expect((await call('getState', [])).status).toBe(403);
  expect((await call('getData', [])).status).toBe(503);
  expect((await call('__proto__', [])).status).toBe(400);
});
it('forwards scoped calls to an authenticated tab and rejects outstanding calls when a key is revoked', async () => {
  const cookie = await login();
  const controller = new AbortController();
  const events = await fetch(`${base}/api/agent/bridge/events`, {
    headers: { Cookie: cookie },
    signal: controller.signal,
  });
  const reader = events.body!.getReader();
  const initial = new TextDecoder().decode((await reader.read()).value);
  const { tabId } = JSON.parse(initial.split('data: ')[1].trim()) as {
    tabId: string;
  };
  const { key, token } = await keys.create({
    name: 'Reader',
    scopes: ['data:read'],
  });
  const call = fetch(`${base}/api/agent/v1/tabs/${tabId}/call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ method: 'getData', args: [] }),
  });
  const delivered = new TextDecoder().decode((await reader.read()).value);
  expect(delivered).toContain('getData');
  const revoke = await fetch(`${base}/api/agent/admin/keys/${key.id}`, {
    method: 'DELETE',
    headers: { Origin: base, Cookie: cookie },
  });
  expect(revoke.status).toBe(200);
  expect((await call).status).toBe(401);
  expect(
    (
      await fetch(`${base}/api/agent/v1/tabs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status,
  ).toBe(401);
  controller.abort();
});
it('rate limits incorrect administrator tokens', async () => {
  for (let index = 0; index < 6; index++) {
    const response = await fetch(`${base}/api/agent/admin/login`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: '{"token":"wrong"}',
    });
    expect(response.status).toBe(index < 5 ? 401 : 429);
  }
});
