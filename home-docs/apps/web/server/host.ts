import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';

const brotli = promisify(brotliCompress);
const gz = promisify(gzip);
import { isAllowedHousePeer } from './network-access.js';
import { createPiholeService } from './pihole-service.js';

export function createHouseServer(options: {
  root: string;
  host: string;
  port: number;
  piholeUrl: string;
  piholePassword: string;
}) {
  const stats = createPiholeService(options.piholeUrl, options.piholePassword);
  const root = resolve(options.root);
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
  };
  // Text assets are compressed once per file and encoding (off the event
  // loop), then reused; a release's files never change while it runs.
  const compressible = new Set([
    '.html',
    '.js',
    '.css',
    '.svg',
    '.webmanifest',
  ]);
  const encoded = new Map<string, Promise<Buffer>>();
  const encode = (file: string, data: Buffer, accept: string) => {
    if (!compressible.has(extname(file)) || data.length < 1024) return null;
    const enc = /\bbr\b/.test(accept)
      ? 'br'
      : /\bgzip\b/.test(accept)
        ? 'gzip'
        : null;
    if (!enc) return null;
    const key = `${enc}:${file}`;
    let body = encoded.get(key);
    if (!body) {
      body =
        enc === 'br'
          ? brotli(data, {
              params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
            })
          : gz(data, { level: 9 });
      encoded.set(key, body);
      // A failed compression is retried on the next request, not cached.
      body.catch(() => encoded.delete(key));
    }
    return { enc, body };
  };
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-store');
    // Tailnet peers are accepted only on the explicit Tailscale listener.
    if (
      !isAllowedHousePeer(req.socket.remoteAddress ?? '', options.host) ||
      req.headers.host !== `${options.host}:${options.port}`
    ) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method ?? '')) {
      res.setHeader('Allow', 'GET, HEAD');
      res.writeHead(405).end();
      return;
    }
    try {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (path === '/api/pihole/stats') {
        if (
          (req.headers.origin &&
            req.headers.origin !== `http://${req.headers.host}`) ||
          req.headers['sec-fetch-site'] === 'cross-site'
        ) {
          res.writeHead(403).end();
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(
          req.method === 'HEAD' ? undefined : JSON.stringify(await stats()),
        );
        return;
      }
      if (path === '/healthz') {
        res.setHeader('Content-Type', 'text/plain');
        res.end(req.method === 'HEAD' ? undefined : 'ok');
        return;
      }
      // Only the generated entry and assets are public; no repository or env fallback.
      if (
        path !== '/' &&
        path !== '/index.html' &&
        !/^\/assets\/[a-zA-Z0-9_.-]+$/.test(path)
      ) {
        res.writeHead(404).end('Not found');
        return;
      }
      const file = path === '/' ? 'index.html' : path.slice(1);
      const data = await readFile(resolve(root, file));
      res.setHeader(
        'Content-Type',
        types[extname(file)] ?? 'application/octet-stream',
      );
      res.setHeader(
        'Cache-Control',
        file.startsWith('assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      );
      res.setHeader('Vary', 'Accept-Encoding');
      const packed = encode(
        file,
        data,
        String(req.headers['accept-encoding'] ?? ''),
      );
      if (packed) res.setHeader('Content-Encoding', packed.enc);
      const body = packed ? await packed.body : data;
      res.setHeader('Content-Length', body.length);
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}
