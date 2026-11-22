import { create } from 'zustand';
import type { ShapeId } from '@/canvas/model';

/**
 * A text that is being typed right now. Until it is committed it lives only here (not in the board
 * model), so abandoning an empty text leaves no trace in the document.
 * - `id`: the existing `writing` being edited, or `null` for a brand new one.
 * - `x, y`: top-left corner of the text box in world coordinates.
 * - `session`: increases on every `begin`; the editor uses it as a React `key`, so each edit starts
 *   with fresh local state even when two edits follow each other.
 */
export type TextEdit = {
  session: number;
  id: ShapeId | null;
  x: number;
  y: number;
  content: string;
  fontSize: number;
  color: string;
};

type TextEditState = {
  /** The edit in progress, or `null` when the user is not typing a text. */
  edit: TextEdit | null;
  /** Starts editing (replaces any edit in progress; the caller commits that one first if it matters). */
  begin: (edit: Omit<TextEdit, 'session'>) => void;
  /** Ends editing without touching the board; committing to the store is the editor's job. */
  end: () => void;
};

let nextSession = 0;

/**
 * UI-only state, like the selection: which text the local user is typing is not part of the document.
 * The render loop reads it outside React (via `getState()`) to hide the shape being edited, so the
 * canvas does not draw the old text under the `<textarea>`.
 */
export const useTextEditStore = create<TextEditState>()((set) => ({
  edit: null,
  begin: (edit) => set({ edit: { ...edit, session: ++nextSession } }),
  end: () => set({ edit: null }),
}));
