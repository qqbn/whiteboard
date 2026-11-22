import { describe, expect, it } from 'vitest';
import { ARROW_LINE_WIDTH } from './draw-shape';
import { distanceToSegment, hitTest } from './hit-test';
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

  describe('arrow', () => {
    const arrow: Shape = {
      id: 'arrow',
      type: 'arrow',
      x: 0,
      y: 0,
      endX: 100,
      endY: 0,
      color: '#000',
    };
    const model = modelOf(arrow);

    it('hits on the shaft and within the drawn half line width', () => {
      expect(hitTest(model, { x: 50, y: 0 })).toBe('arrow');
      expect(hitTest(model, { x: 50, y: ARROW_LINE_WIDTH / 2 })).toBe('arrow');
    });

    it('misses a point beside the shaft when there is no tolerance', () => {
      expect(hitTest(model, { x: 50, y: 5 })).toBeNull();
    });

    it('hits beside the shaft when the tolerance is large enough', () => {
      expect(hitTest(model, { x: 50, y: 5 }, 6)).toBe('arrow');
      expect(hitTest(model, { x: 50, y: 7 }, 6)).toBeNull();
    });

    it('measures from the end points, not the infinite line, beyond the ends', () => {
      // On the line's extension but 10 units past the tip: far from the segment.
      expect(hitTest(model, { x: 110, y: 0 })).toBeNull();
      expect(hitTest(model, { x: 110, y: 0 }, 10)).toBe('arrow');
      expect(hitTest(model, { x: -10, y: 0 })).toBeNull();
    });

    it('handles arrows that point up-left (negative end offsets)', () => {
      const back: Shape = { ...arrow, id: 'back', x: 100, y: 100, endX: -100, endY: -100 };
      expect(hitTest(modelOf(back), { x: 50, y: 50 })).toBe('back');
      expect(hitTest(modelOf(back), { x: 50, y: 70 })).toBeNull();
    });
  });

  it('never matches writing yet', () => {
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
    expect(hitTest(modelOf(writing), { x: 50, y: 10 })).toBeNull();
  });
});

describe('distanceToSegment', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };

  it('measures perpendicular distance when the projection falls on the segment', () => {
    expect(distanceToSegment({ x: 4, y: 3 }, a, b)).toBe(3);
  });

  it('measures to the nearest end point when the projection falls outside', () => {
    expect(distanceToSegment({ x: 13, y: 4 }, a, b)).toBe(5);
    expect(distanceToSegment({ x: -3, y: 4 }, a, b)).toBe(5);
  });

  it('is zero for a point on the segment', () => {
    expect(distanceToSegment({ x: 7, y: 0 }, a, b)).toBe(0);
  });

  it('falls back to point distance for a zero-length segment', () => {
    expect(distanceToSegment({ x: 3, y: 4 }, a, a)).toBe(5);
  });

  it('works for diagonal segments', () => {
    // Segment (0,0) → (10,10); the point (0,10) is 10 / sqrt(2) away from it (perpendicular foot at (5,5)).
    expect(distanceToSegment({ x: 0, y: 10 }, a, { x: 10, y: 10 })).toBeCloseTo(10 * Math.SQRT1_2);
  });
});
