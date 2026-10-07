import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { type Redis } from 'ioredis';
import { type Database, DRIZZLE } from '../db/db.module.js';
import { REDIS } from '../redis/redis.module.js';
import { describeError } from '../common/describe-error.js';

export type CheckStatus = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'error';
  checks: Record<'postgres' | 'redis', { status: CheckStatus; error?: string }>;
}

const CHECK_TIMEOUT_MS = 1_500;

@Injectable()
export class HealthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthReport> {
    const [postgres, redis] = await Promise.all([
      probe(() => this.db.execute(sql`select 1`)),
      probe(() => this.redis.ping()),
    ]);
    const status = postgres.status === 'up' && redis.status === 'up' ? 'ok' : 'error';
    return { status, checks: { postgres, redis } };
  }
}

async function probe(fn: () => Promise<unknown>): Promise<{ status: CheckStatus; error?: string }> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
      CHECK_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([fn(), timeout]);
    return { status: 'up' };
  } catch (err) {
    return { status: 'down', error: describeError(err) };
  } finally {
    clearTimeout(timer);
  }
}
