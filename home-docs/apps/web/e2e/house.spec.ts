import { expect, test } from '@playwright/test';

test('all eight documentation views work without external runtime requests', async ({
  page,
}) => {
  const failures: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173'))
      external.push(request.url());
  });
  await page.goto('/');
  await expect(
    page.getByRole('main', { name: 'Home documentation' }),
  ).toBeVisible();
  await expect(
    page.getByTestId('house-stage').locator('svg path').first(),
  ).toBeAttached();
  for (const mode of [
    'Overview',
    'Electrical',
    'Lighting',
    'Network',
    'Sound',
    'Security',
    'Climate',
    'Upkeep',
  ]) {
    const button = page
      .getByRole('navigation', { name: 'Documentation views' })
      .getByRole('button', { name: mode, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('house-stage').locator('svg')).toBeVisible();
  }
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('search locates a camera and its documented details', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Search home inventory' })
    .fill('Front Doorbell');
  await page
    .getByRole('button')
    .filter({ hasText: 'Front Doorbell' })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Security', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('textbox', { name: 'Search home inventory' }),
  ).toHaveValue('');
  await expect(
    page.getByText('Front Doorbell', { exact: true }).first(),
  ).toBeVisible();
});

test('keyboard navigation opens live cameras with static-host setup guidance', async ({
  page,
}) => {
  await page.goto('/');
  const security = page.getByRole('button', { name: 'Security', exact: true });
  await security.focus();
  await page.keyboard.press('Enter');
  await expect(security).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: '▦ Live cameras', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Open SmartHome with its local camera service',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close live cameras' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('model zoom changes projected floor geometry', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const stage = page.getByTestId('house-stage');
  const face = stage.locator('path').first();
  const before = await face.getAttribute('d');
  if (isMobile) {
    await page.getByRole('button', { name: 'Show model', exact: true }).click();
    await expect(page.getByRole('complementary').first()).not.toBeInViewport();
    await expect(page.getByRole('complementary').last()).not.toBeInViewport();
    await page.getByRole('button', { name: '+', exact: true }).click();
  } else {
    await stage.hover({ position: { x: 720, y: 500 } });
    await page.mouse.wheel(0, -150);
  }
  await expect(face).not.toHaveAttribute('d', before ?? '');
});

test('floor isolation and view controls preserve model interaction', async ({
  page,
}) => {
  await page.goto('/');
  const faces = page.getByTestId('house-stage').locator('svg path');
  const originalCount = await faces.count();
  await page.getByRole('button', { name: 'Isolate', exact: true }).click();
  await page.getByRole('button', { name: 'Basement', exact: true }).click();
  await expect.poll(() => faces.count()).toBeLessThan(originalCount);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(faces).toHaveCount(originalCount);
  await page.getByRole('button', { name: 'Isolate', exact: true }).click();
  await page.getByRole('button', { name: 'View options', exact: true }).click();
  const originalPath = await faces.first().getAttribute('d');
  await page.getByRole('button', { name: 'Stacked', exact: true }).click();
  await expect(faces.first()).not.toHaveAttribute('d', originalPath ?? '');
});
