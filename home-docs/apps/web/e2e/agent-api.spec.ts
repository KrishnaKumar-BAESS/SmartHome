import { expect, test } from '@playwright/test';
import type { Command } from '../src/features/house/agent-api';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.smartHome?.version === '1.0');
});

test('an agent discovers data and selects a record in every collection in the visible app', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const records = await page.evaluate(() => {
    const api = window.smartHome!;
    return api
      .describe()
      .collections.map(({ kind }) => api.query({ kind, limit: 1 }).records[0]);
  });
  expect(records).toHaveLength(11);
  for (const record of records) {
    const result = await page.evaluate(async ({ kind, id }) => {
      const api = window.smartHome!;
      // Simulate a user leaving filters and panels in an inconvenient state.
      await api.execute({
        type: 'view.set',
        view: {
          isolation: { floor: 'second' },
          panels: { list: true, details: false },
        },
      });
      return api.execute({ type: 'record.select', kind, id });
    }, record);
    expect(result.view.mode).toBe(record.mode);
    await expect(
      page
        .getByRole('navigation', { name: 'Documentation views' })
        .locator('[aria-current="page"]'),
    ).toContainText(new RegExp(record.mode, 'i'));
    if (record.kind !== 'network') {
      expect(result.view.selection).toEqual({
        kind: record.kind,
        id: record.id,
      });
      expect(result.view.panels.details).toBe(true);
      await expect(page.locator('#panel-right')).toBeVisible();
      // Selection uses the same row IDs and detail derivation as the UI.
      await expect(page.locator('#panel-right')).toContainText(
        record.label
          .replace(/ sensor$| zone$/, '')
          .split(' — ')
          .at(-1)!,
      );
    }
  }
  expect(errors).toEqual([]);
});

test('commands control rendered geometry, filters, theme, search, panels and help', async ({
  page,
}) => {
  const before = await page
    .getByTestId('house-stage')
    .locator('svg')
    .innerHTML();
  const snapshot = await page.evaluate(() =>
    window.smartHome!.execute({
      type: 'view.set',
      view: {
        mode: 'lighting',
        camera: { yaw: 90, pitch: 80, zoom: 1.2, panX: 12, panY: -15 },
        isolation: { rooms: ['garage'] },
        separation: 'stacked',
        theme: 'dark',
        lightingFilter: 'overdue',
        panels: { list: true, details: false },
        labels: false,
      },
    }),
  );
  expect(snapshot.view.visibleRoomIds).toEqual(['garage']);
  expect(snapshot.view.camera).toEqual({
    yaw: 90,
    pitch: 80,
    zoom: 1.2,
    panX: 12,
    panY: -15,
  });
  expect(
    await page.getByTestId('house-stage').locator('svg').innerHTML(),
  ).not.toBe(before);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#panel-left')).toBeVisible();
  await expect(page.locator('#panel-right')).not.toBeVisible();
  await expect(
    page
      .locator('#panel-left')
      .getByRole('button', { name: 'Overdue', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(() =>
    window.smartHome!.execute({
      type: 'view.set',
      view: { search: 'Front Doorbell', searchCategory: 'Camera' },
    }),
  );
  await expect(
    page.getByRole('combobox', { name: 'Search home inventory' }),
  ).toHaveValue('Front Doorbell');
  await expect(
    page.getByRole('option').filter({ hasText: 'Front Doorbell' }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.smartHome!.execute({
      type: 'view.set',
      view: { search: '', help: true },
    }),
  );
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() =>
    window.smartHome!.execute({ type: 'view.set', view: { help: false } }),
  );
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const reset = await page.evaluate(() =>
    window.smartHome!.execute({ type: 'view.reset' }),
  );
  expect(reset.view.camera).toEqual({
    yaw: 35,
    pitch: 58,
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  expect(reset.view.isolation).toEqual({ floor: 'all', rooms: [] });
  expect(reset.view.separation).toBe('full');
});

test('subscriptions observe user actions; invalid commands leave state intact; links survive reload', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.smartHome!.subscribe((snapshot) => {
      document.body.dataset.agentMode = snapshot.view.mode;
    });
  });
  await page
    .getByRole('navigation', { name: 'Documentation views' })
    .getByRole('button', { name: 'Security', exact: true })
    .click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-agent-mode',
    'security',
  );
  const invalid = await page.evaluate(async () => {
    const api = window.smartHome!;
    const before = api.getState();
    try {
      await api.execute({
        type: 'view.set',
        view: { mode: 'climate', camera: { zoom: -1 } },
      } as Command);
    } catch (error) {
      return {
        code: (error as { code: string }).code,
        before,
        after: api.getState(),
      };
    }
  });
  expect(invalid?.code).toBe('INVALID_ARGUMENT');
  expect(invalid?.after).toEqual(invalid?.before);
  await page.evaluate(async () => {
    await window.smartHome!.execute({
      type: 'record.select',
      kind: 'room',
      id: 'garage',
    });
    await window.smartHome!.execute({
      type: 'view.set',
      view: { separation: 'floors', theme: 'light' },
    });
  });
  await page.reload();
  await page.waitForFunction(() => !!window.smartHome);
  const state = await page.evaluate(() => window.smartHome!.getState());
  expect(state.view.selection).toEqual({ kind: 'room', id: 'garage' });
  expect(state.view.visibleRoomIds).toEqual(['garage']);
  expect(state.view.separation).toBe('floors');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
