import { describe, expect, it } from 'vitest';
import { fontFor, lineHeightOf, measureWriting, splitLines } from './text';

// 10 units per character, regardless of the font: keeps the expectations easy to read.
const tenPerChar = (line: string) => line.length * 10;

describe('measureWriting', () => {
  it('measures a single line', () => {
    expect(measureWriting('hello', 20, tenPerChar)).toEqual({ w: 50, h: lineHeightOf(20) });
  });

  it('uses the widest line for the width and the line count for the height', () => {
    expect(measureWriting('ab\nabcd\nabc', 20, tenPerChar)).toEqual({
      w: 40,
      h: 3 * lineHeightOf(20),
    });
  });

  it('counts a trailing newline as an (empty) extra line', () => {
    expect(measureWriting('ab\n', 20, tenPerChar)).toEqual({ w: 20, h: 2 * lineHeightOf(20) });
  });

  it('gives an empty text zero width but one line of height', () => {
    expect(measureWriting('', 20, tenPerChar)).toEqual({ w: 0, h: lineHeightOf(20) });
  });

  it('passes the font built from the font size to the measurer', () => {
    const fonts: string[] = [];
    measureWriting('a', 18, (_line, font) => (fonts.push(font), 0));
    expect(fonts).toEqual([fontFor(18)]);
  });
});

describe('splitLines', () => {
  it('splits on newlines', () => {
    expect(splitLines('a\nb')).toEqual(['a', 'b']);
  });
});
