import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableShutdownHooks();

  const port = app.get(ConfigService<Env, true>).get('PORT', { infer: true });
  // 0.0.0.0 so the server is reachable from inside a container as well.
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}

await bootstrap();
