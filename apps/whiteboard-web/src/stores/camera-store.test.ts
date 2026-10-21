import { beforeEach, describe, expect, it } from 'vitest';
import { screenToWorld } from '@/canvas/camera';
import { INITIAL_CAMERA, useCameraStore } from './camera-store';

const state = () => useCameraStore.getState();

describe('camera store', () => {
  beforeEach(() => useCameraStore.setState({ camera: INITIAL_CAMERA }));

  it('starts with the default camera', () => {
    expect(state().camera).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('pans the camera by a screen-space delta', () => {
    state().panByScreen(100, 50);
    expect(state().camera).toEqual({ x: -100, y: -50, zoom: 1 });
  });

  it('converts the pan delta to world units using the current zoom', () => {
    useCameraStore.setState({ camera: { x: 0, y: 0, zoom: 2 } });
    state().panByScreen(100, 0);
    expect(state().camera.x).toBe(-50);
  });

  it('zooms around the anchor point and keeps the world point under the cursor fixed', () => {
    useCameraStore.setState({ camera: { x: 30, y: -20, zoom: 1.5 } });
    const anchor = { x: 240, y: 135 };
    const before = screenToWorld(state().camera, anchor);

    state().zoomAtScreen(1.2, anchor);

    const after = screenToWorld(state().camera, anchor);
    expect(state().camera.zoom).toBeCloseTo(1.8);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('clamps zoom to the allowed range', () => {
    for (let i = 0; i < 50; i++) state().zoomAtScreen(2, { x: 0, y: 0 });
    const max = state().camera.zoom;
    expect(max).toBeLessThanOrEqual(2);

    for (let i = 0; i < 100; i++) state().zoomAtScreen(0.5, { x: 0, y: 0 });
    const min = state().camera.zoom;
    expect(min).toBeGreaterThanOrEqual(0.1);
    expect(min).toBeLessThan(max);
  });

  it('resets the camera to the initial state', () => {
    state().panByScreen(10, 10);
    state().zoomAtScreen(1.5, { x: 5, y: 5 });
    state().resetCamera();
    expect(state().camera).toEqual(INITIAL_CAMERA);
  });
});
