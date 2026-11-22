import type { Arrow, Shape, Writing } from './model';
import { fontFor, lineHeightOf, splitLines } from './text';

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
    case 'writing':
      drawWriting(ctx, shape);
      break;
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

/**
 * Draws a text line by line. `(x, y)` is the top-left corner of the text box and every line gets a
 * slot of `lineHeightOf(fontSize)`. The baseline is `'middle'` and the y is the CENTRE of the slot:
 * that is where CSS puts the glyphs inside a line box (half of the leading above and below), so the
 * canvas text lines up with the `<textarea>` the user typed it in. It sets its own `fillStyle` from
 * `shape.color`, so it does not depend on whatever `drawShape` set before the `switch`.
 */
function drawWriting(ctx: CanvasRenderingContext2D, writing: Writing): void {
  const lineHeight = lineHeightOf(writing.fontSize);
  ctx.fillStyle = writing.color;
  ctx.font = fontFor(writing.fontSize);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  splitLines(writing.content).forEach((line, index) => {
    ctx.fillText(line, writing.x, writing.y + (index + 0.5) * lineHeight);
  });
}
