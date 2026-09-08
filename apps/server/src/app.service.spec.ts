import { describe, expect, it } from 'vitest';
import { AppService } from './app.service';

describe('AppService', () => {
  const service = new AppService();

  it('reports a healthy status', () => {
    expect(service.getHealth()).toEqual({ status: 'ok' });
  });
});
