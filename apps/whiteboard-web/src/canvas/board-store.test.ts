import { describe, expect, test, vi } from 'vitest';
import { createBoardStore } from './board-store';
import type { Arrow, Rectangle } from './model';

const rect = (id: string, overrides: Partial<Rectangle> = {}): Rectangle => ({
  id,
  type: 'rectangle',
  x: 0,
  y: 0,
  w: 10,
  h: 10,
  color: '#000',
  ...overrides,
});

const arrow = (id: string): Arrow => ({
  id,
  type: 'arrow',
  x: 0,
  y: 0,
  endX: 5,
  endY: 5,
  color: '#000',
});

describe('board-store', () => {
  describe('add', () => {
    test('appends the shape to the end of order and adds it to shapes', () => {
      const store = createBoardStore();
      const a = rect('a');
      const b = rect('b');
      store.add(a);
      store.add(b);

      expect(store.getModel().order).toEqual(['a', 'b']);
      expect(store.get('a')).toBe(a);
      expect(store.get('b')).toBe(b);
    });

    test('throws on duplicate id without changing the model or notifying', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      const listener = vi.fn();
      store.subscribe(listener);

      expect(() => store.add(rect('a'))).toThrow();
      expect(store.getModel()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    test('does not mutate a previously returned model', () => {
      const store = createBoardStore();
      const before = store.getModel();
      store.add(rect('a'));

      expect(before.order).toEqual([]);
      expect(before.shapes).toEqual({});
      expect(store.getModel()).not.toBe(before);
    });

    test('notifies the listener once', () => {
      const store = createBoardStore();
      const listener = vi.fn();
      store.subscribe(listener);
      store.add(rect('a'));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('get / getModel', () => {
    test('get returns undefined for a missing id', () => {
      expect(createBoardStore().get('nope')).toBeUndefined();
    });

    test.each(['toString', 'constructor', 'hasOwnProperty'])(
      'get("%s") does not return anything from the prototype',
      (id) => {
        expect(createBoardStore().get(id)).toBeUndefined();
      },
    );

    test('a shape with id "toString" can be added and read back', () => {
      const store = createBoardStore();
      const s = rect('toString');
      store.add(s);

      expect(store.get('toString')).toBe(s);
    });

    test('getModel returns the same reference until something changes', () => {
      const store = createBoardStore();
      store.add(rect('a'));

      expect(store.getModel()).toBe(store.getModel());
    });

    test('createBoardStore accepts an initial model', () => {
      const a = rect('a');
      const store = createBoardStore({ shapes: { a }, order: ['a'] });

      expect(store.get('a')).toBe(a);
    });
  });

  describe('update', () => {
    test('changes shape fields and creates a new model', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      store.update('a', { x: 5, w: 20 });

      expect(store.get('a')).toMatchObject({ id: 'a', type: 'rectangle', x: 5, w: 20, h: 10 });
      expect(store.getModel()).not.toBe(before);
    });

    test('does not mutate the old shape', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const oldShape = store.get('a');
      store.update('a', { x: 5 });

      expect(oldShape).toMatchObject({ x: 0 });
      expect(store.get('a')).not.toBe(oldShape);
    });

    test('shares order and unchanged shapes with the previous version', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      store.add(rect('b'));
      const before = store.getModel();
      store.update('a', { x: 5 });
      const after = store.getModel();

      expect(after.order).toBe(before.order);
      expect(after.shapes['b']).toBe(before.shapes['b']);
      expect(after.shapes['a']).not.toBe(before.shapes['a']);
    });

    test('notifies the listener once', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const listener = vi.fn();
      store.subscribe(listener);
      store.update('a', { x: 5 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('missing id is a no-op: no new model, no notification', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      const listener = vi.fn();
      store.subscribe(listener);
      store.update('nope', { x: 5 });

      expect(store.getModel()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    test('empty patch is a no-op: no new model, no notification', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      const listener = vi.fn();
      store.subscribe(listener);
      store.update('a', {});

      expect(store.getModel()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    test('throws on a key not allowed for the shape type and changes nothing', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      const listener = vi.fn();
      store.subscribe(listener);

      // `endX` is valid for the patch union but not for a rectangle, so only the runtime check catches it
      expect(() => store.update('a', { endX: 1 })).toThrow(/endX/);
      expect(store.getModel()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    test('the same key is allowed for the matching shape type', () => {
      const store = createBoardStore();
      store.add(arrow('a'));
      store.update('a', { endX: 1 });

      expect(store.get('a')).toMatchObject({ endX: 1 });
    });

    test.each(['id', 'type'])('throws on "%s" smuggled in at runtime', (key) => {
      const store = createBoardStore();
      store.add(rect('a'));

      expect(() => store.update('a', { [key]: 'x' })).toThrow();
    });
  });

  describe('remove', () => {
    test('removes the shape from shapes and order', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      store.add(rect('b'));
      store.add(rect('c'));
      store.remove('b');

      expect(store.get('b')).toBeUndefined();
      expect(store.getModel().order).toEqual(['a', 'c']);
      expect(Object.keys(store.getModel().shapes)).toEqual(['a', 'c']);
    });

    test('does not mutate the old model', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      store.remove('a');

      expect(before.order).toEqual(['a']);
      expect(before.shapes['a']).toBeDefined();
      expect(store.getModel()).not.toBe(before);
    });

    test('notifies the listener once', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const listener = vi.fn();
      store.subscribe(listener);
      store.remove('a');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('missing id is a no-op: no new model, no notification', () => {
      const store = createBoardStore();
      store.add(rect('a'));
      const before = store.getModel();
      const listener = vi.fn();
      store.subscribe(listener);
      store.remove('nope');

      expect(store.getModel()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    test('listener is not called after unsubscribe', () => {
      const store = createBoardStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.add(rect('a'));
      unsubscribe();
      store.add(rect('b'));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('unsubscribe can be called multiple times', () => {
      const store = createBoardStore();
      const unsubscribe = store.subscribe(vi.fn());

      expect(() => {
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });

    test('unsubscribing during a notification does not break the loop', () => {
      const store = createBoardStore();
      const second = vi.fn();
      const unsubscribeFirst = store.subscribe(() => unsubscribeFirst());
      store.subscribe(second);
      store.add(rect('a'));

      expect(second).toHaveBeenCalledTimes(1);
    });

    test('listener already sees the new model', () => {
      const store = createBoardStore();
      let seen: string[] = [];
      store.subscribe(() => {
        seen = store.getModel().order;
      });
      store.add(rect('a'));

      expect(seen).toEqual(['a']);
    });
  });
});
