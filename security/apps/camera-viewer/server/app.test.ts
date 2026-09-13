import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { once } from 'node:events';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createViewerServer } from './app.js';

let app: ReturnType<typeof createViewerServer>;
let base: string;
beforeEach(async () => {
  const options = {
    port: 0,
    webRoot: '/not-served',
    allowedHosts: new Set(['123.ssrouterprod.comcast.net']),
    names: {},
    readSessions: async () => [
      {
        camera: 'AABBCCDDEEFF',
        label: 'Test camera',
        room: '123',
        host: '123.ssrouterprod.comcast.net',
        token: 'private-test-token',
        streamName: 'stream2',
        expires: Date.now() + 60_000,
      },
    ],
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
});

describe('local server', () => {
  it('requires a matching Origin before importing phone credentials', async () => {
    const response = await fetch(`${base}/api/import`, {
      method: 'POST',
      headers: {
        Origin: 'https://untrusted.example',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
    expect((await (await fetch(`${base}/api/cameras`)).json()).cameras).toEqual(
      [],
    );
  });
  it('imports metadata while withholding tokens and supports stopping an unopened session', async () => {
    const post = (path: string, body: unknown) =>
      fetch(`${base}${path}`, {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const response = await post('/api/import', {});
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Test camera');
    expect(text).not.toContain('private-test-token');
    const opened = await post('/api/sessions', { camera: 'AABBCCDDEEFF' });
    const { id } = await opened.json();
    expect((await post(`/api/sessions/${id}/stop`, {})).status).toBe(200);
    expect((await fetch(`${base}/api/sessions/${id}/events`)).status).toBe(404);
  });
  it('does not serve repository files or accept a DNS-rebound host', async () => {
    expect((await fetch(`${base}/.env.local`)).status).toBe(404);
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(
        `${base}/api/cameras`,
        {
          headers: { Host: 'attacker.example' },
        },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      req.on('error', reject);
      req.end();
    });
    expect(status).toBe(403);
  });
});
