import { expect, test } from '@playwright/test';

test.use({ deviceScaleFactor: 2 });

test('board page renders a fullscreen, DPR-aware canvas', async ({ page }) => {
  await page.goto('/board/test');

  const canvas = page.getByLabel('Whiteboard canvas');
  await expect(canvas).toBeVisible();

  const viewport = page.viewportSize();
  if (!viewport) throw new Error('viewport is not set');

  const box = await canvas.boundingBox();
  expect(box?.width).toBe(viewport.width);
  expect(box?.height).toBe(viewport.height);

  // Backing store = CSS size × devicePixelRatio, so lines stay crisp on HiDPI screens.
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => [el.width, el.height]))
    .toEqual([viewport.width * 2, viewport.height * 2]);
});
