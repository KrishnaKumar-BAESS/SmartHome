import { fileURLToPath } from 'node:url';
import { createViewerServer } from './app.js';

const port = Number(process.env.PORT || 4318);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid PORT');
const allowedHosts = new Set(
  (process.env.XFINITY_SIGNALING_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean),
);
for (const host of allowedHosts)
  if (!/^\d{1,24}\.ssrouterprod\.comcast\.net$/.test(host))
    throw new Error('Invalid signaling host configuration');
const names = JSON.parse(process.env.CAMERA_NAMES || '{}') as Record<
  string,
  string
>;
if (Object.values(names).some((name) => typeof name !== 'string'))
  throw new Error('CAMERA_NAMES must map IDs to names');
const app = createViewerServer({
  port,
  allowedHosts,
  names,
  webRoot: fileURLToPath(new URL('../web/', import.meta.url)),
  houseRoot: fileURLToPath(
    new URL('../../../../../home-docs/apps/web/dist/', import.meta.url),
  ),
});
app.server.listen(port, '127.0.0.1', () =>
  console.log(`Camera viewer: http://127.0.0.1:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => app.close());
