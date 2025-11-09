var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-AZDTtY/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/routes/photos.js
async function handlePhotoGet(request, env) {
  const url = new URL(request.url);
  const rawPath = url.pathname;
  const prefixes = ["/api/photos/", "/photos/"];
  const prefix = prefixes.find((p) => rawPath.startsWith(p));
  if (!prefix) return new Response("Not Found", { status: 404 });
  let key = rawPath.slice(prefix.length);
  try {
    key = decodeURIComponent(key);
  } catch {
  }
  const bucket = env.R2;
  if (!bucket) {
    return new Response(JSON.stringify({ ok: false, error: "R2 binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const obj = await bucket.get(key);
  if (!obj) {
    return new Response(JSON.stringify({ ok: false, reason: "not_found", key }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const metaType = obj.httpMetadata?.contentType;
  const type = metaType || guessContentType(key) || "application/octet-stream";
  return new Response(obj.body, {
    status: 200,
    headers: {
      "content-type": type,
      "etag": obj.httpEtag
      // CORS global kamu akan ditambahkan oleh json()/corsHeaders() kalau dibutuhkan.
    }
  });
}
__name(handlePhotoGet, "handlePhotoGet");
function guessContentType(key) {
  const k = key.toLowerCase();
  if (k.endsWith(".jpg") || k.endsWith(".jpeg")) return "image/jpeg";
  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".webp")) return "image/webp";
  if (k.endsWith(".gif")) return "image/gif";
  return null;
}
__name(guessContentType, "guessContentType");

// src/index.js
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }
    const url = new URL(request.url);
    const rawPath = url.pathname;
    const pathname = rawPath.startsWith("/api/") ? rawPath.slice(4) : rawPath;
    if (rawPath.startsWith("/api/photos/")) {
      return handlePhotoGet(request, env);
    }
    const { accountId, userId } = getIdentity(request);
    const db = env.DB;
    const r2 = env.R2;
    try {
      if (rawPath.startsWith("/r2/") && request.method === "GET") {
        return handleR2Stream(request, env);
      }
      if (pathname.startsWith("/photos/") && request.method === "GET") {
        const key = decodeURIComponent(pathname.replace(/^\/photos\//, ""));
        if (!key) return json({ error: "Missing key" }, 400, env, request);
        const obj = await r2.get(key);
        if (!obj) return json({ error: "Not Found" }, 404, env, request);
        const headers = new Headers(corsHeaders(env, request));
        if (obj.httpMetadata?.contentType) headers.set("content-type", obj.httpMetadata.contentType);
        if (obj.httpMetadata?.cacheControl) headers.set("cache-control", obj.httpMetadata.cacheControl);
        if (obj.httpEtag) headers.set("etag", obj.httpEtag);
        return new Response(obj.body, { status: 200, headers });
      }
      if (pathname.startsWith("/weather/advice") && request.method === "GET") {
        const lat = parseFloat(url.searchParams.get("lat") || "0");
        const lon = parseFloat(url.searchParams.get("lon") || "0");
        const date = url.searchParams.get("date") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const kv = env.KV;
        const q = /* @__PURE__ */ __name((n) => Math.round(n * 100) / 100, "q");
        const key = `weather:advice:${date}:${q(lat)}:${q(lon)}`;
        if (kv) {
          const cached = await kv.get(key, { type: "json" });
          if (cached) {
            return json({ ...cached, cached: true }, 200, env, request, { "Cache-Control": "public, max-age=300" });
          }
        }
        const data = await getWeatherAdviceBMKG(lat, lon).catch(() => null);
        const payload = data || buildHeuristicAdvice(lat, lon);
        if (kv) {
          await kv.put(key, JSON.stringify(payload), { expirationTtl: 3 * 60 * 60 });
        }
        return json(payload, 200, env, request, { "Cache-Control": "public, max-age=300" });
      }
      if (pathname === "/notif/demo" && request.method === "GET") {
        const kv = env.KV;
        const val = kv ? await kv.get("notif:demo", { type: "json" }) : null;
        return json({ ok: true, value: val }, 200, env, request);
      }
      if (pathname === "/health") {
        return json({ ok: true, ts: (/* @__PURE__ */ new Date()).toISOString() }, 200, env, request);
      }
      if (pathname.startsWith("/alerts")) {
        const method = request.method;
        if (method === "GET") {
          const { results } = await db.prepare(
            "SELECT * FROM v_alerts_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
          ).bind(accountId, userId).all();
          const parseAlert = /* @__PURE__ */ __name((a) => ({
            ...a,
            coordinates: parseMaybeJson(a.coordinates),
            affected_crops: parseMaybeJson(a.affected_crops),
            notes: parseMaybeJson(a.notes)
          }), "parseAlert");
          return json(results.map(parseAlert), 200, env, request);
        }
        if (method === "POST") {
          try {
            const ct = request.headers.get("content-type") || "";
            let body = {};
            let photoName = null;
            let photoUrl = null;
            let photoKey = null;
            if (ct.includes("multipart/form-data")) {
              const form = await request.formData();
              body = {};
              for (const [k, v] of form.entries()) {
                if (v instanceof File) {
                  if (k === "photo") {
                    const MAX = Number(env.MAX_UPLOAD_MB || 8) * 1024 * 1024;
                    if (v.size > MAX) return json({ error: `File too large (> ${env.MAX_UPLOAD_MB || 8}MB)` }, 413, env, request);
                    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                    const name = (v.name || "photo").toLowerCase();
                    const extOk = /\.(jpe?g|png|webp|gif)$/.test(name);
                    if (!okTypes.includes(v.type) && !extOk) {
                      return json({ error: "Unsupported file type" }, 415, env, request);
                    }
                    photoName = v.name || null;
                    const sanitized = sanitizeFileName(photoName || "photo.jpg");
                    photoKey = `alerts/${accountId}/${userId}/${Date.now()}_${sanitized}`;
                    await r2.put(photoKey, await v.arrayBuffer(), {
                      httpMetadata: {
                        contentType: v.type || guessContentType2(sanitized),
                        cacheControl: "public, max-age=31536000, immutable"
                      }
                    });
                    photoUrl = buildPhotoUrl(request, env, photoKey);
                  }
                } else {
                  body[k] = v;
                }
              }
            } else {
              body = await request.json();
            }
            const now = (/* @__PURE__ */ new Date()).toISOString();
            let coordinates = body.coordinates ?? body.coords ?? null;
            if (typeof coordinates === "string") {
              try {
                coordinates = JSON.parse(coordinates);
              } catch {
              }
            }
            let affected_crops = body.affected_crops ?? body.affectedCrops ?? null;
            if (typeof affected_crops === "string") {
              try {
                affected_crops = JSON.parse(affected_crops);
              } catch {
              }
            }
            const affected_area = body.affected_area ?? body.affectedArea ?? null;
            const pest_count = body.pest_count ?? body.pestCount ?? null;
            const data = {
              id: body.id || `alert_${Date.now()}`,
              timestamp: body.timestamp || now,
              pest_type: body.pest_type ?? body.pestType ?? null,
              severity: body.severity ?? null,
              description: body.description ?? null,
              affected_crops,
              location: body.location ?? null,
              coordinates,
              photo_name: photoName || body.photo_name || body.photoName || null,
              photo_url: photoUrl || body.photo_url || null,
              photo_key: photoKey || body.photo_key || null,
              affected_area,
              pest_count
            };
            try {
              await db.prepare(
                `INSERT INTO alerts (
                    id, timestamp, pest_type, severity, description,
                    affected_crops, location, coordinates,
                    photo_name, photo_url, photo_key,
                    affected_area, pest_count,
                    account_id, user_id, created_at, created_by, updated_at, updated_by
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                data.id,
                data.timestamp,
                data.pest_type,
                data.severity,
                data.description,
                data.affected_crops != null ? JSON.stringify(data.affected_crops) : null,
                data.location,
                data.coordinates != null ? JSON.stringify(data.coordinates) : null,
                data.photo_name,
                data.photo_url,
                data.photo_key,
                data.affected_area,
                data.pest_count,
                accountId,
                userId,
                now,
                userId,
                now,
                userId
              ).run();
            } catch (_e) {
              await db.prepare(
                `INSERT INTO alerts (
                    id, timestamp, pest_type, severity, description,
                    affected_crops, location, coordinates,
                    photo_name, photo_url,
                    affected_area, pest_count,
                    account_id, user_id, created_at, created_by, updated_at, updated_by
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                data.id,
                data.timestamp,
                data.pest_type,
                data.severity,
                data.description,
                data.affected_crops != null ? JSON.stringify(data.affected_crops) : null,
                data.location,
                data.coordinates != null ? JSON.stringify(data.coordinates) : null,
                data.photo_name,
                data.photo_url,
                data.affected_area,
                data.pest_count,
                accountId,
                userId,
                now,
                userId,
                now,
                userId
              ).run();
            }
            return json({ success: true, id: data.id, photo_key: data.photo_key, photo_url: data.photo_url }, 201, env, request);
          } catch (err) {
            console.error("[/alerts POST] error:", err && err.stack ? err.stack : err);
            return json({ error: err?.message || String(err) }, 500, env, request);
          }
        }
        if (method === "DELETE") {
          const id = pathname.split("/")[2];
          if (!id) return json({ error: "Missing id" }, 400, env, request);
          const row = await db.prepare("SELECT photo_key FROM alerts WHERE id = ? AND account_id = ? AND user_id = ? AND deleted_at IS NULL").bind(id, accountId, userId).first();
          await db.prepare("UPDATE alerts SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?").bind(userId, id, accountId, userId).run();
          if (row?.photo_key) {
            try {
              await r2.delete(row.photo_key);
            } catch (e) {
              console.warn("R2 delete failed:", e?.message || e);
            }
          }
          return new Response(null, { status: 204, headers: corsHeaders(env, request) });
        }
        return json({ error: "Method not allowed" }, 405, env, request);
      }
      if (pathname.startsWith("/diagnosis")) {
        if (request.method === "GET") {
          const { results } = await db.prepare(
            "SELECT * FROM v_diagnosis_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
          ).bind(accountId, userId).all();
          return json(results.map(parseDiagnosis), 200, env, request);
        }
        if (request.method === "POST") {
          const formData = await request.formData();
          const submissionData = {};
          for (const [key, value] of formData.entries()) submissionData[key] = value;
          const photoFile = submissionData.photo instanceof File ? submissionData.photo : null;
          let diagPhotoName = null;
          let diagPhotoUrl = null;
          let diagPhotoKey = null;
          if (photoFile && r2) {
            const sanitized = sanitizeFileName(photoFile.name || `diagnosis_${Date.now()}.jpg`);
            diagPhotoKey = `diagnosis/${accountId}/${userId}/${Date.now()}_${sanitized}`;
            await r2.put(diagPhotoKey, await photoFile.arrayBuffer(), {
              httpMetadata: {
                contentType: photoFile.type || guessContentType2(sanitized),
                cacheControl: "public, max-age=31536000, immutable"
              }
            });
            diagPhotoName = sanitized;
            diagPhotoUrl = buildPhotoUrl(request, env, diagPhotoKey);
          }
          const mockAiResult = {
            diagnosis: {
              label: "Bercak Daun (dari Server D1)",
              confidence: 92.3,
              severity: "sedang",
              description: "Disimpan permanen di D1."
            },
            recommendations: [
              { id: "rec_d1_1", title: "Rekomendasi Server 1", description: "Deskripsi 1.", priority: "tinggi", timeframe: "1-2 hari" }
            ]
          };
          const id = `diag_${Date.now()}`;
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await db.prepare(
            `INSERT INTO diagnosis (
                id, timestamp, field_id, crop_type, latitude, longitude, notes,
                photo_name, photo_url,
                result_label, result_confidence, result_severity, result_description,
                recommendations,
                account_id, user_id, created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            submissionData.timestamp || now,
            submissionData.field_id,
            submissionData.crop_type,
            submissionData.latitude,
            submissionData.longitude,
            submissionData.notes,
            diagPhotoName,
            diagPhotoUrl,
            mockAiResult.diagnosis.label,
            mockAiResult.diagnosis.confidence,
            mockAiResult.diagnosis.severity,
            mockAiResult.diagnosis.description,
            JSON.stringify(mockAiResult.recommendations),
            accountId,
            userId,
            now,
            userId,
            now,
            userId
          ).run();
          return json({ success: true, ...mockAiResult }, 201, env, request);
        }
      }
      if (pathname.startsWith("/events")) {
        const id = pathname.split("/")[2];
        if (request.method === "GET" && !id) {
          const from = url.searchParams.get("from");
          const to = url.searchParams.get("to");
          let sql = "SELECT * FROM v_events_active WHERE account_id = ? AND user_id = ?";
          const binds = [accountId, userId];
          if (from) {
            sql += " AND start_at >= ?";
            binds.push(from);
          }
          if (to) {
            sql += " AND start_at < ?";
            binds.push(to);
          }
          sql += " ORDER BY start_at ASC";
          const { results } = await db.prepare(sql).bind(...binds).all();
          return json(results.map(parseEvent), 200, env, request);
        }
        if (request.method === "POST" && !id) {
          const body = await request.json();
          validateRequired(body, ["id", "title", "start_at"]);
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const type = body.type ?? null;
          const crop = body.crop ?? null;
          const location = body.location ?? null;
          const notes = Array.isArray(body.notes) || typeof body.notes === "object" ? body.notes : [];
          const source_type = body.source_type ?? null;
          const source_id = body.source_id ?? null;
          await db.prepare(
            `INSERT INTO events (
                id, title, type, crop, location, notes, start_at,
                status, source_type, source_id, account_id, user_id,
                created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            body.id,
            body.title,
            type,
            crop,
            location,
            JSON.stringify(notes || []),
            body.start_at,
            "pending",
            source_type,
            source_id,
            accountId,
            userId,
            nowIso,
            userId,
            nowIso,
            userId
          ).run();
          return json({ success: true, id: body.id }, 201, env, request);
        }
        if (request.method === "PATCH" && id) {
          const body = await request.json();
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const completed_at = body.status === "completed" ? nowIso : null;
          await db.prepare(
            "UPDATE events SET status = ?, completed_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND account_id = ? AND user_id = ?"
          ).bind(body.status, completed_at, userId, nowIso, id, accountId, userId).run();
          return json({ success: true }, 200, env, request);
        }
        if (request.method === "DELETE" && id) {
          await db.prepare(
            "UPDATE events SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?"
          ).bind(userId, id, accountId, userId).run();
          return new Response(null, { status: 204, headers: corsHeaders(env, request) });
        }
      }
      return json({ error: "Not Found" }, 404, env, request);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || "Server error" }, 500, env, request);
    }
  }
};
var getIdentity = /* @__PURE__ */ __name((request) => ({
  accountId: request.headers.get("X-Account-Id") || "demo",
  userId: request.headers.get("X-User-Id") || "demo"
}), "getIdentity");
var pickAllowedOrigin = /* @__PURE__ */ __name((env, request) => {
  const configured = (env.ALLOWED_ORIGIN || "*").trim();
  const reqOrigin = request.headers.get("Origin") || "";
  if (configured === "*") return "*";
  const list = configured.split(",").map((s) => s.trim()).filter(Boolean);
  if (reqOrigin && list.includes(reqOrigin)) return reqOrigin;
  if (reqOrigin && list.includes("http://localhost") && reqOrigin.startsWith("http://localhost")) return reqOrigin;
  if (reqOrigin && list.includes("https://localhost") && reqOrigin.startsWith("https://localhost")) return reqOrigin;
  return list[0] || "*";
}, "pickAllowedOrigin");
var corsHeaders = /* @__PURE__ */ __name((env, request) => ({
  "Access-Control-Allow-Origin": pickAllowedOrigin(env, request),
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "content-type, x-account-id, x-user-id, X-Account-Id, X-User-Id",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
}), "corsHeaders");
var json = /* @__PURE__ */ __name((data, status = 200, env, request, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", ...corsHeaders(env, request), ...extra }
}), "json");
var validateRequired = /* @__PURE__ */ __name((obj, fields) => {
  const miss = fields.filter((f) => obj[f] === void 0 || !(f in obj) || obj[f] === null);
  if (miss.length) throw new Error(`Missing required field(s): ${miss.join(", ")}`);
}, "validateRequired");
var parseMaybeJson = /* @__PURE__ */ __name((v) => {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}, "parseMaybeJson");
var parseEvent = /* @__PURE__ */ __name((e) => ({ ...e, notes: parseMaybeJson(e.notes) }), "parseEvent");
var parseDiagnosis = /* @__PURE__ */ __name((d) => ({ ...d, notes: parseMaybeJson(d.notes), recommendations: parseMaybeJson(d.recommendations) }), "parseDiagnosis");
async function handleR2Stream(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 3) return json({ error: "Bad R2 path" }, 400, env, request);
  const bucketFromPath = decodeURIComponent(parts[1]);
  const key = decodeURIComponent(parts.slice(2).join("/"));
  const expectedBucket = env.R2_BUCKET || env.R2_PUBLIC_BUCKET_PATH || "aitaniweb-photos";
  if (bucketFromPath !== expectedBucket) {
    return json({ error: "Bucket mismatch" }, 400, env, request);
  }
  const obj = await env.R2.get(key);
  if (!obj) return json({ error: "Not Found" }, 404, env, request);
  const headers = new Headers(corsHeaders(env, request));
  if (obj.httpMetadata?.contentType) headers.set("content-type", obj.httpMetadata.contentType);
  if (obj.httpMetadata?.cacheControl) headers.set("cache-control", obj.httpMetadata.cacheControl);
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  return new Response(obj.body, { status: 200, headers });
}
__name(handleR2Stream, "handleR2Stream");
function buildPhotoUrl(request, env, key) {
  const reqUrl = new URL(request.url);
  const isLocal = ["127.0.0.1", "localhost"].includes(reqUrl.hostname);
  const bucket = env.R2_BUCKET || env.R2_PUBLIC_BUCKET_PATH || "aitaniweb-photos";
  const localBase = (env.R2_LOCAL_BASE || `${reqUrl.origin}/r2`).replace(/\/+$/, "");
  const publicBase = (env.R2_PUBLIC_BASE || env.PUBLIC_R2_BASE_URL || "").replace(/\/+$/, "");
  if (isLocal) return `${localBase}/${bucket}/${encodeURI(key)}`;
  if (!publicBase) return null;
  const baseHasBucket = publicBase.split("/").includes(bucket);
  const withBucket = baseHasBucket ? publicBase : `${publicBase}/${bucket}`;
  return `${withBucket}/${encodeURI(key)}`;
}
__name(buildPhotoUrl, "buildPhotoUrl");
function guessContentType2(filename = "") {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}
__name(guessContentType2, "guessContentType");
function sanitizeFileName(name = "") {
  const base = name.split("/").pop().split("\\").pop();
  return base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "-");
}
__name(sanitizeFileName, "sanitizeFileName");
async function getWeatherAdviceBMKG(lat, lon) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort("timeout"), 5e3);
  try {
    const resp = await fetch(`https://ibnux.github.io/BMKG-importer/cuaca/501190.json`, { signal: controller.signal });
    clearTimeout(to);
    if (!resp.ok) throw new Error(`BMKG status ${resp.status}`);
    const list = await resp.json();
    const willRain = Array.isArray(list) && list.some((x) => /hujan/i.test(x.cuaca || ""));
    const rainfall_mm = willRain ? 8 + Math.random() * 10 : Math.random() * 1.5;
    const advice = willRain ? "Potensi hujan. Jadwalkan penyemprotan pada pagi hari atau tunda." : "Cuaca cerah/berawan. Cocok untuk kegiatan di lapangan.";
    return {
      source: "BMKG",
      lat,
      lon,
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      summary: willRain ? "Berpotensi hujan" : "Cerah/berawan",
      rainfall_mm: Math.round(rainfall_mm * 10) / 10,
      advice
    };
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}
__name(getWeatherAdviceBMKG, "getWeatherAdviceBMKG");
function buildHeuristicAdvice(lat, lon) {
  const hour = (/* @__PURE__ */ new Date()).getUTCHours();
  const rainish = hour % 5 === 0;
  const rainfall_mm = rainish ? 6.2 : 0.3;
  const advice = rainish ? "Kemungkinan hujan. Pertimbangkan penjadwalan pagi/sore dan hindari jam puncak hujan." : "Cocok untuk kegiatan penanaman/pemupukan. Tetap hidrasi dan gunakan pelindung.";
  return {
    source: "BMKG-heuristic",
    lat,
    lon,
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    summary: rainish ? "Berpotensi hujan (heuristik)" : "Cerah/berawan (heuristik)",
    rainfall_mm,
    advice
  };
}
__name(buildHeuristicAdvice, "buildHeuristicAdvice");
async function scheduled(controller, env, ctx) {
  try {
    const lat = -10.177;
    const lon = 123.607;
    const payload = await getWeatherAdviceBMKG(lat, lon).catch(() => buildHeuristicAdvice(lat, lon));
    if (env.KV) {
      await env.KV.put("notif:demo", JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), advice: payload }), { expirationTtl: 24 * 60 * 60 });
    }
  } catch (e) {
    console.log("Cron error:", e?.message || e);
  }
}
__name(scheduled, "scheduled");

// ../../../../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-AZDTtY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-AZDTtY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  scheduled
};
//# sourceMappingURL=index.js.map
