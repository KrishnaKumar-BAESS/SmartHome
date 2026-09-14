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
  await player.getByText('Setup and troubleshooting', { exact: true }).click();
  await expect(
    player.getByRole('button', { name: 'Import from phone' }),
  ).toBeVisible();
  await expect(player.locator('#frames')).toHaveText('0');
  await expect(player.locator('#playback')).toHaveText('Stopped');
  // Focus is inside the player after expanding its details; Escape still closes.
  await page.keyboard.press('Escape');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '▦ Live cameras', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: '▦ Live cameras', exact: true })
    .click();
  await expect(player.locator('#live-label')).toHaveText('STANDBY');
  await page.getByRole('button', { name: 'Close ✕' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('explains setup without claiming a live feed', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Live cameras' }),
  ).toBeVisible();
  await expect(page.getByText('No cameras loaded.')).toBeVisible();
  await expect(page.locator('#live-label')).toHaveText('STANDBY');
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
  await page.getByText('Setup and troubleshooting', { exact: true }).click();
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
  const tile = page.getByRole('button', { name: 'Test camera' });
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  await expect(tile).toContainText('Expires');
  await expect(page.locator('#camera-name')).toHaveText('No camera selected');
  await expect(page.locator('#playback')).toHaveText('Stopped');
});

test('account cameras load without ADB and Stop cancels automatic reconnection', async ({
  page,
}) => {
  await page.clock.install();
  await page.route('**/api/account', (route) =>
    route.fulfill({ json: { configured: true, signedIn: true } }),
  );
  await page.route('**/api/cameras', (route) =>
    route.fulfill({
      json: {
        configured: true,
        renewable: true,
        cameras: [{ id: 'AABBCCDDEEFF', label: 'Front', renewable: true }],
      },
    }),
  );
  let starts = 0;
  let imports = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/import')) imports++;
  });
  await page.route('**/api/sessions', (route) => {
    starts++;
    return route.fulfill({ status: 201, json: { id: 'test-session' } });
  });
  await page.route('**/api/sessions/test-session/events', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"kind":"error","message":"Network interrupted."}\n\n',
    }),
  );
  await page.route('**/api/sessions/test-session/stop', (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.goto('/');
  await expect(page.locator('#account-status')).toContainText(
    'automatic renewal enabled',
  );
  const tile = page.getByRole('button', { name: 'Front' });
  await expect(tile).toContainText('Renews automatically');
  await tile.click();
  await expect(tile).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#camera-name')).toHaveText('Front');
  await expect(page.locator('#expiry')).toContainText(
    'No phone connection is required',
  );
  await expect(page.getByRole('status')).toContainText('Retrying in 2 seconds');
  await expect(page.locator('#live-label')).toHaveText('RETRYING');
  await page.clock.fastForward(2100);
  await expect.poll(() => starts).toBe(2);
  await expect(page.getByRole('status')).toContainText('Retrying in 4 seconds');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Viewer stopped.');
  await expect(page.locator('#live-label')).toHaveText('STANDBY');
  await page.clock.fastForward(35_000);
  expect(starts).toBe(2);
  expect(imports).toBe(0);
  await expect(page.locator('#playback')).toHaveText('Stopped');
});
