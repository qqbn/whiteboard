import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { DRIZZLE } from '../db/db.module.js';
import { REDIS } from '../redis/redis.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

async function createController(deps: { dbOk: boolean; redisOk: boolean }) {
  const db = {
    execute: vi.fn(() =>
      deps.dbOk ? Promise.resolve([]) : Promise.reject(new Error('ECONNREFUSED')),
    ),
  };
  const redis = {
    ping: vi.fn(() => (deps.redisOk ? Promise.resolve('PONG') : Promise.reject(new Error('down')))),
  };

  // HealthController receives HealthService by *type* – this also proves that Vitest's
  // transform emits decorator metadata, which Nest DI relies on.
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      { provide: DRIZZLE, useValue: db },
      { provide: REDIS, useValue: redis },
    ],
  }).compile();

  return moduleRef.get(HealthController);
}

describe('HealthController', () => {
  it('returns ok when Postgres and Redis respond', async () => {
    const controller = await createController({ dbOk: true, redisOk: true });

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      checks: { postgres: { status: 'up' }, redis: { status: 'up' } },
    });
  });

  it('throws 503 with details when a dependency is down', async () => {
    const controller = await createController({ dbOk: false, redisOk: true });

    const error = await controller.check().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      status: 'error',
      checks: { postgres: { status: 'down', error: 'ECONNREFUSED' }, redis: { status: 'up' } },
    });
  });
});
