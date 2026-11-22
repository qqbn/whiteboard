import type { Shape } from './model';

const SELECTION_COLOR = '#2563eb';
/** Outline thickness in screen pixels (converted to world units with the zoom, see `drawSelection`). */
const OUTLINE_WIDTH_PX = 2;

type Box = { x: number; y: number; w: number; h: number };

/** Axis-aligned bounding box of a shape in world coordinates. */
function boundsOf(shape: Shape): Box {
  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
    case 'writing':
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
    case 'arrow': {
      // `endX/endY` are relative to the start point and may be negative, so normalise the box.
      return {
        x: Math.min(shape.x, shape.x + shape.endX),
        y: Math.min(shape.y, shape.y + shape.endY),
        w: Math.abs(shape.endX),
        h: Math.abs(shape.endY),
      };
    }
  }
}

/**
 * Draws a selection outline around `shape`'s bounding box.
 * Must be called with the camera transform already applied (same as `drawShape`). The context is
 * scaled by `zoom`, so the line width is divided by it to keep the outline the same thickness on
 * screen at every zoom level.
 */
export function drawSelection(ctx: CanvasRenderingContext2D, shape: Shape, zoom: number): void {
  const { x, y, w, h } = boundsOf(shape);
  ctx.save();
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH_PX / zoom;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
