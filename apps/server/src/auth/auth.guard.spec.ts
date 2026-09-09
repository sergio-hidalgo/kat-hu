import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { mockSupabaseService, testUser } from '../../test/mocks/supabase';
import { AuthGuard, bearerToken } from './auth.guard';
import { USER_PROPERTY, type RequestWithUser } from './current-user';
import { IS_PUBLIC_KEY } from './public.decorator';

function contextFor(request: Partial<RequestWithUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function reflectorSaying(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: vi.fn((key: string) => (key === IS_PUBLIC_KEY ? isPublic : undefined)),
  } as unknown as Reflector;
}

describe('bearerToken', () => {
  it.each([
    ['Bearer abc.def.ghi', 'abc.def.ghi'],
    ['bearer abc.def.ghi', 'abc.def.ghi'],
  ])('reads %s', (header, expected) => {
    expect(bearerToken(header)).toBe(expected);
  });

  it.each([undefined, '', 'abc.def.ghi', 'Basic dXNlcjpwYXNz', 'Bearer', 'Bearer   '])(
    'refuses %s',
    (header) => {
      expect(bearerToken(header)).toBeNull();
    },
  );
});

describe('AuthGuard', () => {
  let supabase: ReturnType<typeof mockSupabaseService>;

  beforeEach(() => {
    supabase = mockSupabaseService();
  });

  it('lets a @Public() route through without asking Supabase anything', async () => {
    const guard = new AuthGuard(reflectorSaying(true), supabase);
    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(true);
    expect(supabase.userFromToken).not.toHaveBeenCalled();
  });

  it('401s a guarded route with no Authorization header', async () => {
    const guard = new AuthGuard(reflectorSaying(false), supabase);
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrowError(
      UnauthorizedException,
    );
  });

  it('401s a token Supabase does not recognise', async () => {
    const guard = new AuthGuard(reflectorSaying(false), supabase);
    const context = contextFor({ headers: { authorization: 'Bearer expired.token' } });
    await expect(guard.canActivate(context)).rejects.toThrowError(UnauthorizedException);
  });

  it('attaches the user for a token Supabase verifies', async () => {
    supabase = mockSupabaseService({ userFromToken: vi.fn().mockResolvedValue(testUser) });
    const guard = new AuthGuard(reflectorSaying(false), supabase);
    const request: Partial<RequestWithUser> = {
      headers: { authorization: 'Bearer good.token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request[USER_PROPERTY]).toEqual(testUser);
    expect(supabase.userFromToken).toHaveBeenCalledWith('good.token');
  });

  it('verifies the token rather than trusting its contents', async () => {
    /**
     * A well-formed but unsigned JWT claiming to be an admin must still be
     * rejected — the guard's answer comes from Supabase, not from the payload.
     */
    const forged = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"someone","role":"admin"}')}.`;
    const guard = new AuthGuard(reflectorSaying(false), supabase);
    const context = contextFor({ headers: { authorization: `Bearer ${forged}` } });

    await expect(guard.canActivate(context)).rejects.toThrowError(UnauthorizedException);
    expect(supabase.userFromToken).toHaveBeenCalledWith(forged);
  });
});
