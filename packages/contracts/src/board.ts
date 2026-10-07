import { z } from 'zod';

/** Board id as it appears in the URL (`/board/[id]`) and in the `boards.id` column. */
export const BoardIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, 'Board id may contain only letters, digits, "-" and "_"');

export type BoardId = z.infer<typeof BoardIdSchema>;

export const BoardSchema = z.object({
  id: BoardIdSchema,
  name: z.string().trim().min(1).max(200),
  createdAt: z.coerce.date(),
});

export type Board = z.infer<typeof BoardSchema>;
