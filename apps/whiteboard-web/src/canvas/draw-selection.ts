import type { Shape } from './model';

const SELECTION_COLOR = '#2563eb';
/** Outline thickness in screen pixels (converted to world units with the zoom, see `drawSelection`). */
const OUTLINE_WIDTH_PX = 2;
/** Gap between a shape's bounding box and its outline, in screen pixels. Keeps flat boxes (e.g. a horizontal arrow) visible. */
const OUTLINE_PADDING_PX = 6;

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
 * screen at every zoom level. The box is padded outwards by a fixed number of screen pixels, so a
 * zero-height box (a perfectly horizontal arrow) still shows up as a visible rectangle around the shape.
 */
export function drawSelection(ctx: CanvasRenderingContext2D, shape: Shape, zoom: number): void {
  const { x, y, w, h } = boundsOf(shape);
  const pad = OUTLINE_PADDING_PX / zoom;
  ctx.save();
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH_PX / zoom;
  ctx.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  ctx.restore();
}
