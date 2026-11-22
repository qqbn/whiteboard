import { describe, expect, it } from 'vitest';
import { boundsFromDrag, isTinyDrag } from './drag-rect';

describe('boundsFromDrag', () => {
  it('keeps the start as the top-left corner when dragging down-right', () => {
    expect(boundsFromDrag({ x: 10, y: 20 }, { x: 110, y: 70 })).toEqual({
      x: 10,
      y: 20,
      w: 100,
      h: 50,
    });
  });

  it('normalizes a drag up-left so width and height stay positive', () => {
    expect(boundsFromDrag({ x: 110, y: 70 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      w: 100,
      h: 50,
    });
  });

  it('normalizes mixed directions per axis', () => {
    expect(boundsFromDrag({ x: 10, y: 70 }, { x: 110, y: 20 })).toEqual({
      x: 10,
      y: 20,
      w: 100,
      h: 50,
    });
  });
});

describe('isTinyDrag', () => {
  it('treats a click (no movement) as tiny', () => {
    expect(isTinyDrag({ x: 0, y: 0, w: 0, h: 0 }, 4)).toBe(true);
  });

  it('is not tiny when either side reaches the minimum', () => {
    expect(isTinyDrag({ x: 0, y: 0, w: 100, h: 1 }, 4)).toBe(false);
  });
});
