import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AgentKeys, loadAdminToken } from './agent-keys.js';

let directory: string;
let path: string;
let keys: AgentKeys;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'smarthome-agent-'));
  path = join(directory, 'keys.local');
  keys = new AgentKeys(path);
  await keys.load();
});
afterEach(async () => {
  vi.useRealTimers();
  await rm(directory, { recursive: true, force: true });
});

it('stores only hashes, preserves metadata across restart, and never reactivates revoked keys', async () => {
  const { key, token } = await keys.create({
    name: 'Reader',
    scopes: ['data:read'],
  });
  expect(token).toMatch(/^shk_[A-Za-z0-9_-]{43}$/);
  expect(await readFile(path, 'utf8')).not.toContain(token);
  expect(JSON.stringify(keys.list())).not.toContain('hash');
  expect(keys.authorize(token, 'data:read').id).toBe(key.id);
  expect(() => keys.authorize(token, 'view:write')).toThrow(
    'Requires view:write',
  );
  await keys.used(key.id);
  const restarted = new AgentKeys(path);
  await restarted.load();
  expect(restarted.authorize(token).lastUsedAt).toBeTruthy();
  await restarted.update(key.id, {
    name: 'Controller',
    scopes: ['view:write'],
  });
  expect(() => restarted.authorize(token, 'data:read')).toThrow(
    'Requires data:read',
  );
  await restarted.revoke(key.id);
  expect(() => restarted.authorize(token)).toThrow('revoked');
  await expect(
    restarted.update(key.id, { name: 'Return', scopes: ['data:read'] }),
  ).rejects.toThrow('cannot be reactivated');
  const again = new AgentKeys(path);
  await again.load();
  expect(() => again.authorize(token)).toThrow('revoked');
});
it('enforces expiry and validates permissions before writing', async () => {
  const created = await keys.create({
    name: 'Short lived',
    scopes: ['view:read'],
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  });
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 2000);
  expect(() => keys.authorize(created.token)).toThrow('expired');
  expect(() => keys.create({ name: 'Invalid', scopes: ['admin'] })).toThrow(
    'permission',
  );
  expect(() => keys.create({ name: 'Invalid', scopes: [] })).toThrow(
    'permission',
  );
  expect(() =>
    keys.create({
      name: 'Invalid',
      scopes: ['data:read'],
      expiresAt: 'yesterday',
    }),
  ).toThrow('Expiry');
  expect(keys.list()).toHaveLength(1);
});
it('serializes concurrent changes and persists a separate operator bootstrap token', async () => {
  const results = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      keys.create({ name: `Key ${i}`, scopes: ['data:read'] }),
    ),
  );
  await Promise.all(results.map(({ key }) => keys.revoke(key.id)));
  const restarted = new AgentKeys(path);
  await restarted.load();
  expect(restarted.list()).toHaveLength(6);
  expect(restarted.list().every((key) => key.revokedAt)).toBe(true);
  const adminFile = join(directory, 'admin.local');
  const admin = await loadAdminToken(adminFile);
  expect(await loadAdminToken(adminFile)).toBe(admin);
  expect(() => restarted.authorize(admin)).toThrow('invalid');
});
