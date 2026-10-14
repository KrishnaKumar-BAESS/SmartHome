import { fileURLToPath } from 'node:url';
import { createHouseServer } from './host.js';
import { isTailscaleAddress } from './network-access.js';
const host = process.env.HOUSE_HOST || '127.0.0.1';
const port = Number(process.env.HOUSE_PORT || 8090);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid HOUSE_PORT');
if (!['127.0.0.1', '192.168.0.202'].includes(host))
  throw new Error('HOUSE_HOST must be loopback or the home server LAN address');
const tailscaleHost = process.env.HOUSE_TAILSCALE_HOST || '';
if (tailscaleHost && !isTailscaleAddress(tailscaleHost))
  throw new Error('HOUSE_TAILSCALE_HOST must be a Tailscale IPv4 address');
const hosts = [...new Set([host, tailscaleHost].filter(Boolean))];
const servers = hosts.map((listener) => {
  const server = createHouseServer({
    root:
      process.env.HOUSE_WEB_ROOT ||
      fileURLToPath(new URL('../../dist/', import.meta.url)),
    host: listener,
    port,
    piholeUrl: process.env.PIHOLE_URL || 'http://192.168.0.254',
    piholePassword: process.env.PIHOLE_APP_PASSWORD || '',
  });
  server.listen(port, listener, () =>
    console.log(`SmartHome: http://${listener}:${port}`),
  );
  return server;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    for (const server of servers) {
      server.close();
      server.closeIdleConnections();
    }
  });
