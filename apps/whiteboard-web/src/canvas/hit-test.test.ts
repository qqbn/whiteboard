import { describe, expect, it } from 'vitest';
import { hitTest } from './hit-test';
import type { BoardModel, Shape } from './model';

function modelOf(...shapes: Shape[]): BoardModel {
  return {
    shapes: Object.fromEntries(shapes.map((shape) => [shape.id, shape])),
    order: shapes.map((shape) => shape.id),
  };
}

const rect: Shape = { id: 'rect', type: 'rectangle', x: 0, y: 0, w: 100, h: 50, color: '#000' };
const ellipse: Shape = { id: 'ellipse', type: 'ellipse', x: 0, y: 0, w: 100, h: 50, color: '#000' };

describe('hitTest', () => {
  it('returns null for an empty board', () => {
    expect(hitTest(modelOf(), { x: 1, y: 1 })).toBeNull();
  });

  describe('rectangle', () => {
    const model = modelOf(rect);

    it('hits inside and on the edges', () => {
      expect(hitTest(model, { x: 50, y: 25 })).toBe('rect');
      expect(hitTest(model, { x: 0, y: 0 })).toBe('rect');
      expect(hitTest(model, { x: 100, y: 50 })).toBe('rect');
    });

    it('misses just outside on every side', () => {
      expect(hitTest(model, { x: -0.1, y: 25 })).toBeNull();
      expect(hitTest(model, { x: 100.1, y: 25 })).toBeNull();
      expect(hitTest(model, { x: 50, y: -0.1 })).toBeNull();
      expect(hitTest(model, { x: 50, y: 50.1 })).toBeNull();
    });
  });

  describe('ellipse', () => {
    const model = modelOf(ellipse);

    it('hits the centre and the extreme points on the axes', () => {
      expect(hitTest(model, { x: 50, y: 25 })).toBe('ellipse');
      expect(hitTest(model, { x: 0, y: 25 })).toBe('ellipse');
      expect(hitTest(model, { x: 100, y: 25 })).toBe('ellipse');
      expect(hitTest(model, { x: 50, y: 0 })).toBe('ellipse');
    });

    it('misses the corners of its bounding box', () => {
      expect(hitTest(model, { x: 1, y: 1 })).toBeNull();
      expect(hitTest(model, { x: 99, y: 49 })).toBeNull();
    });

    it('respects the different radii on each axis', () => {
      // (80, 25) is inside (80 is within rx = 50 of the centre), but the same distance in y would be outside.
      expect(hitTest(model, { x: 80, y: 25 })).toBe('ellipse');
      expect(hitTest(model, { x: 50, y: 25 + 30 })).toBeNull();
    });

    it('never matches a degenerate ellipse', () => {
      const flat = modelOf({ ...ellipse, id: 'flat', w: 0 });
      expect(hitTest(flat, { x: 0, y: 25 })).toBeNull();
    });
  });

  describe('overlapping shapes', () => {
    it('returns the shape that is later in `order` (drawn on top)', () => {
      expect(hitTest(modelOf(rect, ellipse), { x: 50, y: 25 })).toBe('ellipse');
      expect(hitTest(modelOf(ellipse, rect), { x: 50, y: 25 })).toBe('rect');
    });

    it('falls through to a lower shape when the top one is missed', () => {
      // Corner of the box: inside the rectangle underneath, outside the ellipse on top.
      expect(hitTest(modelOf(rect, ellipse), { x: 1, y: 1 })).toBe('rect');
    });
  });

  it('never matches arrows or writing yet', () => {
    const arrow: Shape = {
      id: 'arrow',
      type: 'arrow',
      x: 0,
      y: 0,
      endX: 100,
      endY: 0,
      color: '#000',
    };
    const writing: Shape = {
      id: 'text',
      type: 'writing',
      x: 0,
      y: 0,
      w: 100,
      h: 20,
      content: 'hi',
      fontSize: 16,
      color: '#000',
    };
    expect(hitTest(modelOf(arrow, writing), { x: 50, y: 0 })).toBeNull();
  });
});
