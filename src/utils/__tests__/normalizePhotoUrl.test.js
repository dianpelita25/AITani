import { describe, it, expect } from 'vitest';
import normalizePhotoUrl from '../normalizePhotoUrl';

describe('normalizePhotoUrl', () => {
  it('builds an API URL when photoKey is provided', () => {
    const url = normalizePhotoUrl('laporan folder/foto akhir.jpg', null);
    expect(url).toBe('/api/photos/laporan%20folder%2Ffoto%20akhir.jpg');
  });

  it('decodes double-encoded keys once before re-encoding', () => {
    const url = normalizePhotoUrl('laporan%252Ffoto%2520akhir.jpg', null);
    expect(url).toBe('/api/photos/laporan%252Ffoto%2520akhir.jpg');
  });

  it('sanitizes remote URLs when only photoUrl exists', () => {
    const url = normalizePhotoUrl(null, 'https://cdn.example.com/folder foto 1.png');
    expect(url).toBe('https://cdn.example.com/folder%20foto%201.png');
  });

  it('decodes double-encoded remote URLs exactly once', () => {
    const url = normalizePhotoUrl(null, 'https://cdn.example.com/folder%2520foto%25201.png');
    expect(url).toBe('https://cdn.example.com/folder%20foto%201.png');
  });

  it('returns null when neither key nor url exists', () => {
    expect(normalizePhotoUrl(undefined, undefined)).toBeNull();
  });
});
