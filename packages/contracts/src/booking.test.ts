import { describe, expect, it } from 'vitest';
import { bookingRequestSchema } from './booking.js';

/** Synthetic, per the `testing` skill — never a real booking. */
const valid = {
  name: 'Ana García',
  email: 'ana@example.com',
  phone: '+34 600 000 001',
  family: 'Ana y Mochi, un gato de 4 años.',
  concern: 'Mochi se esconde desde la mudanza y no sé cómo acompañarle.',
  preferredFranja: 'Tardes entre semana',
  consent: true,
};

describe('bookingRequestSchema', () => {
  it('accepts a complete request', () => {
    expect(bookingRequestSchema.parse(valid)).toMatchObject({ email: 'ana@example.com' });
  });

  it('accepts one with only the required fields', () => {
    const { name, email, concern, consent } = valid;
    expect(bookingRequestSchema.safeParse({ name, email, concern, consent }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, email: 'ana@' }).success).toBe(false);
  });

  it('rejects a submission without active consent', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it('rejects a concern too short to act on', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, concern: 'hola' }).success).toBe(false);
  });

  it('trims, so whitespace is never stored as a name', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });
});
