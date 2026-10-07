import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const boards = pgTable('boards', {
  // Text, not uuid: ids are URL slugs validated by BoardIdSchema in @whiteboard/contracts.
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
