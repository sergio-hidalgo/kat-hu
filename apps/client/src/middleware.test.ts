import { describe, expect, it, vi } from 'vitest';
import type { APIContext, MiddlewareNext } from 'astro';
import { onRequest } from './middleware';
import { defaultFlags } from './lib/flags';

/** Just enough context for the middleware: it only writes to `locals`. */
function contextWithLocals() {
  const context = { locals: {} } as APIContext;
  const next = vi.fn(async () => new Response('ok')) as unknown as MiddlewareNext;
  return { context, next };
}

describe('onRequest', () => {
  it('puts flags and session on locals before the page renders', async () => {
    const { context, next } = contextWithLocals();

    await onRequest(context, next);

    expect(context.locals.flags).toEqual(defaultFlags());
    /* Nobody can be signed in until spec 09 wires Supabase Auth. */
    expect(context.locals.session).toBeNull();
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes the response through untouched', async () => {
    const { context, next } = contextWithLocals();
    const response = await onRequest(context, next);
    expect(await (response as Response).text()).toBe('ok');
  });
});
