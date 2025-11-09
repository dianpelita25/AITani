import { describe, it, expect, vi } from 'vitest';
import { handlePhotoGet } from '../photos';

const baseUrl = 'https://example.com';

const createRequest = (path) => new Request(`${baseUrl}${path}`);

describe('handlePhotoGet', () => {
  it('returns 404 when path is outside the supported prefixes', async () => {
    const res = await handlePhotoGet(createRequest('/invalid/path'), { R2: {} });
    expect(res.status).toBe(404);
  });

  it('safely reports when the R2 binding is missing', async () => {
    const res = await handlePhotoGet(createRequest('/api/photos/sample.jpg'), {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'R2 binding missing' });
  });

  it('returns 404 with reason when object is not found', async () => {
    const bucket = { get: vi.fn().mockResolvedValue(null) };
    const res = await handlePhotoGet(createRequest('/api/photos/missing.jpg'), { R2: bucket });

    expect(bucket.get).toHaveBeenCalledWith('missing.jpg');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, reason: 'not_found', key: 'missing.jpg' });
  });

  it('streams the object with metadata when found and decodes the key exactly once', async () => {
    const bucket = {
      get: vi.fn().mockResolvedValue({
        body: 'raw-photo',
        httpMetadata: { contentType: 'image/jpeg' },
        httpEtag: 'etag-123',
      }),
    };

    const res = await handlePhotoGet(
      createRequest('/api/photos/laporan%252Ffoto%2520akhir.jpg'),
      { R2: bucket }
    );

    expect(bucket.get).toHaveBeenCalledWith('laporan%2Ffoto%20akhir.jpg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('etag')).toBe('etag-123');
    expect(await res.text()).toBe('raw-photo');
  });

  it('guesses the content type when metadata is missing', async () => {
    const bucket = {
      get: vi.fn().mockResolvedValue({
        body: 'png-data',
        httpMetadata: {},
        httpEtag: null,
      }),
    };

    const res = await handlePhotoGet(createRequest('/photos/sample.PNG'), { R2: bucket });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(await res.text()).toBe('png-data');
  });
});
