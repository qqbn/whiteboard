import type { Point } from './camera';
import { ARROW_LINE_WIDTH } from './draw-shape';
import type { Arrow, BoardModel, Ellipse, Rectangle, Shape, ShapeId } from './model';

/**
 * Returns the id of the topmost shape that contains `worldPoint`, or `null` if the point hits nothing.
 *
 * - `worldPoint` must already be in world coordinates (use `screenToWorld` on the pointer position first).
 * - "Topmost" means last in `model.order`, because `order` is the draw order (first = bottom, last = top).
 *   We walk it from the end, so for overlapping shapes the one the user sees on top wins.
 * - Only filled shapes are hit-tested: a click anywhere inside a rectangle/ellipse counts, edges included.
 * - Arrows are thin lines, so they are hit when the point is within `tolerance` of the shaft. `tolerance`
 *   is in WORLD units and exists because a "close enough" distance is defined on screen (e.g. 6 px), which
 *   is a different distance in the world at every zoom level: callers pass `screenPixels / camera.zoom`.
 *   It never shrinks below half the drawn line width, so you can always hit the visible line itself.
 * - A writing is hit anywhere inside its box (`x, y, w, h`), not only on the glyphs: thin letters would be
 *   very hard to click. Its `w`/`h` are kept in the model, see `measureWriting`.
 *
 * Pure function: reads the model, changes nothing, so it is easy to unit test.
 */
export function hitTest(model: BoardModel, worldPoint: Point, tolerance = 0): ShapeId | null {
  for (let i = model.order.length - 1; i >= 0; i--) {
    const id = model.order[i];
    if (id === undefined) continue; // unreachable for i in range; satisfies noUncheckedIndexedAccess
    const shape = model.shapes[id];
    if (shape && containsPoint(shape, worldPoint, tolerance)) return id;
  }
  return null;
}

/** Dispatches to the geometry test for the shape's type. */
function containsPoint(shape: Shape, point: Point, tolerance: number): boolean {
  switch (shape.type) {
    case 'rectangle':
      return rectangleContains(shape, point);
    case 'ellipse':
      return ellipseContains(shape, point);
    case 'arrow':
      return arrowContains(shape, point, tolerance);
    case 'writing':
      return rectangleContains(shape, point);
  }
}

/**
 * Arrow test: the point hits when its distance to the shaft segment is at most the hit radius, which is
 * the larger of the caller's `tolerance` and half the drawn line width. The arrowhead is not tested
 * separately: it sits within a few units of the tip, which the tolerance around the shaft covers.
 */
function arrowContains(shape: Arrow, point: Point, tolerance: number): boolean {
  const start = { x: shape.x, y: shape.y };
  // `endX/endY` are relative to the start, so the absolute end point is start + offset.
  const end = { x: shape.x + shape.endX, y: shape.y + shape.endY };
  const radius = Math.max(tolerance, ARROW_LINE_WIDTH / 2);
  return distanceToSegment(point, start, end) <= radius;
}

/**
 * Shortest distance from `point` to the segment `a → b` (not the infinite line through them).
 * Project the point onto the line with a dot product; the projection is `t` ∈ [0, 1] along the segment
 * (0 at `a`, 1 at `b`). Clamping `t` handles points beyond either end: the nearest spot is then the end
 * point itself. A zero-length segment (a == b) has no direction, so it falls back to point-to-point.
 */
export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);

  const t = ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSquared;
  const clamped = Math.min(1, Math.max(0, t));
  return Math.hypot(point.x - (a.x + clamped * abx), point.y - (a.y + clamped * aby));
}

/** Axis-aligned box test: the point must lie within `[x, x + w] × [y, y + h]` (edges count as inside). */
function rectangleContains(shape: Pick<Rectangle, 'x' | 'y' | 'w' | 'h'>, point: Point): boolean {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.w &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.h
  );
}

/**
 * Ellipse test. The model stores the top-left corner and size, so we first find the centre and the
 * radii (the same conversion `drawShape` does). A point is inside when
 * `(dx / rx)² + (dy / ry)² <= 1`, where `dx, dy` is its offset from the centre: dividing by the radii
 * squashes the ellipse into a unit circle, and the unit-circle test is a simple "distance <= 1".
 * A degenerate ellipse (zero width or height) divides by zero, gives `NaN`/`Infinity`, and never matches.
 */
function ellipseContains(shape: Ellipse, point: Point): boolean {
  const rx = shape.w / 2;
  const ry = shape.h / 2;
  const dx = (point.x - (shape.x + rx)) / rx;
  const dy = (point.y - (shape.y + ry)) / ry;
  return dx * dx + dy * dy <= 1;
}

// TODO(ja): uchwyty zmiany rozmiaru, zaznaczanie prostokątem.
