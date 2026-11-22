import type { Point } from './camera';
import type { BoardModel, Ellipse, Rectangle, Shape, ShapeId } from './model';

/**
 * Returns the id of the topmost shape that contains `worldPoint`, or `null` if the point hits nothing.
 *
 * - `worldPoint` must already be in world coordinates (use `screenToWorld` on the pointer position first).
 * - "Topmost" means last in `model.order`, because `order` is the draw order (first = bottom, last = top).
 *   We walk it from the end, so for overlapping shapes the one the user sees on top wins.
 * - Only filled shapes are hit-tested: a click anywhere inside a rectangle/ellipse counts, edges included.
 * - Arrows and writing are not hit-testable yet (they are not drawn yet), so they never match.
 *
 * Pure function: reads the model, changes nothing, so it is easy to unit test.
 */
export function hitTest(model: BoardModel, worldPoint: Point): ShapeId | null {
  for (let i = model.order.length - 1; i >= 0; i--) {
    const id = model.order[i];
    if (id === undefined) continue; // unreachable for i in range; satisfies noUncheckedIndexedAccess
    const shape = model.shapes[id];
    if (shape && containsPoint(shape, worldPoint)) return id;
  }
  return null;
}

/** Dispatches to the geometry test for the shape's type. */
function containsPoint(shape: Shape, point: Point): boolean {
  switch (shape.type) {
    case 'rectangle':
      return rectangleContains(shape, point);
    case 'ellipse':
      return ellipseContains(shape, point);
    // TODO(ja): 'arrow' (distance from the point to the segment, with a tolerance) and 'writing'.
    case 'arrow':
    case 'writing':
      return false;
  }
}

/** Axis-aligned box test: the point must lie within `[x, x + w] × [y, y + h]` (edges count as inside). */
function rectangleContains(shape: Rectangle, point: Point): boolean {
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
