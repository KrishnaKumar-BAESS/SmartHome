import { expect, test, type Page } from '@playwright/test';

const search = (page: Page) =>
  page.getByRole('combobox', { name: 'Search home inventory' });
const navButton = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'Documentation views' })
    .getByRole('button', { name, exact: true });

test('single-finger rotation continues after capture moves from SVG to stage', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const stage = page.getByTestId('house-stage');
  const svg = stage.locator('svg');
  await expect(svg.locator('path').first()).toBeAttached();
  const point = await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    for (let y = rect.top + 100; y < rect.bottom - 100; y += 20) {
      for (let x = rect.left + 100; x < rect.right - 100; x += 20) {
        if (document.elementFromPoint(x, y) instanceof SVGElement)
          return { x, y };
      }
    }
    throw new Error('No exposed SVG touch target');
  });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...point, id: 1 }],
  });
  const before = await svg.innerHTML();
  for (const offset of [20, 40, 60]) {
    const previous = await svg.innerHTML();
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: point.x + offset, y: point.y + offset, id: 1 }],
    });
    await expect.poll(() => svg.innerHTML()).not.toBe(previous);
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(await svg.innerHTML()).not.toBe(before);
  await expect(stage).toHaveCSS('cursor', 'grab');
  await session.detach();
});

test('all eight documentation views work without external runtime requests', async ({
  page,
}) => {
  const failures: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173'))
      external.push(request.url());
  });
  await page.goto('/');
  await expect(
    page.getByRole('complementary', { name: 'Development disclaimer' }),
  ).toContainText('In development');
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
    const button = navButton(page, mode);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('aria-current', 'page');
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
  await search(page).fill('Front Doorbell');
  await page
    .getByRole('option')
    .filter({ hasText: 'Front Doorbell' })
    .first()
    .click();
  await expect(navButton(page, 'Security')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(search(page)).toHaveValue('');
  await expect(
    page.getByRole('heading', { name: 'Front Doorbell', exact: true }),
  ).toBeVisible();
});

test('two consecutive keyboard searches both produce results and ArrowUp wraps to the last one', async ({
  page,
}) => {
  await page.goto('/');
  const input = search(page);
  await input.focus();
  await input.fill('garage');
  const listbox = page.getByRole('listbox', { name: 'Search results' });
  await expect(listbox).toBeVisible();
  const count = await listbox.getByRole('option').count();
  expect(count).toBeGreaterThan(2);
  await input.press('ArrowUp');
  await expect(listbox.getByRole('option').last()).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await input.press('ArrowDown');
  await expect(listbox.getByRole('option').first()).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await input.press('Enter');
  await expect(input).toHaveValue('');
  // The chosen record's row receives focus; searching again from the
  // keyboard must still show results.
  await page.keyboard.press('/');
  await expect(input).toBeFocused();
  await input.fill('projector');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option').first()).toBeVisible();
  await input.press('Enter');
  await expect(navButton(page, 'Upkeep')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('heading', { name: 'Projector Lamp', exact: true }),
  ).toBeVisible();
});

test('keyboard navigation opens live cameras with static-host setup guidance and Escape closes it', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const security = navButton(page, 'Security');
  await security.focus();
  await page.keyboard.press('Enter');
  await expect(security).toHaveAttribute('aria-pressed', 'true');
  if (isMobile)
    await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('button', { name: 'Live cameras', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Open SmartHome with its local camera service',
    }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('camera review is a modal that contains background shortcuts and returns focus', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/#m=security&s=c1');
  const open = page.getByRole('button', { name: 'Review demo history' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: /Demo review/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('1');
  await expect(navButton(page, 'Security')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByRole('button', { name: 'Next camera' }).click();
  await expect(dialog.getByRole('heading', { name: /Driveway/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(open).toBeFocused();
  expect(errors).toEqual([]);
});

test('list rows expose selection state and a filter never silently excludes the selection', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#m=electrical&s=m10');
  if (isMobile)
    await page.getByRole('button', { name: 'List', exact: true }).click();
  const row = page.locator('#row-m10');
  await expect(row).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'MP·20' })).toBeVisible();
  await page.getByRole('button', { name: 'Appliance', exact: true }).click();
  await expect(
    page.getByText('MP·20 is outside the Appliance filter'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show all types' }).click();
  await expect(row).toBeVisible();
});

test('collapsed panels are inert and the URL restores mode, selection, and isolation', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#m=upkeep&s=u5&f=main');
  await expect(navButton(page, 'Upkeep')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('heading', { name: 'RO · Polish / Remin' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Isolate · Main', exact: true }),
  ).toBeVisible();
  if (!isMobile) {
    await page.getByRole('button', { name: 'Hide the inventory list' }).click();
    await expect(page.locator('#panel-left')).toHaveAttribute('inert', '');
    await page.getByRole('button', { name: 'Show the inventory list' }).click();
    await expect(page.locator('#panel-left')).not.toHaveAttribute('inert', '');
  } else {
    await expect(page.locator('#panel-left')).toHaveAttribute('inert', '');
  }
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
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
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
  const faces = page.getByTestId('house-stage').locator('svg path.face');
  await expect(faces.first()).toBeAttached();
  const originalCount = await faces.count();
  await page.getByRole('button', { name: 'Isolate', exact: true }).click();
  await page.getByRole('button', { name: 'Basement', exact: true }).click();
  await expect.poll(() => faces.count()).toBeLessThan(originalCount);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(faces).toHaveCount(originalCount);
  await page.getByRole('button', { name: 'Close isolate view' }).click();
  await page.getByRole('button', { name: 'View options', exact: true }).click();
  const originalPath = await faces.first().getAttribute('d');
  await page.getByRole('button', { name: 'Stacked', exact: true }).click();
  await expect(faces.first()).not.toHaveAttribute('d', originalPath ?? '');
});

test('the model is keyboard operable: rooms are buttons and arrows rotate', async ({
  page,
}) => {
  await page.goto('/');
  const stage = page.getByTestId('house-stage');
  const face = stage.locator('path').first();
  const before = await face.getAttribute('d');
  await stage.focus();
  await page.keyboard.press('ArrowRight');
  await expect(face).not.toHaveAttribute('d', before ?? '');
  const room = stage.getByRole('button', { name: /Garage, Main Floor/ });
  await room.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();
});

test('network discovery is searchable by IP and shows placement provenance', async ({
  page,
}) => {
  await page.goto('/');
  await search(page).fill('192.168.0.6');
  await page
    .getByRole('option')
    .filter({ hasText: 'NETGEAR R7000' })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'NETGEAR R7000', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('complementary', { name: 'Network details' })
      .getByText('04:a1:51:2a:f9:02', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('complementary', { name: 'Network details' })
      .getByText(/Owner confirmed.*midpoint of west wall/),
  ).toBeVisible();
  await expect(
    page
      .getByRole('complementary', { name: 'Network details' })
      .getByText('2026-10-14 10:20 MDT', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/smarthome-network-${page.viewportSize()?.width}.png`,
  });
  await search(page).fill('192.168.0.202');
  await page
    .getByRole('option')
    .filter({ hasText: 'server · this machine' })
    .first()
    .click();
  await expect(
    page
      .getByRole('complementary', { name: 'Network details' })
      .getByText(/Owner confirmed.*Parlor north wall/),
  ).toBeVisible();
});
