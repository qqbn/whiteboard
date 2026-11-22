import type { Camera } from './camera';
import { drawSelection } from './draw-selection';
import { drawShape } from './draw-shape';
import type { BoardModel, ShapeId } from './model';

export type RenderState = {
  model: BoardModel;
  camera: Camera;
  /** Id of the shape to outline on top of everything else, or `null` for no selection. */
  selectedId: ShapeId | null;
  // TODO(ja): kształt w trakcie rysowania, aktywne narzędzie
};

/** Startuje pętlę i zwraca funkcję czyszczącą (cancelAnimationFrame). */
export function startRenderLoop(
  canvas: HTMLCanvasElement,
  getState: () => RenderState,
): () => void {
  let id = 0;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const tick = () => {
    const dpr = window.devicePixelRatio || 1;
    const state = getState();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);

    for (const shapeId of state.model.order) {
      const shape = state.model.shapes[shapeId];
      if (shape) drawShape(ctx, shape);
    }

    // The outline goes last so it is never hidden by shapes drawn above the selected one.
    // A stale id (the shape was removed) simply finds nothing and draws nothing.
    const selected = state.selectedId ? state.model.shapes[state.selectedId] : undefined;
    if (selected) drawSelection(ctx, selected, state.camera.zoom);

    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(id);
}
