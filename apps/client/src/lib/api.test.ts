import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, apiUrl } from './api';

function respondWith(body: unknown, init: ResponseInit = {}) {
  const status = init.status ?? 200;
  /* 204 and friends may not carry a body at all — `new Response` enforces it. */
  const payload =
    status === 204 || status === 304
      ? null
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  const response = new Response(payload, { status, ...init });
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiUrl', () => {
  it('joins the base and the path with exactly one slash', () => {
    expect(apiUrl('/health')).toBe('http://localhost:3000/health');
    expect(apiUrl('health')).toBe('http://localhost:3000/health');
  });
});

describe('api', () => {
  it('returns the parsed body on success', async () => {
    respondWith({ status: 'ok' });
    const result = await api<{ status: string }>('/health');
    expect(result).toEqual({ ok: true, data: { status: 'ok' } });
  });

  it('sends a bearer token when it is given one, and none when it is not', async () => {
    const fetchMock = respondWith({ status: 'ok' });

    await api('/me', { accessToken: 'good.token' });
    let headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get('Authorization')).toBe('Bearer good.token');

    await api('/health');
    headers = new Headers(fetchMock.mock.calls[1]![1]!.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('POSTs JSON when given `json`, and GETs otherwise', async () => {
    const fetchMock = respondWith({ ok: true });

    await api('/bookings', { json: { name: 'Ana García' } });
    expect(fetchMock.mock.calls[0]![1]!.method).toBe('POST');
    expect(fetchMock.mock.calls[0]![1]!.body).toBe('{"name":"Ana García"}');

    await api('/health');
    expect(fetchMock.mock.calls[1]![1]!.method).toBe('GET');
  });

  it('surfaces the API error shape, including per-field messages', async () => {
    respondWith(
      {
        code: 'request.validation_failed',
        message: 'Revisa los datos e inténtalo de nuevo.',
        details: { email: 'Escribe un email válido' },
      },
      { status: 400 },
    );

    const result = await api('/bookings', { json: {} });
    expect(result).toMatchObject({
      ok: false,
      status: 400,
      error: { code: 'request.validation_failed', details: { email: 'Escribe un email válido' } },
    });
  });

  it('turns a body that is not ours into a generic error, never renders it raw', async () => {
    respondWith('<html><body>502 Bad Gateway</body></html>', { status: 502 });

    const result = await api('/bookings', { json: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('server.internal_error');
    expect(JSON.stringify(result.error)).not.toContain('Bad Gateway');
  });

  it('reports an unreachable API instead of throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    const result = await api('/health');
    expect(result).toMatchObject({ ok: false, status: 0, error: { code: 'network.unreachable' } });
  });

  it('handles an empty 204 body without throwing', async () => {
    respondWith(null, { status: 204 });
    await expect(api('/admin/visibility/block:hero')).resolves.toEqual({ ok: true, data: null });
  });
});
