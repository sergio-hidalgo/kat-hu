import { describe, expect, it } from 'vitest';
import {
  API_ERROR_CODES,
  apiError,
  apiErrorSchema,
  parseApiError,
} from './errors.js';

describe('apiErrorSchema', () => {
  it('accepts the documented shape', () => {
    const parsed = apiErrorSchema.parse({
      code: 'booking.rate_limited',
      message: 'Espera un momento antes de volver a enviar.',
      details: { email: 'Escribe un email válido' },
    });
    expect(parsed.code).toBe('booking.rate_limited');
    expect(parsed.details.email).toBe('Escribe un email válido');
  });

  it('defaults details so callers never guard for undefined', () => {
    expect(apiErrorSchema.parse({ code: 'auth.forbidden', message: 'No.' }).details).toEqual({});
  });

  it('rejects a code that is not domain.reason', () => {
    expect(apiErrorSchema.safeParse({ code: 'Forbidden', message: 'No.' }).success).toBe(false);
  });

  it('rejects an empty message, so nothing renders a blank error', () => {
    expect(apiErrorSchema.safeParse({ code: 'auth.forbidden', message: '' }).success).toBe(false);
  });
});

describe('every documented code', () => {
  it('is itself a valid code', () => {
    for (const code of Object.values(API_ERROR_CODES)) {
      expect(apiErrorSchema.safeParse(apiError(code, 'Vaya.')).success, code).toBe(true);
    }
  });
});

describe('parseApiError', () => {
  it('returns null instead of throwing on a body that is not ours', () => {
    expect(parseApiError('<html>502 Bad Gateway</html>')).toBeNull();
    expect(parseApiError(undefined)).toBeNull();
  });
});
