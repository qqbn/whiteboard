import type { Arrow, Shape } from './model';

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.fillStyle = shape.color;

  switch (shape.type) {
    case 'rectangle':
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
      break;
    case 'ellipse':
      // ellipse() przyjmuje środek i promienie, a model trzyma lewy górny róg i rozmiar.
      ctx.beginPath();
      ctx.ellipse(
        shape.x + shape.w / 2,
        shape.y + shape.h / 2,
        shape.w / 2,
        shape.h / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case 'arrow':
      drawArrow(ctx, shape);
      break;
    // TODO(ja): 'writing'
    default:
      break;
  }

  ctx.restore();
}

/** Line thickness of an arrow in world units (it scales with the camera zoom like every other shape). */
export const ARROW_LINE_WIDTH = 4;
/** Length of each arrowhead stroke, in world units. */
const ARROW_HEAD_LENGTH = 18;
/** Angle between the shaft and each arrowhead stroke, in radians (about 28°). */
const ARROW_HEAD_ANGLE = Math.PI / 6.5;

/**
 * Draws an arrow as a line from `(x, y)` to `(x + endX, y + endY)` plus a "V"-shaped head at the end.
 * `endX/endY` are relative to the start, so the absolute end point is computed first. The head is two
 * short strokes that go back from the tip, rotated ±`ARROW_HEAD_ANGLE` around the shaft's direction;
 * that direction comes from `atan2(dy, dx)`. A zero-length arrow gives `atan2(0, 0) = 0`, which is
 * harmless (it just draws a dot-sized blob).
 */
function drawArrow(ctx: CanvasRenderingContext2D, arrow: Arrow): void {
  const endX = arrow.x + arrow.endX;
  const endY = arrow.y + arrow.endY;
  const angle = Math.atan2(arrow.endY, arrow.endX);

  ctx.strokeStyle = arrow.color;
  ctx.lineWidth = ARROW_LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(arrow.x, arrow.y);
  ctx.lineTo(endX, endY);
  // Head: from the tip, back along the shaft rotated to either side. `angle + Math.PI` points backwards.
  for (const side of [-1, 1]) {
    const headAngle = angle + Math.PI + side * ARROW_HEAD_ANGLE;
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + Math.cos(headAngle) * ARROW_HEAD_LENGTH,
      endY + Math.sin(headAngle) * ARROW_HEAD_LENGTH,
    );
  }
  ctx.stroke();
}
