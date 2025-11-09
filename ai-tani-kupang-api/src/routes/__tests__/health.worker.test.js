import { describe, it, expect, vi } from 'vitest';
import { handleHealth } from '../health';

const createRequest = (method = 'GET') =>
  new Request('https://example.com/api/health', { method });

describe('handleHealth', () => {
  it('handles OPTIONS preflight for CORS', async () => {
    const res = await handleHealth(createRequest('OPTIONS'));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('rejects unsupported HTTP methods', async () => {
    const res = await handleHealth(createRequest('POST'));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ ok: false, error: 'Method Not Allowed' });
  });

  it('reports OK status with D1 and R2 bindings', async () => {
    const first = vi.fn().mockResolvedValue({ one: 1 });
    const env = {
      DB: { prepare: vi.fn().mockReturnValue({ first }) },
      R2: { head: vi.fn().mockResolvedValue(undefined) },
      COMMIT: 'abcdef',
    };

    const res = await handleHealth(createRequest('GET'), env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(body.ok).toBe(true);
    expect(body.commit).toBe('abcdef');
    expect(body.d1.bound).toBe(true);
    expect(body.d1.ok).toBe(true);
    expect(body.r2.bound).toBe(true);
    expect(body.r2.ok).toBe(true);
    expect(body.r2.binding).toBe('R2');
  });

  it('captures errors from alternative binding names', async () => {
    const first = vi.fn().mockRejectedValue(new Error('d1 down'));
    const env = {
      DATABASE: { prepare: vi.fn().mockReturnValue({ first }) },
      R2_BUCKET: { head: vi.fn().mockRejectedValue(new Error('r2 down')) },
    };

    const res = await handleHealth(createRequest('GET'), env);
    const body = await res.json();

    expect(body.d1.bound).toBe(true);
    expect(body.d1.ok).toBe(false);
    expect(body.d1.error).toContain('d1 down');

    expect(body.r2.bound).toBe(true);
    expect(body.r2.ok).toBe(false);
    expect(body.r2.binding).toBe('R2_BUCKET');
    expect(body.r2.error).toContain('r2 down');
  });
});
