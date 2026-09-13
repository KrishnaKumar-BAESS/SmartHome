import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { extname, resolve, sep } from 'node:path';
import {
  readPhoneSessions,
  publicCamera,
  type CameraSession,
} from './sessions.js';
import { SignalingConnection } from './signaling.js';

interface AppOptions {
  port: number;
  webRoot: string;
  houseRoot?: string;
  allowedHosts: ReadonlySet<string>;
  names: Record<string, string>;
  readSessions?: () => Promise<CameraSession[]>;
}

export function isLocalRequest(request: IncomingMessage, port: number) {
  const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!allowed.includes(request.headers.host || '')) return false;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  if (
    request.method !== 'GET' &&
    !allowed.some((host) => request.headers.origin === `http://${host}`)
  )
    return false;
  return true;
}

async function body(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new Error('JSON is required.');
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 128_000) throw new Error('Request is too large.');
  }
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Invalid request.');
  return parsed;
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}

export function createViewerServer(options: AppOptions) {
  let cameras: CameraSession[] = [];
  let importing = false;
  const streams = new Map<
    string,
    {
      camera: CameraSession;
      connection?: SignalingConnection;
      response?: ServerResponse;
      expiry: ReturnType<typeof setTimeout>;
    }
  >();
  function stop(id: string) {
    const stream = streams.get(id);
    if (!stream) return;
    streams.delete(id);
    clearTimeout(stream.expiry);
    stream.connection?.close();
    stream.response?.end();
  }
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; connect-src 'self'; media-src 'self' blob:; style-src 'self'; script-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'",
    );
    if (!isLocalRequest(request, options.port))
      return json(response, 403, {
        error: 'Only local, same-origin requests are accepted.',
      });
    const url = new URL(request.url || '/', `http://127.0.0.1:${options.port}`);
    try {
      if (request.method === 'GET' && url.pathname === '/api/cameras') {
        return json(response, 200, {
          cameras: cameras.map(publicCamera),
          configured: options.allowedHosts.size > 0,
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/import') {
        await body(request);
        if (importing)
          return json(response, 409, {
            error: 'A phone import is already running.',
          });
        importing = true;
        try {
          cameras = await (options.readSessions?.() ||
            readPhoneSessions(options.allowedHosts, options.names));
          return json(response, 200, {
            cameras: cameras.map(publicCamera),
            configured: options.allowedHosts.size > 0,
          });
        } finally {
          importing = false;
        }
      }
      if (request.method === 'POST' && url.pathname === '/api/sessions') {
        const data = await body(request);
        const camera = cameras.find((camera) => camera.camera === data.camera);
        if (!camera)
          return json(response, 404, {
            error: 'Import a camera session first.',
          });
        if (camera.expires <= Date.now() + 5000)
          return json(response, 409, {
            error:
              'Viewing token expired. Open Xfinity and import a fresh session.',
          });
        if (streams.size >= 3)
          return json(response, 409, {
            error: 'Stop an existing viewer before opening another.',
          });
        const id = randomUUID();
        streams.set(id, { camera, expiry: setTimeout(() => stop(id), 20_000) });
        return json(response, 201, { id });
      }
      const match = url.pathname.match(
        /^\/api\/sessions\/([a-f0-9-]{36})\/(events|signal|stop)$/,
      );
      if (match) {
        const [, id, action] = match;
        const stream = streams.get(id);
        if (!stream)
          return json(response, 404, { error: 'Viewing session is closed.' });
        if (request.method === 'GET' && action === 'events') {
          if (stream.connection)
            return json(response, 409, {
              error: 'This session already has a viewer.',
            });
          clearTimeout(stream.expiry);
          response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
          });
          response.write(': connected\n\n');
          stream.response = response;
          const keepAlive = setInterval(
            () => response.write(': keepalive\n\n'),
            15_000,
          );
          stream.connection = new SignalingConnection(
            stream.camera,
            options.allowedHosts,
            (event) => {
              if (!response.destroyed)
                response.write(`data: ${JSON.stringify(event)}\n\n`);
            },
          );
          response.on('close', () => {
            clearInterval(keepAlive);
            stop(id);
          });
          void stream.connection.connect().catch(() => {
            if (!response.destroyed)
              response.write(
                `data: ${JSON.stringify({ kind: 'error', message: 'Could not start the viewing session.' })}\n\n`,
              );
            stop(id);
          });
          return;
        }
        if (request.method === 'POST' && action === 'signal') {
          const data = await body(request);
          if (!stream.connection)
            throw new Error('The viewer is not connected.');
          stream.connection.send(String(data.type), data.payload);
          return json(response, 200, { ok: true });
        }
        if (request.method === 'POST' && action === 'stop') {
          await body(request);
          stop(id);
          return json(response, 200, { ok: true });
        }
      }
      if (url.pathname.startsWith('/api/'))
        return json(response, 404, { error: 'Not found.' });
      if (request.method !== 'GET')
        return json(response, 405, { error: 'Method not allowed.' });
      if (url.pathname === '/house') {
        response.writeHead(302, { Location: '/house/' });
        response.end();
        return;
      }
      const isHouse = url.pathname.startsWith('/house/');
      if (isHouse && !options.houseRoot)
        return json(response, 404, {
          error: 'Build the SmartHome atlas first.',
        });
      const root = resolve(isHouse ? options.houseRoot! : options.webRoot);
      const assetPath = isHouse
        ? url.pathname.slice('/house'.length)
        : url.pathname;
      const path = resolve(
        root,
        `.${decodeURIComponent(assetPath === '/' ? '/index.html' : assetPath)}`,
      );
      if (!path.startsWith(root + sep))
        return json(response, 404, { error: 'Not found.' });
      const content = await readFile(path).catch(() => null);
      if (!content) return json(response, 404, { error: 'Not found.' });
      if (isHouse) {
        // Preserve the atlas's inline theme initializer without allowing arbitrary scripts.
        const hashes =
          extname(path) === '.html'
            ? [...content.toString().matchAll(/<script>([\s\S]*?)<\/script>/g)]
                .map(
                  (match) =>
                    `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`,
                )
                .join(' ')
            : '';
        response.setHeader(
          'Content-Security-Policy',
          `default-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' ${hashes}; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'`,
        );
      }
      const mime: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };
      response.writeHead(200, {
        'Content-Type': mime[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(content);
    } catch (error) {
      if (!response.headersSent)
        json(response, 400, {
          error:
            error instanceof Error && !error.message.includes('JSON')
              ? error.message
              : 'Invalid request.',
        });
      else response.end();
    }
  });
  return {
    server,
    close: () => {
      for (const id of streams.keys()) stop(id);
      server.close();
    },
  };
}
