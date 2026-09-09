import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { USER_PROPERTY, type AuthenticatedUser } from './current-user';
import type { Role } from './roles.decorator';

function guardFor(required: Role[] | undefined) {
  const reflector = {
    getAllAndOverride: vi.fn(() => required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

function contextFor(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ [USER_PROPERTY]: user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

const ana: AuthenticatedUser = { id: 'user-1', email: 'ana@example.com' };

describe('RolesGuard', () => {
  it('ignores a route that asks for no role', () => {
    expect(guardFor(undefined).canActivate(contextFor(ana))).toBe(true);
    expect(guardFor([]).canActivate(contextFor(ana))).toBe(true);
  });

  it('403s an anonymous request on a role-protected route', () => {
    expect(() => guardFor(['admin']).canActivate(contextFor(undefined))).toThrowError(
      ForbiddenException,
    );
  });

  it('403s a signed-in user whose role is unknown — spec 09 wires the lookup', () => {
    expect(() => guardFor(['admin']).canActivate(contextFor(ana))).toThrowError(
      ForbiddenException,
    );
  });

  it('403s a user whose role does not match', () => {
    const user: AuthenticatedUser = { ...ana, role: 'user' };
    expect(() => guardFor(['admin']).canActivate(contextFor(user))).toThrowError(
      ForbiddenException,
    );
  });

  it('admits a user whose role matches', () => {
    const admin: AuthenticatedUser = { ...ana, role: 'admin' };
    expect(guardFor(['admin']).canActivate(contextFor(admin))).toBe(true);
  });
});
