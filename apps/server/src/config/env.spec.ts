import { describe, expect, it } from 'vitest';
import { clientOrigins, validateEnv } from './env';

const complete = {
  CLIENT_ORIGIN: 'http://localhost:4321',
  SUPABASE_URL: 'https://laokeslruyqbcezjstij.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_test_value',
};

describe('validateEnv', () => {
  it('accepts a complete environment and defaults the port', () => {
    expect(validateEnv({ ...complete }).PORT).toBe(3000);
  });

  it('coerces PORT, which arrives from the shell as a string', () => {
    expect(validateEnv({ ...complete, PORT: '4000' }).PORT).toBe(4000);
  });

  it.each(['SUPABASE_SECRET_KEY', 'SUPABASE_URL', 'CLIENT_ORIGIN'])(
    'refuses to start without %s, and names it',
    (variable) => {
      const incomplete: Record<string, unknown> = { ...complete };
      delete incomplete[variable];
      expect(() => validateEnv(incomplete)).toThrowError(new RegExp(variable));
    },
  );

  it('rejects a CLIENT_ORIGIN that lists nothing, rather than allowing everything', () => {
    expect(() => validateEnv({ ...complete, CLIENT_ORIGIN: ' , ' })).toThrowError(
      /CLIENT_ORIGIN/,
    );
  });

  it('rejects a SUPABASE_URL that is not a URL', () => {
    expect(() => validateEnv({ ...complete, SUPABASE_URL: 'laokes' })).toThrowError(
      /SUPABASE_URL/,
    );
  });

  it('never puts the secret key in the error it throws', () => {
    try {
      validateEnv({ ...complete, SUPABASE_URL: 'nope' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(String(error)).not.toContain('sb_secret_test_value');
    }
  });
});

describe('clientOrigins', () => {
  it('splits a comma-separated list and trims it', () => {
    const env = validateEnv({
      ...complete,
      CLIENT_ORIGIN: 'http://localhost:4321, https://kathu.es',
    });
    expect(clientOrigins(env)).toEqual(['http://localhost:4321', 'https://kathu.es']);
  });

  it('drops the empty entry a trailing comma leaves behind', () => {
    const env = validateEnv({ ...complete, CLIENT_ORIGIN: 'https://kathu.es,' });
    expect(clientOrigins(env)).toEqual(['https://kathu.es']);
  });
});
