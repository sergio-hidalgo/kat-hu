import { describe, expect, it } from 'vitest';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { apiErrorSchema } from '@kat-hu/contracts';
import { z } from 'zod';
import { toApiError } from './api-exception.filter';

describe('toApiError', () => {
  it('maps 401 to the documented shape', () => {
    const { status, body } = toApiError(new UnauthorizedException());
    expect(status).toBe(401);
    expect(body).toEqual({
      code: 'auth.unauthorized',
      message: 'Necesitas iniciar sesión para hacer esto.',
      details: {},
    });
  });

  it('maps 403 to auth.forbidden', () => {
    expect(toApiError(new ForbiddenException()).body.code).toBe('auth.forbidden');
  });

  it('turns a Zod failure into per-field Spanish messages', () => {
    const schema = z.object({ email: z.email('Escribe un email válido') });
    const failure = schema.safeParse({ email: 'ana@' });
    expect(failure.success).toBe(false);

    const { status, body } = toApiError(failure.error);
    expect(status).toBe(400);
    expect(body.code).toBe('request.validation_failed');
    expect(body.details).toEqual({ email: 'Escribe un email válido' });
  });

  it('lets a service state its own code and message', () => {
    const { body } = toApiError(
      new HttpException(
        { code: 'booking.rate_limited', message: 'Espera un momento antes de volver a enviar.' },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
    expect(body.code).toBe('booking.rate_limited');
  });

  it('never leaks an unexpected error, only a 500 in our shape', () => {
    const { status, body } = toApiError(
      new Error('duplicate key value violates unique constraint "post_likes_pkey"'),
    );
    expect(status).toBe(500);
    expect(body.code).toBe('server.internal_error');
    expect(JSON.stringify(body)).not.toContain('post_likes_pkey');
  });

  it('produces something the shared contract accepts, whatever was thrown', () => {
    for (const thrown of [
      new UnauthorizedException(),
      new Error('boom'),
      'a string',
      undefined,
      new HttpException('Teapot', 418),
    ]) {
      expect(apiErrorSchema.safeParse(toApiError(thrown).body).success).toBe(true);
    }
  });
});
