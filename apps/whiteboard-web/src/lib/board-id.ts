import { type BoardId, BoardIdSchema } from '@whiteboard/contracts';

/** Returns a validated board id from a route param, or `null` when the param is invalid. */
export function parseBoardIdParam(raw: string): BoardId | null {
  const result = BoardIdSchema.safeParse(decodeURIComponent(raw));
  return result.success ? result.data : null;
}
