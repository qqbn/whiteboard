import { beforeEach, describe, expect, it } from 'vitest';
import { isToolType, useToolStore } from './tool-store';

describe('tool store', () => {
  beforeEach(() => useToolStore.setState({ activeTool: 'select' }));

  it('starts with the select tool', () => {
    expect(useToolStore.getState().activeTool).toBe('select');
  });

  it('switches the active tool', () => {
    useToolStore.getState().setTool('ellipse');
    expect(useToolStore.getState().activeTool).toBe('ellipse');
  });

  it('recognises valid tool names only', () => {
    expect(isToolType('arrow')).toBe(true);
    expect(isToolType('')).toBe(false);
    expect(isToolType('laser')).toBe(false);
  });
});
