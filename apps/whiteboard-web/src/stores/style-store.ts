import { create } from 'zustand';

/** Preset palette shown in the toolbar. The first entry is the default colour for new shapes. */
export const SHAPE_COLORS = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Black', value: '#1f2937' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Pink', value: '#db2777' },
] as const;

export type ShapeColor = (typeof SHAPE_COLORS)[number]['value'];

export const DEFAULT_SHAPE_COLOR: ShapeColor = SHAPE_COLORS[0].value;

export function isShapeColor(value: string): value is ShapeColor {
  return SHAPE_COLORS.some((color) => color.value === value);
}

type StyleState = {
  /** Colour applied to shapes and texts created from now on. Existing shapes keep their own colour. */
  color: ShapeColor;
  setColor: (color: ShapeColor) => void;
};

/** UI-only state. The canvas reads it outside React via `useStyleStore.getState()` when it creates a shape. */
export const useStyleStore = create<StyleState>()((set) => ({
  color: DEFAULT_SHAPE_COLOR,
  setColor: (color) => set({ color }),
}));
