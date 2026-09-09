import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

/**
 * Nothing is discovered implicitly — every module is listed here
 * (`skills/server-core`). Feature modules land alongside `HealthModule`:
 * `BookingsModule` (spec 06), `AdminModule` (spec 10).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      /** Read before anything can ask for a variable, and fail loudly if wrong. */
      validate: validateEnv,
      cache: true,
    }),
    SupabaseModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
