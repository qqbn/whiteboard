import { create } from 'zustand';

export const TOOLS = ['select', 'rectangle', 'ellipse', 'arrow', 'text', 'pen'] as const;
export type ToolType = (typeof TOOLS)[number];

export function isToolType(value: string): value is ToolType {
  return (TOOLS as readonly string[]).includes(value);
}

type ToolState = {
  activeTool: ToolType;
  setTool: (tool: ToolType) => void;
};

/** UI-only state. The canvas loop can read it outside React via `useToolStore.getState()`. */
export const useToolStore = create<ToolState>()((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
}));
