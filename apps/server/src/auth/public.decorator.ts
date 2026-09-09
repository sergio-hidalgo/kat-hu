import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'kathu:isPublic';

/**
 * Opens a route to anyone. Everything is guarded by default (`AuthGuard` is
 * registered globally), so reachability without a session is a decision that
 * has to be written down — this decorator is where it is written.
 *
 * Today only `GET /health` carries it.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
