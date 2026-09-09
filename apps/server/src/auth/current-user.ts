import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Who is making the request, as `AuthGuard` attached them. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** Filled by `RolesGuard` when a route asks for a role; spec 09 wires it. */
  role?: 'user' | 'admin';
}

/** The property `AuthGuard` writes on the Express request. */
export const USER_PROPERTY = 'kathuUser';

export type RequestWithUser = Request & { [USER_PROPERTY]?: AuthenticatedUser };

/** `handler(@CurrentUser() user: AuthenticatedUser)` on a guarded route. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<RequestWithUser>()[USER_PROPERTY],
);
