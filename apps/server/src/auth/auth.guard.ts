import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { USER_PROPERTY, type RequestWithUser } from './current-user';

/**
 * Registered globally, so a route is protected unless it says `@Public()`.
 *
 * The Astro server forwards the session's access token as
 * `Authorization: Bearer <jwt>`; the browser never calls this API with a
 * cookie (`skills/server-core`). The token is verified against Supabase
 * rather than merely decoded — an unverified JWT is a claim, not a fact.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = bearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException();

    const user = await this.supabase.userFromToken(token);
    if (!user) throw new UnauthorizedException();

    request[USER_PROPERTY] = user;
    return true;
  }
}

/**
 * The token out of an `Authorization` header, or `null`. Exported so the
 * parsing rules are testable without building an execution context.
 */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, ...rest] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  const token = rest.join(' ').trim();
  return token.length > 0 ? token : null;
}
