import { describe, expect, test } from 'vitest';
import { screenToWorld, worldToScreen, panBy, zoomAt } from './camera';

describe('camera', () => {
  test('screenToWorld', () => {
    const camera = { x: 100, y: 50, zoom: 2 };
    const screen = { x: 40, y: 30 };
    const world = screenToWorld(camera, screen);
    expect(world).toEqual({ x: 120, y: 65 });
  });

  test('worldToScreen', () => {
    const camera = { x: 100, y: 50, zoom: 2 };
    const world = { x: 110, y: 60 };
    const screen = worldToScreen(camera, world);
    expect(screen).toEqual({ x: 20, y: 20 });
  });

  test.each([
    [2, 10, 20, 95, 40],
    [0.5, 30, 0, 40, 50],
    [2, 0, 0, 100, 50],
    [2, -10, -20, 105, 60],
  ])('panBy', (zoom, dx, dy, expectedX, expectedY) => {
    const camera = { x: 100, y: 50, zoom: zoom };
    const newCamera = panBy(camera, dx, dy);
    expect(newCamera.x).toBe(expectedX);
    expect(newCamera.y).toBe(expectedY);
    expect(newCamera.zoom).toBe(zoom);
    expect(camera.x).toBe(100);
  });

  test.each([[{ x: 100, y: 50, zoom: 1 }, 2, { x: 40, y: 30 }, { x: 120, y: 65, zoom: 2 }]])(
    'zoomAt',
    (camera, factor, anchor, expected) => {
      const newCamera = zoomAt(camera, factor, anchor);
      expect(newCamera).toStrictEqual(expected);
    },
  );

  describe('zoomAt keeps the world point under the anchor fixed', () => {
    test.each([
      {
        name: 'anchor in the corner',
        camera: { x: 0, y: 0, zoom: 1 },
        factor: 1.5,
        anchor: { x: 0, y: 0 },
      },
      {
        name: 'anchor in the middle',
        camera: { x: 100, y: 50, zoom: 1 },
        factor: 1.5,
        anchor: { x: 400, y: 300 },
      },
      {
        name: 'different x and y',
        camera: { x: 100, y: 50, zoom: 1 },
        factor: 1.2,
        anchor: { x: 400, y: 50 },
      },
      {
        name: 'zooming out',
        camera: { x: 100, y: 50, zoom: 1 },
        factor: 0.5,
        anchor: { x: 250, y: 120 },
      },
      {
        name: 'negative camera, zoom != 1',
        camera: { x: -300, y: -80, zoom: 0.5 },
        factor: 1.5,
        anchor: { x: 640, y: 360 },
      },
      {
        name: 'zoomed in, then zoom out',
        camera: { x: 20, y: 10, zoom: 1.5 },
        factor: 0.8,
        anchor: { x: 30, y: 700 },
      },
    ])('$name', ({ camera, factor, anchor }) => {
      const worldBefore = screenToWorld(camera, anchor);
      const newCamera = zoomAt(camera, factor, anchor);
      const worldAfter = screenToWorld(newCamera, anchor);

      expect(newCamera.zoom).toBeCloseTo(camera.zoom * factor, 10);
      expect(worldAfter.x).toBeCloseTo(worldBefore.x, 10);
      expect(worldAfter.y).toBeCloseTo(worldBefore.y, 10);
    });

    test('does not mutate the input camera', () => {
      const camera = { x: 100, y: 50, zoom: 1 };
      zoomAt(camera, 2, { x: 40, y: 30 });
      expect(camera).toEqual({ x: 100, y: 50, zoom: 1 });
    });
  });

  // Limits assumed by these tests: MIN_ZOOM = 0.1, MAX_ZOOM = 2 (see zoomAt).
  describe('zoomAt clamps zoom', () => {
    const anchor = { x: 400, y: 300 };

    test.each([
      { name: 'above max', camera: { x: 100, y: 50, zoom: 1 }, factor: 100, expectedZoom: 2 },
      { name: 'below min', camera: { x: 100, y: 50, zoom: 1 }, factor: 0.001, expectedZoom: 0.1 },
      { name: 'already at max', camera: { x: 100, y: 50, zoom: 2 }, factor: 1.5, expectedZoom: 2 },
      {
        name: 'already at min',
        camera: { x: 100, y: 50, zoom: 0.1 },
        factor: 0.5,
        expectedZoom: 0.1,
      },
    ])('$name', ({ camera, factor, expectedZoom }) => {
      const worldBefore = screenToWorld(camera, anchor);
      const newCamera = zoomAt(camera, factor, anchor);
      const worldAfter = screenToWorld(newCamera, anchor);

      expect(newCamera.zoom).toBeCloseTo(expectedZoom, 10);
      // the camera must be computed from the clamped zoom, otherwise the point under the anchor drifts
      expect(worldAfter.x).toBeCloseTo(worldBefore.x, 10);
      expect(worldAfter.y).toBeCloseTo(worldBefore.y, 10);
    });

    test('at the limit the camera does not move at all', () => {
      const camera = { x: 100, y: 50, zoom: 2 };
      expect(zoomAt(camera, 1.5, anchor)).toEqual(camera);
    });
  });
});
