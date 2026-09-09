import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { clientOrigins, type Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Env, true>);
  const env = {
    PORT: config.get('PORT', { infer: true }),
    CLIENT_ORIGIN: config.get('CLIENT_ORIGIN', { infer: true }),
  } as Env;

  /**
   * Only the Astro client may call this API from a browser. There is no
   * wildcard and no reflected origin: an unlisted origin gets no
   * `Access-Control-Allow-Origin` header at all.
   */
  app.enableCors({
    origin: clientOrigins(env),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  /** One error shape for everything that escapes a handler. */
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.PORT);
  new Logger('bootstrap').log(`kat-hu API listening on http://localhost:${env.PORT}`);
}

/**
 * A bootstrap failure must end the process with the reason on stderr and a
 * non-zero code, not an unhandled rejection warning. An invalid environment
 * throws earlier still — `ConfigModule.forRoot` runs while `AppModule` is
 * being decorated, so Nest reports that one itself and exits 1.
 */
void bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
