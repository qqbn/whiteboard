import { beforeEach, describe, expect, it } from 'vitest';
import { useSelectionStore } from './selection-store';

describe('selection store', () => {
  beforeEach(() => useSelectionStore.setState({ selectedId: null }));

  it('starts with nothing selected', () => {
    expect(useSelectionStore.getState().selectedId).toBeNull();
  });

  it('selects a shape by id', () => {
    useSelectionStore.getState().select('a');
    expect(useSelectionStore.getState().selectedId).toBe('a');
  });

  it('replaces the previous selection', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().select('b');
    expect(useSelectionStore.getState().selectedId).toBe('b');
  });

  it('clears the selection with null', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().select(null);
    expect(useSelectionStore.getState().selectedId).toBeNull();
  });
});
