import { create } from 'zustand';
import type { ShapeId } from '@/canvas/model';

type SelectionState = {
  /** Id of the selected shape, or `null` when nothing is selected. */
  selectedId: ShapeId | null;
  /** Selects the shape with this id, or clears the selection when given `null`. */
  select: (id: ShapeId | null) => void;
};

/**
 * UI-only state: the selection belongs to the local user's view, not to the document, so it must
 * never end up in the board model (in stage 2 it must not go into the shared Y.Doc either).
 * The renderer reads it outside React via `useSelectionStore.getState()`.
 */
export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedId: null,
  select: (selectedId) => set({ selectedId }),
}));
