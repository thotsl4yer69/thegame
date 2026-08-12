import { chromium, expect, test } from '@playwright/test';

test('desktop player journey covers difficulty, help, combat, pause and persistence', async ({ page },testInfo) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('requestfailed', request => runtimeErrors.push(`${request.url()} — ${request.failure()?.errorText}`));

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/THOTSL4YER69/);
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('[data-diff]')).toHaveCount(4);
  await expect(page.locator('#rap-sheet')).toContainText('RAP SHEET');

  await page.locator('#cinema').click();
  await expect(page.locator('[data-cut]')).toHaveCount(4);
  await page.locator('[data-cut="0"]').click();
  await expect(page.locator('#cutscene')).not.toHaveClass(/gone/);
  await expect(page.locator('#cutscene-stage canvas')).toBeVisible();
  await expect(page.locator('#cutscene-title')).toHaveText('VELVET WARNING');
  await expect(page.locator('.cutscene-rating')).toContainText('FICTIONAL ADULTS 21+');
  await expect(page.locator('#cutscene-tip')).toBeVisible();
  await page.locator('#cutscene-tip').click();
  await expect(page.locator('#cutscene-speaker')).toHaveText('HOUSE MC');
  await expect(page.locator('#cutscene-tip')).toContainText('$20 TIPPED');
  await page.screenshot({path:testInfo.outputPath('desktop-cutscene.png')});
  await page.locator('#cutscene-next').click();
  await expect(page.locator('#cutscene-speaker')).toHaveText('JACK');
  await page.locator('#cutscene-skip').click();
  await expect(page.locator('#cutscene')).toHaveClass(/gone/);
  await expect(page.locator('#modal')).toContainText('3D STORY CUTS');
  await page.locator('#back').click();

  await page.locator('#cast').click();
  await expect(page.locator('.after-dark .card')).toHaveCount(8);
  await page.locator('#back').click();

  await page.locator('#how').click();
  await expect(page.locator('.how-grid article')).toHaveCount(4);
  await expect(page.locator('#modal')).toContainText('MONEY SHOT');
  await page.locator('#back').click();

  await page.locator('[data-diff="feral"]').click();
  await expect(page.locator('[data-diff="feral"]')).toHaveClass(/active/);
  await expect(page.locator('#difficulty-copy')).toContainText('2.25× SCORE');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[data-diff="feral"]')).toHaveClass(/active/);
  await page.locator('[data-diff="cooked"]').click();

  await page.locator('#start').click();
  await expect(page.locator('#hud')).not.toHaveClass(/gone/);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#wave')).toHaveText('WAVE 1/3');
  await page.waitForTimeout(2400);

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyJ');
  await page.keyboard.press('KeyH');
  await page.keyboard.press('KeyK');
  await page.keyboard.press('KeyL');

  await page.keyboard.down('Escape');
  await page.waitForTimeout(120);
  await page.keyboard.up('Escape');
  await expect(page.locator('#resume')).toBeVisible();
  await page.locator('#resume').click();
  await expect(page.locator('#modal')).toHaveClass(/gone/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test('mobile landscape exposes responsive touch combat controls', async ({},testInfo) => {
  const mobileBrowser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: process.env.PLAYWRIGHT_CHROMIUM_ARGS_JSON ? JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS_JSON) as string[] : [],
  });
  const context = await mobileBrowser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-diff]')).toHaveCount(4);
  await page.locator('#cinema').click();
  await page.locator('[data-cut="0"]').click();
  await expect(page.locator('#cutscene-stage canvas')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('mobile-cutscene.png')});
  await page.locator('#cutscene-skip').click();
  await page.locator('#back').click();
  await page.locator('#start').click();
  await expect(page.locator('#touch')).not.toHaveClass(/gone/);
  await expect(page.locator('#touch button')).toHaveCount(10);
  await page.locator('[data-action="right"]').dispatchEvent('pointerdown');
  await page.waitForTimeout(250);
  await page.locator('[data-action="right"]').dispatchEvent('pointerup');
  await page.locator('[data-action="hit"]').dispatchEvent('pointerdown');
  await page.locator('[data-action="hit"]').dispatchEvent('pointerup');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(runtimeErrors).toEqual([]);
  await context.close();
  await mobileBrowser.close();
});

test('first loaded production build remains playable offline', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(async () => {
    const cache = await caches.open('ts69-v4');
    return (await cache.keys()).length > 10;
  });

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/THOTSL4YER69/);
  await expect(page.locator('#start')).toBeVisible();
});
