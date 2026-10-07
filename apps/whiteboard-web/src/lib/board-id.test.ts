import { describe, expect, it } from 'vitest';
import { parseBoardIdParam } from './board-id';

describe('parseBoardIdParam', () => {
  it('returns the id for a valid param', () => {
    expect(parseBoardIdParam('test')).toBe('test');
  });

  it('returns null for an invalid param', () => {
    expect(parseBoardIdParam('has%20space')).toBeNull();
    expect(parseBoardIdParam('')).toBeNull();
  });
});
