import type { Point } from '@/canvas/camera';

export type Bounds = { x: number; y: number; w: number; h: number };

/**
 * Turns a drag gesture (where the pointer went down and where it is now) into a rectangle
 * with a non-negative width and height. Dragging up or to the left yields a negative delta,
 * so we take the top-left corner as the minimum of both points and the size as the absolute delta.
 */
export function boundsFromDrag(start: Point, end: Point): Bounds {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };
}

/** True when the drag is too small to be an intentional shape (e.g. a plain click). */
export function isTinyDrag(bounds: Bounds, minSize: number): boolean {
  return bounds.w < minSize && bounds.h < minSize;
}
