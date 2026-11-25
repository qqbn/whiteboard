import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SHAPE_COLOR, isShapeColor, SHAPE_COLORS, useStyleStore } from './style-store';

describe('style store', () => {
  beforeEach(() => useStyleStore.setState({ color: DEFAULT_SHAPE_COLOR }));

  it('starts with the first palette colour', () => {
    expect(useStyleStore.getState().color).toBe(SHAPE_COLORS[0].value);
  });

  it('switches the colour for new shapes', () => {
    useStyleStore.getState().setColor('#dc2626');
    expect(useStyleStore.getState().color).toBe('#dc2626');
  });

  it('recognises palette colours only', () => {
    expect(isShapeColor('#16a34a')).toBe(true);
    expect(isShapeColor('')).toBe(false);
    expect(isShapeColor('#123456')).toBe(false);
  });
});
