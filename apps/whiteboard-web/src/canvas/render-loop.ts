// TODO(ja): pętla requestAnimationFrame i rysowanie na 2D context.
import type { Camera } from './camera';
import type { BoardModel } from './model';

export type RenderState = {
  model: BoardModel;
  camera: Camera;
  // TODO(ja): zaznaczenie, kształt w trakcie rysowania, aktywne narzędzie
};

/** Startuje pętlę i zwraca funkcję czyszczącą (cancelAnimationFrame). */
export function startRenderLoop(
  _canvas: HTMLCanvasElement,
  _getState: () => RenderState,
): () => void {
  throw new Error('TODO(ja): startRenderLoop');
}
