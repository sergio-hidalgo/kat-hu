import { describe, expect, it } from 'vitest';
import { bookingRequestSchema } from '@kat-hu/contracts';
import { ZodError } from 'zod';
import { toApiError } from './api-exception.filter';
import { ZodValidationPipe } from './zod-validation.pipe';

const valid = {
  name: 'Ana García',
  email: 'ana@example.com',
  concern: 'Mochi se esconde desde la mudanza y no sé cómo acompañarle.',
  consent: true,
};

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(bookingRequestSchema);

  it('returns the parsed value for a good payload', () => {
    expect(pipe.transform(valid).email).toBe('ana@example.com');
  });

  it('throws a ZodError the filter can shape', () => {
    expect(() => pipe.transform({ ...valid, email: 'ana@' })).toThrowError(ZodError);
  });

  it('reaches the client as a field error, not a 500', () => {
    try {
      pipe.transform({ ...valid, email: 'ana@' });
      expect.unreachable('should have thrown');
    } catch (error) {
      const { status, body } = toApiError(error);
      expect(status).toBe(400);
      expect(body.details).toHaveProperty('email');
    }
  });
});
