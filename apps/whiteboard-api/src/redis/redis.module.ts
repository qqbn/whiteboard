import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.schema.js';
import { describeError } from '../common/describe-error.js';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const logger = new Logger('Redis');
        const redis = new Redis(config.get('REDIS_URL', { infer: true }), {
          // Fail commands immediately while disconnected instead of queueing them forever,
          // so /health reports "down" instead of hanging when Redis is not running.
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
        });
        // Without an 'error' listener ioredis prints "Unhandled error event" on every retry.
        let reportedDown = false;
        redis.on('error', (err) => {
          if (!reportedDown) logger.warn(`Redis unavailable: ${describeError(err)}`);
          reportedDown = true;
        });
        redis.on('ready', () => {
          reportedDown = false;
          logger.log('Redis connected');
        });
        return redis;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  onApplicationShutdown() {
    this.redis.disconnect();
  }
}
