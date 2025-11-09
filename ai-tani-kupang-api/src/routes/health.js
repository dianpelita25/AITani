// src/worker/routes/health.js
/**
 * Cloudflare Worker route: GET /api/health
 * Lightweight liveness & dependency probe for demo.
 *
 * Integration (in your main Worker `fetch` handler):
 *   if (url.pathname === '/api/health') return handleHealth(request, env);
 */
export async function handleHealth(request, env, ctx) {
  // Basic CORS (loose for demo)
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers });
  }

  // D1 check (optional binding names: DB, DATABASE, D1)
  let d1Status = { bound: false, ok: false, error: null };
  for (const name of ['DB', 'DATABASE', 'D1']) {
    if (env && env[name]) {
      d1Status.bound = true;
      try {
        const res = await env[name].prepare('SELECT 1 as one').first();
        d1Status.ok = res && (res.one === 1 || res.ONE === 1);
      } catch (e) {
        d1Status.ok = false;
        d1Status.error = String(e?.message || e);
      }
      break;
    }
  }

  // R2 check (optional binding names: R2, R2_BUCKET, BUCKET)
  let r2Status = { bound: false, ok: false, error: null, binding: null };
  for (const name of ['R2', 'R2_BUCKET', 'BUCKET']) {
    if (env && env[name]) {
      r2Status.bound = true;
      r2Status.binding = name;
      try {
        // If the bucket is accessible, .head() should return an object or null without throwing.
        await env[name].head('__health.txt');
        r2Status.ok = true;
      } catch (e) {
        r2Status.ok = false;
        r2Status.error = String(e?.message || e);
      }
      break;
    }
  }

  const now = new Date();
  const body = {
    ok: true,
    ts: now.toISOString(),
    epoch: now.getTime(),
    region: (request.cf && request.cf.colo) || null,
    commit: env && (env.COMMIT || env.GIT_COMMIT || null),
    d1: d1Status,
    r2: r2Status,
  };

  return new Response(JSON.stringify(body), { status: 200, headers });
}
