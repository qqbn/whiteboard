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

test('Delete removes the selected shape', async ({ page }) => {
  await page.goto('/board/test');
  const canvas = page.getByLabel('Whiteboard canvas');
  await expect(canvas).toBeVisible();

  // Reads one pixel of the backing store at a CSS-pixel position (× DPR 2) and returns its alpha.
  const alphaAt = (x: number, y: number) =>
    canvas.evaluate(
      (el: HTMLCanvasElement, [px, py]) =>
        el.getContext('2d')?.getImageData(px * 2, py * 2, 1, 1).data[3] ?? 0,
      [x, y] as const,
    );

  await page.getByRole('radio', { name: 'Rectangle' }).click();
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(400, 380, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => alphaAt(350, 340)).toBeGreaterThan(0);

  await page.getByRole('radio', { name: 'Select' }).click();
  await page.mouse.click(350, 340);
  await page.keyboard.press('Delete');
  await expect.poll(() => alphaAt(350, 340)).toBe(0);
});
