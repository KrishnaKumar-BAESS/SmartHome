import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createViewerServer } from './app.js';
import { Account } from './account.js';
import { windowsCredentialStore } from './credential-store.js';
import { CameraAccount } from './camera-account.js';
import { AgentKeys, loadAdminToken } from './agent-keys.js';
import { AgentService } from './agent-service.js';

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
const account = process.env.XFINITY_CLIENT_SECRET
  ? new Account(
      process.env.XFINITY_CLIENT_SECRET,
      windowsCredentialStore(
        fileURLToPath(new URL('../../account.local', import.meta.url)),
      ),
    )
  : undefined;
await account?.load();
const agentStateDir =
  process.env.AGENT_STATE_DIR ||
  fileURLToPath(new URL('../../', import.meta.url));
const keys = new AgentKeys(resolve(agentStateDir, 'agent-keys.local'));
await keys.load();
const adminPath = resolve(agentStateDir, 'agent-admin.local');
const agentService = new AgentService(keys, await loadAdminToken(adminPath));
const app = createViewerServer({
  agentService,
  account,
  cameraAccount: account
    ? new CameraAccount(account, allowedHosts, names)
    : undefined,
  port,
  allowedHosts,
  names,
  webRoot: fileURLToPath(new URL('../web/', import.meta.url)),
  houseRoot: fileURLToPath(
    new URL('../../../../../home-docs/apps/web/dist/', import.meta.url),
  ),
});
app.server.listen(port, '127.0.0.1', () => {
  console.log(`Camera viewer: http://127.0.0.1:${port}`);
  console.log(
    `Agent admin: http://127.0.0.1:${port}/admin.html (administrator token in ${adminPath})`,
  );
});
// Keep the session renewable even when nobody has a camera panel open.
const renewal = setInterval(() => {
  if (account?.status().signedIn) void account.credentials().catch(() => {});
}, 60_000);
renewal.unref();
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    clearInterval(renewal);
    app.close();
  });
