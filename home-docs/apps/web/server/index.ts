import { fileURLToPath } from 'node:url';
import { createHouseServer } from './host.js';
const host = process.env.HOUSE_HOST || '127.0.0.1';
const port = Number(process.env.HOUSE_PORT || 8090);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid HOUSE_PORT');
if (!['127.0.0.1', '192.168.0.202'].includes(host))
  throw new Error('HOUSE_HOST must be loopback or the home server LAN address');
const server = createHouseServer({
  root:
    process.env.HOUSE_WEB_ROOT ||
    fileURLToPath(new URL('../../dist/', import.meta.url)),
  host,
  port,
  piholeUrl: process.env.PIHOLE_URL || 'http://192.168.0.254',
  piholePassword: process.env.PIHOLE_APP_PASSWORD || '',
});
const bind = process.env.HOUSE_BIND || host;
if (![host, '0.0.0.0'].includes(bind)) throw new Error('Invalid HOUSE_BIND');
server.listen(port, bind, () =>
  console.log(`SmartHome: http://${host}:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close();
    server.closeIdleConnections();
  });
