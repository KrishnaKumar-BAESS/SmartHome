import { expect, test } from '@playwright/test';

// Start from the default stage (the suite otherwise pins the schematic).
test.use({ storageState: { cookies: [], origins: [] } });

test('the Blender model is the stage when the build includes it', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#f=main');
  const canvas = page.getByTestId('stage-model');
  test.skip(
    (await canvas.count()) === 0,
    'This build has no models/house.glb export.',
  );
  const main = page.getByRole('main', { name: 'Home documentation' });
  await expect(main).toHaveAttribute('data-stage', 'model', {
    timeout: 30_000,
  });
  await expect(canvas).toHaveAttribute('data-shown', 'true');
  // The canvas matches the stage, so SVG markers stay registered to it.
  const stage = await page.getByTestId('house-stage').boundingBox();
  const drawn = await canvas.boundingBox();
  expect(drawn).toEqual(stage);

  // Rooms remain selectable over the model.
  await page.getByRole('button', { name: /^Garage, / }).press('Enter');
  await expect(page).toHaveURL(/s=garage/);

  // The schematic stays one switch away and the choice is remembered.
  if (!(await page.locator('#view-options').isVisible()))
    await page.getByRole('button', { name: 'View options' }).click();
  await page.getByRole('button', { name: 'Schematic', exact: true }).click();
  await expect(main).not.toHaveAttribute('data-stage', 'model');
  await page.reload();
  await expect(page.getByTestId('house-stage')).toBeVisible();
  await expect(main).not.toHaveAttribute('data-stage', 'model');
  expect(errors).toEqual([]);
});
