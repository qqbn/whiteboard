import { describe, expect, it } from 'vitest';
import type { Shape } from '@/canvas/model';
import { translateShape } from './move-shape';

describe('translateShape', () => {
  it('moves a rectangle and keeps its size and other fields', () => {
    const rect: Shape = { id: 'r', type: 'rectangle', x: 10, y: 20, w: 100, h: 50, color: '#000' };
    expect(translateShape(rect, 5, -7)).toEqual({ ...rect, x: 15, y: 13 });
  });

  it('moves an ellipse the same way', () => {
    const ellipse: Shape = { id: 'e', type: 'ellipse', x: 0, y: 0, w: 40, h: 20, color: '#000' };
    expect(translateShape(ellipse, 3, 4)).toEqual({ ...ellipse, x: 3, y: 4 });
  });

  it('moves only the start of an arrow, because its end is relative', () => {
    const arrow: Shape = {
      id: 'a',
      type: 'arrow',
      x: 10,
      y: 10,
      endX: 30,
      endY: -20,
      color: '#000',
    };
    const moved = translateShape(arrow, 100, 100);
    expect(moved).toEqual({ ...arrow, x: 110, y: 110 });
    // Absolute end point moved by exactly the same delta.
    expect([moved.x + 30, moved.y - 20]).toEqual([arrow.x + 30 + 100, arrow.y - 20 + 100]);
  });

  it('supports negative world coordinates', () => {
    const rect: Shape = { id: 'r', type: 'rectangle', x: -50, y: -50, w: 10, h: 10, color: '#000' };
    expect(translateShape(rect, -10, 20)).toMatchObject({ x: -60, y: -30 });
  });

  it('does not mutate the original shape', () => {
    const rect: Shape = { id: 'r', type: 'rectangle', x: 1, y: 2, w: 3, h: 4, color: '#000' };
    const copy = { ...rect };
    const moved = translateShape(rect, 9, 9);
    expect(rect).toEqual(copy);
    expect(moved).not.toBe(rect);
  });

  it('returns an equal-position copy for a zero delta', () => {
    const rect: Shape = { id: 'r', type: 'rectangle', x: 1, y: 2, w: 3, h: 4, color: '#000' };
    expect(translateShape(rect, 0, 0)).toEqual(rect);
  });
});
