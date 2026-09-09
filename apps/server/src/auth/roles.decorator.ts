import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'kathu:roles';

/** Roles in `public.profiles.role`. `db-schema` constrains it to these two. */
export type Role = 'user' | 'admin';

/**
 * Requires one of these roles on top of a valid session. Enforced by
 * `RolesGuard`, which reads the role from the database — never from the
 * token payload and never from the request body.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
