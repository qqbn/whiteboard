// TODO(ja): jedyne miejsce, przez które reszta aplikacji czyta i zmienia model tablicy.
// Na etapie 2 podmieniasz implementację na Y.Doc – sygnatury powinny zostać te same.
import type { BoardModel, Shape, ShapeId } from './model';

export type Unsubscribe = () => void;

export interface BoardStore {
  /** Odczyt dla renderera i hit-testu. TODO(ja): czy zwracasz kopię, czy referencję? Co z tego wynika dla mutacji? */
  getModel(): BoardModel;
  get(id: ShapeId): Shape | undefined;

  /** Dodaje kształt na wierzch (koniec `order`). TODO(ja): co przy id, które już istnieje? */
  add(shape: Shape): void;
  /** TODO(ja): jak otypować `patch`, żeby nie dało się zmienić `id` ani `type`? (uwaga: Shape to unia) */
  update(id: ShapeId, patch: Partial<Shape>): void;
  remove(id: ShapeId): void;

  // TODO(ja): zmiana kolejności rysowania (na wierzch / na spód) – jakie sygnatury?

  /** Powiadamia o każdej zmianie modelu. Na etapie 2 także o zmianach z zewnątrz. */
  subscribe(listener: () => void): Unsubscribe;
}

export function createBoardStore(_initial?: BoardModel): BoardStore {
  throw new Error('TODO(ja): createBoardStore');
}
