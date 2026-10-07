/** Drizzle wraps the driver error in `cause`; Node's ECONNREFUSED is an AggregateError with an empty message. */
export function describeError(err: unknown): string {
  const root = err instanceof Error && err.cause instanceof Error ? err.cause : err;
  if (!(root instanceof Error)) return String(root);
  const code = (root as NodeJS.ErrnoException).code;
  return root.message || code || root.name;
}
