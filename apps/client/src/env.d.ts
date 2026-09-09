interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly PUBLIC_SANITY_API_VERSION?: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  /** Where the Nest API lives. Defaults to http://localhost:3000 in dev. */
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  /**
   * Set once per request by `src/middleware.ts` and read by any page.
   * Both fields are stubs in spec 04; specs 09 and 10 fill them.
   */
  interface Locals {
    /** Which blocks and pages this visitor may see, keyed as `block:hero`. */
    flags: import('./lib/flags').Flags;
    /** The signed-in visitor, or null. Always null until spec 09. */
    session: import('./lib/session').Session | null;
  }
}
