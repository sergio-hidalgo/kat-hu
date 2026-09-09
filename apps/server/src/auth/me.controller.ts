import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from './current-user';

/**
 * The smallest possible guarded route: it exists so that "everything is
 * protected by default" is something you can `curl`, not just something the
 * skill claims.
 *
 * Without a valid token `AuthGuard` answers 401 in the documented error
 * shape. Spec 09 gives it a real body (profile, role) once sessions exist.
 */
@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
