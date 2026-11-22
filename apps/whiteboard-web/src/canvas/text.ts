/** Default font size of a new text, in world units (it scales with the camera like every other shape). */
export const DEFAULT_FONT_SIZE = 24;
export const FONT_FAMILY = 'system-ui, sans-serif';
/** Line height as a multiple of the font size. The canvas and the HTML editor MUST use the same value. */
export const LINE_HEIGHT_FACTOR = 1.25;

/** Value for `ctx.font` (and, with the same parts, for the CSS of the editor overlay). */
export function fontFor(fontSize: number): string {
  return `${fontSize}px ${FONT_FAMILY}`;
}

/** Height of one line in world units. */
export function lineHeightOf(fontSize: number): number {
  return fontSize * LINE_HEIGHT_FACTOR;
}

/** Lines of a text. A `<textarea>` always uses `\n`, so no `\r\n` handling is needed. */
export function splitLines(content: string): string[] {
  return content.split('\n');
}

/** Returns the width of one line of text in the given CSS `font`, in the unit of the font size. */
export type MeasureLine = (line: string, font: string) => number;

/** Shared, never attached to the DOM. Created lazily because modules are also imported in Node (tests, SSR). */
let measureContext: CanvasRenderingContext2D | null | undefined;

/**
 * Default measurer: `measureText` of an offscreen canvas context. Falls back to a rough "0.6 × font
 * size per character" estimate when there is no canvas (e.g. in Node), so layout code never crashes.
 */
const measureWithCanvas: MeasureLine = (line, font) => {
  if (measureContext === undefined) {
    measureContext =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  }
  if (!measureContext) return line.length * parseFloat(font) * 0.6;
  measureContext.font = font;
  return measureContext.measureText(line).width;
};

/**
 * Size of a text box in world units: the width of the widest line and `lineCount × lineHeight`.
 * The model stores `w` and `h` of a `writing` (hit-testing and the selection outline need them without
 * a canvas context), so whoever creates or edits a text has to recompute them with this function.
 * `measureLine` is injectable so the maths can be tested without a canvas.
 */
export function measureWriting(
  content: string,
  fontSize: number,
  measureLine: MeasureLine = measureWithCanvas,
): { w: number; h: number } {
  const font = fontFor(fontSize);
  const lines = splitLines(content);
  const w = Math.max(...lines.map((line) => measureLine(line, font)));
  return { w, h: lines.length * lineHeightOf(fontSize) };
}
