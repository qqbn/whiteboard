// TODO(ja): hit-testing w układzie współrzędnych świata.
import type { Point } from './camera';
import type { BoardModel, ShapeId } from './model';

export function hitTest(_model: BoardModel, _worldPoint: Point): ShapeId | null {
  throw new Error('TODO(ja): hitTest');
}

// TODO(ja): uchwyty zmiany rozmiaru, zaznaczanie prostokątem.
