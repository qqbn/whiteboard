// TODO(ja): model dokumentu – zwykły obiekt, bez zależności od widoku (na etapie 2 podmienisz na Y.Doc).
import type { ToolType } from '@/stores/tool-store';

export type ShapeId = string;

// TODO(ja): zdecyduj, co mają wspólnego wszystkie kształty (id, x, y, w, h, rotation?...)
// i czy `Shape` to unia dyskryminowana po polu `type`.
export type ShapeType = Exclude<ToolType, 'select' | 'pen'>;

export type Shape = {
  id: ShapeId;
  type: ShapeType;
  // TODO(ja): pola geometrii i stylu
};

export type BoardModel = {
  // TODO(ja): kolekcja kształtów + kolejność rysowania (z-index)
  shapes: Record<ShapeId, Shape>;
};
