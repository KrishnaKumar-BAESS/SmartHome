import { expect, test } from '@playwright/test';

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
