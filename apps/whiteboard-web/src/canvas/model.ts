export type ShapeId = string;

export type Shape = Rectangle | Ellipse | Arrow | Writing;

export type ShapeType = Shape['type'];

export type Item = {
  id: ShapeId;
  x: number;
  y: number;
  color: string;
};

export type Ellipse = Item &
  Omit<Rectangle, 'type'> & {
    type: 'ellipse';
  };

/**
 * `x, y` – początek strzałki (współrzędne świata).
 * `endX, endY` – WZGLĘDNE: przesunięcie końca od początku, nie pozycja na świecie.
 * Koniec w świecie to `(x + endX, y + endY)`, więc przesunięcie strzałki zmienia tylko `x, y`.
 */
export type Arrow = Item & {
  type: 'arrow';
  endX: number;
  endY: number;
};

export type Writing = Item & {
  content: string;
  fontSize: number;
  type: 'writing';
  h: number;
  w: number;
};

export type Rectangle = Item & {
  w: number;
  h: number;
  type: 'rectangle';
};

export type BoardModel = {
  /** Dostęp po id w O(1). Nie niesie informacji o kolejności. */
  shapes: Record<ShapeId, Shape>;
  /**
   * Kolejność rysowania: pierwszy element jest na samym spodzie, ostatni na wierzchu.
   * Każde id z `order` musi istnieć w `shapes` i odwrotnie.
   */
  order: ShapeId[];
};
