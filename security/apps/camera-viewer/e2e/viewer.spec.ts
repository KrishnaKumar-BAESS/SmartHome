import { expect, test } from '@playwright/test';

test('SmartHome Security embeds the real player and closes it with the panel', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/house/');
  const atlas = await page.request.get('/house/');
  const policy = atlas.headers()['content-security-policy'];
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toMatch(/script-src 'self' 'sha256-[^']+';/);
  const playerPage = await page.request.get('/?embedded=1');
  expect(playerPage.headers()['content-security-policy']).toContain(
    "frame-ancestors 'self'",
  );
  for (const path of [
    '/house/.env.local',
    '/house/package.json',
    '/house/..%2f..%2fAGENTS.md',
  ])
    expect((await page.request.get(path)).status()).toBe(404);
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  await page
    .getByRole('button', { name: '▦ Live cameras', exact: true })
    .click();
  const player = page.frameLocator('iframe[title="Live camera player"]');
  await expect(
    player.getByRole('button', { name: 'Import from phone' }),
  ).toBeVisible();
  await expect(player.locator('#frames')).toHaveText('0');
  await expect(player.locator('#playback')).toHaveText('Stopped');
  await page.getByRole('button', { name: 'Close live cameras' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '▦ Live cameras', exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test('explains setup without claiming a live feed', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Home cameras' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Connect', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('#playback')).toHaveText('Stopped');
  await expect(page.locator('#frames')).toHaveText('0');
  await expect(page.locator('#status')).toContainText('Configure verified');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('shows import errors and imported metadata without starting cloud signaling', async ({
  page,
}) => {
  await page.route('**/api/import', (route) =>
    route.fulfill({
      status: 400,
      json: { error: 'Connect one authorized ADB phone.' },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Import from phone' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Connect one authorized ADB phone.',
  );
  await page.unroute('**/api/import');
  await page.route('**/api/import', (route) =>
    route.fulfill({
      json: {
        cameras: [
          {
            id: 'AABBCCDDEEFF',
            label: 'Test camera',
            expires: Date.now() + 60_000,
          },
        ],
        configured: true,
      },
    }),
  );
  await page.getByRole('button', { name: 'Import from phone' }).click();
  await expect(page.getByRole('combobox', { name: 'Camera' })).toHaveValue(
    'AABBCCDDEEFF',
  );
  await expect(
    page.getByRole('button', { name: 'Connect', exact: true }),
  ).toBeEnabled();
  await expect(page.locator('#playback')).toHaveText('Stopped');
});
