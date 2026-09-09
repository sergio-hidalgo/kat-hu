import { vi } from 'vitest';
import type { SupabaseService } from '../../src/supabase/supabase.service';

/**
 * A scripted stand-in for `SupabaseService` — only the methods the code under
 * test actually calls, returning programmed results (`skills/testing`).
 * Never a real project, never the network.
 */
export function mockSupabaseService(
  overrides: Partial<SupabaseService> = {},
): SupabaseService {
  return {
    client: {} as SupabaseService['client'],
    userFromToken: vi.fn().mockResolvedValue(null),
    ...overrides,
  } as SupabaseService;
}

/** A synthetic signed-in visitor. */
export const testUser = { id: '00000000-0000-4000-8000-000000000001', email: 'ana@example.com' };
