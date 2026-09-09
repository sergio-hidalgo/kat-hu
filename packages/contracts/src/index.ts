/**
 * `@kat-hu/contracts` — the single definition of every shape that crosses the
 * boundary between `apps/client` and `apps/server`, and of the ids the
 * database stores.
 *
 * Nothing here imports from an app, and nothing here touches the network, so
 * both a browser bundle and a Nest process can depend on it.
 */

export {
  BLOCKS,
  PAGES,
  VISIBILITY_ID_PATTERN,
  allVisibilityKeys,
  visibilityKey,
  type VisibilityEntry,
  type VisibilityKind,
} from './visibility.js';

export {
  API_ERROR_CODES,
  apiError,
  apiErrorCodeSchema,
  apiErrorSchema,
  parseApiError,
  type ApiError,
  type ApiErrorCode,
} from './errors.js';

export { bookingRequestSchema, type BookingRequest } from './booking.js';

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './supabase.types.js';
