import type { Shape } from './model';

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
    // TODO(ja): 'arrow' i 'writing'
    default:
      break;
  }

  ctx.restore();
}
