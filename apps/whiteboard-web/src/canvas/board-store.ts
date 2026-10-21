// TODO(ja): jedyne miejsce, przez które reszta aplikacji czyta i zmienia model tablicy.
// Na etapie 2 podmieniasz implementację na Y.Doc – sygnatury powinny zostać te same.
import type { BoardModel, Shape, ShapeId, ShapeType } from './model';

export type Unsubscribe = () => void;

const ITEM_KEYS = ['x', 'y', 'color'];

/** Pola, które `update` może zmienić, per typ kształtu. `Record` wymusza wpis dla każdego nowego `ShapeType`. */
const ALLOWED_PATCH_KEYS: Record<ShapeType, ReadonlySet<string>> = {
  rectangle: new Set([...ITEM_KEYS, 'w', 'h']),
  ellipse: new Set([...ITEM_KEYS, 'w', 'h']),
  arrow: new Set([...ITEM_KEYS, 'endX', 'endY']),
  writing: new Set([...ITEM_KEYS, 'content', 'fontSize', 'w', 'h']),
};

type PartialPatch<T> = T extends unknown ? Partial<Omit<T, 'id' | 'type'>> : never;

/** Zmiana pól istniejącego kształtu. Bez `id` i `type` (nie da się ich zmienić) – unia patchy per wariant `Shape`. */
export type ShapePatch = PartialPatch<Shape>;

export interface BoardStore {
  /**
   * Odczyt dla renderera i hit-testu. Zwraca REFERENCJĘ do aktualnego modelu (bez kopiowania).
   * To jest bezpieczne tylko dlatego, że store jest niemutowalny: nigdy nie zmienia wydanych
   * obiektów, a każda operacja zapisu tworzy nowy `BoardModel`. Zmiana modelu = nowa referencja,
   * więc `getModel() !== lastModel` wystarcza, żeby wiedzieć, że trzeba przerysować.
   * Nowe jest wszystko na ścieżce od zmiany do korzenia (kształt → `shapes` → model);
   * reszta (np. inne kształty, niezmieniony `order`) jest współdzielona ze starą wersją.
   * Konsumenci traktują zwrócony model jako read-only.
   */
  getModel(): BoardModel;
  get(id: ShapeId): Shape | undefined;

  /**
   * Dodaje kształt na wierzch (koniec `order`).
   * Id już istnieje → WYJĄTEK (fail fast). To błąd programisty (np. wklejenie bez nowego id),
   * bo przy poprawnie losowanych id (UUID/nanoid) kolizja jest praktycznie niemożliwa.
   * Niezmiennik `shapes` ↔ `order` pilnuje store, nie wywołujący.
   */
  add(shape: Shape): void;
  /**
   * `ShapePatch` odcina `id` i `type`, ale nie wie, jakiego typu jest kształt o danym id,
   * więc resztę pilnuje runtime, w tej kolejności (każdy krok potrzebuje wyniku poprzedniego):
   * 1. Id nie istnieje → no-op: bez nowego modelu i bez powiadomienia.
   *    To normalna sytuacja (wyścig: ktoś usunął kształt, który ja właśnie przesuwam), nie błąd.
   * 2. Klucz patcha spoza zbioru dozwolonych dla `type` tego kształtu → WYJĄTEK (bug programisty).
   *    `type` kształtu jest niezmienny, więc żaden wyścig nie może dać `endX` w prostokącie.
   *    Zbiór dozwolonych pól: `Record<ShapeType, ...>` – nowy typ kształtu wymusza uzupełnienie mapy.
   * 3. Pusty patch (`{}`) → no-op: zmiana, której nie było, nie daje nowej referencji.
   */
  update(id: ShapeId, patch: ShapePatch): void;
  /** Id nie istnieje → no-op (jak w `update`): bez nowego modelu i bez powiadomienia. */
  remove(id: ShapeId): void;

  // TODO(ja): zmiana kolejności rysowania (na wierzch / na spód) – jakie sygnatury?

  /**
   * Powiadamia o każdej zmianie modelu, bez opisu zmiany (wersja „coś się zmieniło").
   * Etap 1: słuchacze (renderer, React) i tak czytają `getModel()` i porównują referencje;
   * żaden nie potrzebuje listy zmienionych id. No-op (zob. `update`/`remove`) nie powiadamia.
   * Etap 2: dojdą zmiany z zewnątrz i undo, które muszą wiedzieć, czyja to zmiana –
   * wtedy rozszerzysz sygnaturę listenera (np. o `origin`).
   */
  subscribe(listener: () => void): Unsubscribe;
}

export function createBoardStore(initial: BoardModel = { shapes: {}, order: [] }): BoardStore {
  let model = initial;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    add(shape) {
      if (Object.hasOwn(model.shapes, shape.id)) {
        throw new Error(`BoardStore.add: shape with id "${shape.id}" already exists`);
      }
      model = {
        shapes: { ...model.shapes, [shape.id]: shape },
        order: [...model.order, shape.id],
      };
      notify();
    },

    getModel: () => {
      return model;
    },
    get: (id): Shape | undefined => {
      return Object.hasOwn(model.shapes, id) ? model.shapes[id] : undefined;
    },
    update: (id, patch) => {
      const shape = Object.hasOwn(model.shapes, id) ? model.shapes[id] : undefined;
      if (!shape) return;

      const keys = Object.keys(patch);
      const allowed = ALLOWED_PATCH_KEYS[shape.type];
      const forbidden = keys.find((key) => !allowed.has(key));
      if (forbidden !== undefined) {
        throw new Error(
          `BoardStore.update: key "${forbidden}" is not allowed for shape type "${shape.type}"`,
        );
      }

      if (keys.length === 0) return;

      model = {
        shapes: { ...model.shapes, [id]: { ...shape, ...patch } },
        order: model.order,
      };
      notify();
    },
    remove: (id) => {
      if (!Object.hasOwn(model.shapes, id)) return;
      const { [id]: _removed, ...rest } = model.shapes;
      model = {
        shapes: rest,
        order: model.order.filter((shapeId) => shapeId !== id),
      };
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
