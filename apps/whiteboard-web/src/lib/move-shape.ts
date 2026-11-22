import type { Shape } from '@/canvas/model';

/**
 * Returns a copy of `shape` moved by `(dx, dy)` world units. Pure: the input is not mutated, which
 * matters because the board store hands out shared, immutable shape objects.
 *
 * Every shape type has `x, y` as its anchor, so one spread covers them all. An arrow's end point
 * (`endX, endY`) is stored relative to its start, so it moves along with `x, y` untouched.
 *
 * Callers should pass the shape as it was when the drag began plus the TOTAL delta since then
 * (not per-event increments), so rounding errors never accumulate while dragging.
 */
export function translateShape<T extends Shape>(shape: T, dx: number, dy: number): T {
  return { ...shape, x: shape.x + dx, y: shape.y + dy };
}
