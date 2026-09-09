import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type Role } from './roles.decorator';
import { USER_PROPERTY, type RequestWithUser } from './current-user';

/**
 * Runs after `AuthGuard`, on routes that carry `@Roles(...)`.
 *
 * **Scaffold.** `public.profiles` does not exist yet — spec 09 creates it,
 * along with the lookup this guard will do. Until then the honest answer to
 * "is this user an admin?" is "we cannot know", and the safe answer to that
 * is no: every `@Roles()` route denies. That is deliberate, so nothing can be
 * built on top of a role check that silently passes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request[USER_PROPERTY];
    if (!user) throw new ForbiddenException();

    /**
     * Spec 09 replaces this with `select role from profiles where id = $1`
     * through `SupabaseService`. The role never comes from the token payload
     * and never from the body (`skills/server-core`).
     */
    if (!user.role || !required.includes(user.role)) throw new ForbiddenException();

    return true;
  }
}
