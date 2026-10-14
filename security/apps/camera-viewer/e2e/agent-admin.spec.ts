import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('admin creates, edits and revokes a scoped key that controls the connected atlas', async ({
  page,
  context,
  request,
}, testInfo) => {
  const token = (
    await readFile('test-results/agent-state/agent-admin.local', 'utf8')
  ).trim();
  await page.goto('/admin.html');
  await page.getByLabel('Administrator token').fill(token);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Create key', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Create key', exact: true }).click();
  const name = `Test agent ${testInfo.project.name}`;
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Create key', exact: true })
    .click();
  const secret = page.getByLabel('New API key');
  await expect(secret).toHaveValue(/^shk_/);
  const key = await secret.inputValue();
  const headers = { Authorization: `Bearer ${key}` };
  const atlas = await context.newPage();
  await atlas.goto('/house/');
  await expect(atlas.locator('html')).toHaveAttribute(
    'data-agent-tab',
    /^[a-f0-9-]{36}$/,
  );
  const tabId = await atlas.locator('html').getAttribute('data-agent-tab');
  const call = (method: string, args: unknown[]) =>
    request.post(`/api/agent/v1/tabs/${tabId}/call`, {
      headers,
      data: { method, args },
    });
  const query = await call('query', [
    { kind: 'camera', text: 'Front Doorbell' },
  ]);
  expect(query.status()).toBe(200);
  expect((await query.json()).result.records[0].data.name).toBe(
    'Front Doorbell',
  );
  const command = { type: 'record.select', kind: 'camera', id: 'c1' };
  expect((await call('execute', [command])).status()).toBe(403);
  expect((await call('getState', [])).status()).toBe(403);
  expect(
    (await request.get('/api/agent/admin/keys', { headers })).status(),
  ).toBe(401);

  await page
    .getByRole('button', { name: `Manage ${name}`, exact: true })
    .click();
  await page.getByLabel('Read view', { exact: true }).check();
  await page.getByLabel('Control view', { exact: true }).check();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const selected = await call('execute', [command]);
  expect(selected.status()).toBe(200);
  expect((await selected.json()).result.view.selection).toEqual({
    kind: 'camera',
    id: 'c1',
  });
  await expect(
    atlas.getByRole('heading', { name: 'Front Doorbell', exact: true }),
  ).toBeVisible();
  expect((await call('getState', [])).status()).toBe(200);

  // Remove read permissions while retaining control; command results must not leak state.
  await page
    .getByRole('button', { name: `Manage ${name}`, exact: true })
    .click();
  await page.getByLabel('Read inventory', { exact: true }).uncheck();
  await page.getByLabel('Read view', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await call('getData', [])).status()).toBe(403);
  expect(
    await (
      await call('execute', [{ type: 'view.set', view: { mode: 'climate' } }])
    ).json(),
  ).toEqual({ ok: true });
  await expect(
    atlas
      .getByRole('navigation', { name: 'Documentation views' })
      .getByRole('button', { name: 'Climate', exact: true }),
  ).toHaveAttribute('aria-current', 'page');

  await page
    .getByRole('button', { name: `Revoke ${name}`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Revoke key', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Revoked');
  expect((await call('execute', [command])).status()).toBe(401);
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText(
    'Revoked',
  );
  await expect(page.getByLabel('New API key')).not.toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('agent-console.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Administrator token')).toBeVisible();
  await expect(atlas.locator('html')).not.toHaveAttribute(
    'data-agent-tab',
    /.+/,
  );
  await atlas.close();
});
