import { describe, expect, it } from 'vitest';
import { BoardIdSchema, BoardSchema } from './board.js';

describe('BoardIdSchema', () => {
  it('accepts url-safe ids', () => {
    expect(BoardIdSchema.parse('test')).toBe('test');
    expect(BoardIdSchema.parse('team_board-42')).toBe('team_board-42');
  });

  it('rejects empty and non url-safe ids', () => {
    expect(BoardIdSchema.safeParse('').success).toBe(false);
    expect(BoardIdSchema.safeParse('a/b').success).toBe(false);
    expect(BoardIdSchema.safeParse('x'.repeat(65)).success).toBe(false);
  });
});

describe('BoardSchema', () => {
  it('coerces createdAt from an ISO string (as it arrives over JSON)', () => {
    const board = BoardSchema.parse({
      id: 'b1',
      name: 'Demo',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(board.createdAt).toBeInstanceOf(Date);
  });
});
