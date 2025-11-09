// ai-tani-kupang-api/src/routes/photos.js
/**
 * GET /api/photos/:key  (atau /photos/:key jika router kamu strip '/api/')
 * Ambil objek dari R2 berdasarkan "key".
 * FE mengirim key yang sudah ENCODE SEKALI → di sini cukup decode SEKALI.
 */
export async function handlePhotoGet(request, env) {
  const url = new URL(request.url);
  const rawPath = url.pathname;

  // Terima dua pola: '/api/photos/...' dan '/photos/...'
  const prefixes = ['/api/photos/', '/photos/'];
  const prefix = prefixes.find(p => rawPath.startsWith(p));
  if (!prefix) return new Response('Not Found', { status: 404 });

  // Ambil key setelah prefix, decode SEKALI
  let key = rawPath.slice(prefix.length);
  try { key = decodeURIComponent(key); } catch { /* abaikan */ }

  const bucket = env.R2; // binding R2 di wrangler.toml
  if (!bucket) {
    return new Response(JSON.stringify({ ok:false, error:'R2 binding missing' }), {
      status: 500,
      headers: { 'content-type':'application/json; charset=utf-8' },
    });
  }

  const obj = await bucket.get(key);
  if (!obj) {
    return new Response(JSON.stringify({ ok:false, reason:'not_found', key }), {
      status: 404,
      headers: { 'content-type':'application/json; charset=utf-8' },
    });
  }

  const metaType = obj.httpMetadata?.contentType;
  const type = metaType || guessContentType(key) || 'application/octet-stream';

  return new Response(obj.body, {
    status: 200,
    headers: {
      'content-type': type,
      'etag': obj.httpEtag,
      // CORS global kamu akan ditambahkan oleh json()/corsHeaders() kalau dibutuhkan.
    },
  });
}

function guessContentType(key) {
  const k = key.toLowerCase();
  if (k.endsWith('.jpg') || k.endsWith('.jpeg')) return 'image/jpeg';
  if (k.endsWith('.png')) return 'image/png';
  if (k.endsWith('.webp')) return 'image/webp';
  if (k.endsWith('.gif')) return 'image/gif';
  return null;
}
