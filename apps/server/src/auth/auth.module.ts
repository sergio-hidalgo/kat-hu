import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { MeController } from './me.controller';

/**
 * Registers both guards globally, in order: authenticate, then authorize.
 * A route is reachable without a session only if it says `@Public()`, and
 * carries a role requirement only if it says `@Roles(...)`.
 */
@Module({
  controllers: [MeController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
