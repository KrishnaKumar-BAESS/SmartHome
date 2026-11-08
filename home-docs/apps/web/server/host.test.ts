import { afterEach, describe, expect, it } from 'vitest';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { request, type Server } from 'node:http';
import { createHouseServer } from './host';
let server: Server;
let root: string;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (root) await rm(root, { recursive: true });
});
describe('LAN host', () => {
  it('serves built assets and summary setup while rejecting source paths, foreign hosts, origins and writes', async () => {
    root = await mkdtemp(join(tmpdir(), 'house-host-'));
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'index.html'), '<h1>In development</h1>');
    await writeFile(join(root, 'assets/app.js'), 'console.log("built")');
    await writeFile(join(root, '.env.local'), 'not public');
    const options = {
      root,
      host: '127.0.0.1',
      port: 0,
      piholeUrl: 'http://192.168.0.254',
      piholePassword: '',
    };
    server = createHouseServer(options);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    options.port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${options.port}`;
    expect(await (await fetch(base)).text()).toContain('In development');
    expect(
      (await fetch(`${base}/assets/app.js`)).headers.get('content-type'),
    ).toContain('javascript');
    for (const path of [
      '/.env.local',
      '/server/index.js',
      '/AGENTS.md',
      '/assets/%2e%2e%2f.env.local',
    ])
      expect((await fetch(base + path)).status).toBe(404);
    const rejectedHost = await new Promise<number | undefined>(
      (resolve, reject) => {
        const req = request(
          base,
          { headers: { Host: 'evil.example' } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        );
        req.on('error', reject);
        req.end();
      },
    );
    expect(rejectedHost).toBe(403);
    expect(
      (
        await fetch(`${base}/api/pihole/stats`, {
          headers: { Origin: 'https://evil.example' },
        })
      ).status,
    ).toBe(403);
    expect(
      (await fetch(`${base}/api/pihole/stats`, { method: 'POST' })).status,
    ).toBe(405);
    expect(
      await (await fetch(`${base}/api/pihole/stats`)).json(),
    ).toMatchObject({ state: 'setup' });
    expect(await (await fetch(`${base}/healthz`)).text()).toBe('ok');
  });
  it('compresses text assets for clients that accept it', async () => {
    root = await mkdtemp(join(tmpdir(), 'house-host-'));
    await mkdir(join(root, 'assets'));
    const js = `console.log(${JSON.stringify('x'.repeat(4000))});`;
    await writeFile(join(root, 'index.html'), '<h1>ok</h1>');
    await writeFile(join(root, 'assets/app.js'), js);
    await writeFile(join(root, 'assets/icon.png'), Buffer.alloc(4096));
    const options = {
      root,
      host: '127.0.0.1',
      port: 0,
      piholeUrl: 'http://192.168.0.254',
      piholePassword: '',
    };
    server = createHouseServer(options);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    options.port = (server.address() as AddressInfo).port;
    const get = (path: string, encoding: string) =>
      new Promise<{ headers: Record<string, unknown>; size: number }>(
        (done, fail) => {
          const req = request(
            `http://127.0.0.1:${options.port}${path}`,
            { headers: { 'Accept-Encoding': encoding } },
            (response) => {
              let size = 0;
              response.on('data', (chunk: Buffer) => (size += chunk.length));
              response.on('end', () =>
                done({ headers: response.headers, size }),
              );
            },
          );
          req.on('error', fail);
          req.end();
        },
      );
    const br = await get('/assets/app.js', 'gzip, deflate, br');
    expect(br.headers['content-encoding']).toBe('br');
    expect(br.headers.vary).toBe('Accept-Encoding');
    expect(br.size).toBeLessThan(js.length / 10);
    const gz = await get('/assets/app.js', 'gzip');
    expect(gz.headers['content-encoding']).toBe('gzip');
    const plain = await get('/assets/app.js', 'identity');
    expect(plain.headers['content-encoding']).toBeUndefined();
    expect(plain.size).toBe(js.length);
    const png = await get('/assets/icon.png', 'br');
    expect(png.headers['content-encoding']).toBeUndefined();
  });
});
