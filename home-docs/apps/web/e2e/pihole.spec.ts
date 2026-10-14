import { expect, test } from '@playwright/test';

test('Pi-hole stats preserve selection and open the full dashboard in a separate tab', async ({
  page,
  context,
}) => {
  let calls = 0;
  await page.route('**/api/pihole/stats', (route) => {
    calls++;
    return route.fulfill({
      json: {
        state: 'ready',
        dashboardUrl: 'http://192.168.0.254/admin/',
        observedAt: '2026-10-14T17:00:00Z',
        queries: 120,
        blocked: 30,
        percentBlocked: 25,
        clients: 4,
        domains: 900,
        blocking: 'enabled',
      },
    });
  });
  await context.route('http://192.168.0.254/admin/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<h1>Pi-hole dashboard test fixture</h1>',
    }),
  );
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'Search home inventory' })
    .fill('192.168.0.254');
  await page.getByRole('option').filter({ hasText: 'Pi-hole' }).first().click();
  const details = page.getByRole('complementary', { name: 'Network details' });
  const trigger = details.getByRole('button', {
    name: 'Pi-hole stats & dashboard',
  });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Pi-hole · DNS statistics' });
  await expect(dialog.getByText('120', { exact: true })).toBeVisible();
  await expect(dialog.getByText('25%', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Refresh stats' }).click();
  await expect.poll(() => calls).toBeGreaterThan(1);
  const popupPromise = page.waitForEvent('popup');
  await dialog.getByRole('link', { name: 'Open Pi-hole dashboard' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('http://192.168.0.254/admin/');
  await popup.close();
  await expect(dialog).toBeVisible();
  await page.screenshot({
    path: `/tmp/smarthome-pihole-${page.viewportSize()?.width}.png`,
  });
  await dialog.getByRole('button', { name: 'Back to SmartHome' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    details.getByRole('heading', { name: 'Pi-hole · pihole-pod' }),
  ).toBeVisible();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('Pi-hole setup and failure states do not invent statistics', async ({
  page,
}) => {
  let state = 'setup';
  await page.route('**/api/pihole/stats', (route) =>
    route.fulfill({
      json: { state, dashboardUrl: 'http://192.168.0.254/admin/' },
    }),
  );
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Documentation views' })
    .getByRole('button', { name: 'Network', exact: true })
    .click();
  const listButton = page.getByRole('button', { name: 'List', exact: true });
  if (await listButton.isVisible()) await listButton.click();
  await page
    .getByRole('button', { name: 'Pi-hole stats & dashboard' })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Connect your Pi-hole account')).toBeVisible();
  state = 'auth';
  await dialog.getByRole('button', { name: 'Refresh stats' }).click();
  await expect(
    dialog.getByText('Pi-hole sign-in needs attention'),
  ).toBeVisible();
  state = 'unavailable';
  await dialog.getByRole('button', { name: 'Refresh stats' }).click();
  await expect(
    dialog.getByText('Pi-hole stats are unavailable', { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('.pihole-metrics')).toHaveCount(0);
});

test('local Pi-hole bridge rejects foreign origins and writes', async ({
  request,
}) => {
  expect(
    (
      await request.get('/api/pihole/stats', {
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status(),
  ).toBe(403);
  expect((await request.post('/api/pihole/stats')).status()).toBe(405);
});
