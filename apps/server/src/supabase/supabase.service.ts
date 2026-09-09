import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Database } from '@kat-hu/contracts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../config/env';

/**
 * The one service-role Supabase client in the system.
 *
 * `apps/server` is the only process that holds `SUPABASE_SECRET_KEY`
 * (`skills/db-schema`), and this is the only place that key is read. Every
 * other module injects this service — nothing calls `createClient` again,
 * because a second client is a second place to get the options wrong.
 *
 * The service role bypasses RLS entirely, so every guard that protects this
 * data is a guard in Nest. Nothing here may be exposed to a route without a
 * `AuthGuard`/`RolesGuard` in front of it.
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient<Database>;

  constructor(config: ConfigService<Env, true>) {
    this.client = createClient<Database>(
      config.get('SUPABASE_URL', { infer: true }),
      config.get('SUPABASE_SECRET_KEY', { infer: true }),
      {
        auth: {
          /**
           * A server has no session of its own: it acts as the service role,
           * or it acts on a token it was handed. Persisting or refreshing
           * anything here would leak one request's identity into the next.
           */
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  /**
   * Verify a visitor's access token and return who they are.
   * `AuthGuard` is the only caller; it is here so no controller ever touches
   * a Supabase client directly (`skills/server-core`).
   */
  async userFromToken(token: string): Promise<{ id: string; email: string | null } | null> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  }
}
