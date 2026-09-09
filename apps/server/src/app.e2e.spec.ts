import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { apiErrorSchema } from '@kat-hu/contracts';
import request from 'supertest';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { MeController } from './auth/me.controller';
import { HealthController } from './health/health.controller';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { SupabaseService } from './supabase/supabase.service';
import { mockSupabaseService, testUser } from '../test/mocks/supabase';
import { vi } from 'vitest';

/**
 * The routes as a client actually meets them: guards registered globally, the
 * filter shaping every failure. Supabase is the scripted mock — no project,
 * no network (`skills/testing`).
 *
 * This is the automated half of spec 04's `curl` acceptance criteria.
 */
describe('the API surface', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController, MeController],
      providers: [
        {
          provide: SupabaseService,
          useValue: mockSupabaseService({
            userFromToken: vi.fn(async (token: string) =>
              token === 'good.token' ? testUser : null,
            ),
          }),
        },
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is public and says ok', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /me without a token is 401 in the documented error shape', async () => {
    const response = await request(app.getHttpServer()).get('/me');
    expect(response.status).toBe(401);
    expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
    expect(response.body).toEqual({
      code: 'auth.unauthorized',
      message: 'Necesitas iniciar sesión para hacer esto.',
      details: {},
    });
  });

  it('GET /me with a token Supabase rejects is also 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer stale.token');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('auth.unauthorized');
  });

  it('GET /me with a verified token returns who you are', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer good.token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(testUser);
  });

  it('an unknown route fails in our shape, not Nest’s default', async () => {
    const response = await request(app.getHttpServer()).get('/no-such-route');
    expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
    expect(response.body).not.toHaveProperty('statusCode');
  });
});
