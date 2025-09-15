// ai-tani-kupang-api/src/index.js

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    const url = new URL(request.url);
    const rawPath = url.pathname;
    const pathname = rawPath.startsWith("/api/") ? rawPath.slice(4) : rawPath;

    const { accountId, userId } = getIdentity(request);
    const db = env.DB;
    const r2 = env.R2;

    try {
      // ===== R2 STREAM DEV =====
      if (rawPath.startsWith("/r2/") && request.method === "GET") {
        return handleR2Stream(request, env);
      }

      // ===== PHOTOS (satu pintu FE) =====
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

      // ===== HEALTH =====
      if (pathname === "/health") {
        return json({ ok: true, ts: new Date().toISOString() }, 200, env, request);
      }

      // ===== ALERTS =====
      if (pathname.startsWith("/alerts")) {
        const method = request.method;

        // ---- GET /alerts
        if (method === "GET") {
          const { results } = await db
            .prepare(
              "SELECT * FROM v_alerts_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
            )
            .bind(accountId, userId)
            .all();

          const parseAlert = (a) => ({
            ...a,
            coordinates: parseMaybeJson(a.coordinates),
            affected_crops: parseMaybeJson(a.affected_crops),
            notes: parseMaybeJson(a.notes),
          });

          return json(results.map(parseAlert), 200, env, request);
        }

        // ---- POST /alerts
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
                    // Validasi sederhana
                    const MAX = Number(env.MAX_UPLOAD_MB || 8) * 1024 * 1024;
                    if (v.size > MAX) return json({ error: `File too large (> ${env.MAX_UPLOAD_MB || 8}MB)` }, 413, env, request);
                    const okTypes = ["image/jpeg","image/png","image/webp","image/gif"];
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
                        contentType: v.type || guessContentType(sanitized),
                        cacheControl: "public, max-age=31536000, immutable",
                      },
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

            const now = new Date().toISOString();

            // coordinates bisa string/objek
            let coordinates = body.coordinates ?? body.coords ?? null;
            if (typeof coordinates === "string") { try { coordinates = JSON.parse(coordinates); } catch {} }

            // affected_crops bisa string/array/json
            let affected_crops = body.affected_crops ?? body.affectedCrops ?? null;
            if (typeof affected_crops === "string") { try { affected_crops = JSON.parse(affected_crops); } catch {} }

            const affected_area = body.affected_area ?? body.affectedArea ?? null;
            const pest_count    = body.pest_count ?? body.pestCount ?? null;

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
              pest_count,
            };

            // Insert dengan fallback (kalau kolom photo_key belum ada)
            try {
              await db
                .prepare(
                  `INSERT INTO alerts (
                    id, timestamp, pest_type, severity, description,
                    affected_crops, location, coordinates,
                    photo_name, photo_url, photo_key,
                    affected_area, pest_count,
                    account_id, user_id, created_at, created_by, updated_at, updated_by
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
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
                  accountId, userId,
                  now, userId,
                  now, userId
                )
                .run();
            } catch (_e) {
              await db
                .prepare(
                  `INSERT INTO alerts (
                    id, timestamp, pest_type, severity, description,
                    affected_crops, location, coordinates,
                    photo_name, photo_url,
                    affected_area, pest_count,
                    account_id, user_id, created_at, created_by, updated_at, updated_by
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
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
                  accountId, userId,
                  now, userId,
                  now, userId
                )
                .run();
            }

            return json({ success: true, id: data.id, photo_key: data.photo_key, photo_url: data.photo_url }, 201, env, request);
          } catch (err) {
            console.error("[/alerts POST] error:", err && err.stack ? err.stack : err);
            return json({ error: err?.message || String(err) }, 500, env, request);
          }
        }

        // ---- DELETE /alerts/:id
        if (method === "DELETE") {
          const id = pathname.split("/")[2];
          if (!id) return json({ error: "Missing id" }, 400, env, request);

          const row = await db
            .prepare("SELECT photo_key FROM alerts WHERE id = ? AND account_id = ? AND user_id = ? AND deleted_at IS NULL")
            .bind(id, accountId, userId)
            .first();

          await db
            .prepare("UPDATE alerts SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?")
            .bind(userId, id, accountId, userId)
            .run();

          if (row?.photo_key) {
            try { await r2.delete(row.photo_key); } catch (e) { console.warn("R2 delete failed:", e?.message || e); }
          }

          return new Response(null, { status: 204, headers: corsHeaders(env, request) });
        }

        return json({ error: "Method not allowed" }, 405, env, request);
      }

      // ===== DIAGNOSIS =====
      if (pathname.startsWith("/diagnosis")) {
        if (request.method === "GET") {
          const { results } = await db
            .prepare(
              "SELECT * FROM v_diagnosis_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
            )
            .bind(accountId, userId)
            .all();
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
                contentType: photoFile.type || guessContentType(sanitized),
                cacheControl: "public, max-age=31536000, immutable",
              },
            });

            diagPhotoName = sanitized;
            diagPhotoUrl = buildPhotoUrl(request, env, diagPhotoKey);
          }

          const mockAiResult = {
            diagnosis: {
              label: "Bercak Daun (dari Server D1)",
              confidence: 92.3,
              severity: "sedang",
              description: "Disimpan permanen di D1.",
            },
            recommendations: [
              { id: "rec_d1_1", title: "Rekomendasi Server 1", description: "Deskripsi 1.", priority: "tinggi", timeframe: "1-2 hari" },
            ],
          };

          const id = `diag_${Date.now()}`;
          const now = new Date().toISOString();

          await db
            .prepare(
              `INSERT INTO diagnosis (
                id, timestamp, field_id, crop_type, latitude, longitude, notes,
                photo_name, photo_url,
                result_label, result_confidence, result_severity, result_description,
                recommendations,
                account_id, user_id, created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
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
              accountId, userId, now, userId, now, userId
            )
            .run();

          return json({ success: true, ...mockAiResult }, 201, env, request);
        }
      }

      // ===== EVENTS =====
      if (pathname.startsWith("/events")) {
        const id = pathname.split("/")[2];

        if (request.method === "GET" && !id) {
          const from = url.searchParams.get("from");
          const to = url.searchParams.get("to");

          let sql = "SELECT * FROM v_events_active WHERE account_id = ? AND user_id = ?";
          const binds = [accountId, userId];

          if (from) { sql += " AND start_at >= ?"; binds.push(from); }
          if (to)   { sql += " AND start_at < ?" ; binds.push(to);   }
          sql += " ORDER BY start_at ASC";

          const { results } = await db.prepare(sql).bind(...binds).all();
          return json(results.map(parseEvent), 200, env, request);
        }

        if (request.method === "POST" && !id) {
          const body = await request.json();
          validateRequired(body, ["id", "title", "start_at"]);
          const nowIso = new Date().toISOString();

          const type = body.type ?? null;
          const crop = body.crop ?? null;
          const location = body.location ?? null;
          const notes = Array.isArray(body.notes) || typeof body.notes === "object" ? body.notes : [];
          const source_type = body.source_type ?? null;
          const source_id = body.source_id ?? null;

          await db
            .prepare(
              `INSERT INTO events (
                id, title, type, crop, location, notes, start_at,
                status, source_type, source_id, account_id, user_id,
                created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              body.id, body.title, type, crop, location, JSON.stringify(notes || []),
              body.start_at, "pending", source_type, source_id, accountId, userId,
              nowIso, userId, nowIso, userId
            )
            .run();

          return json({ success: true, id: body.id }, 201, env, request);
        }

        if (request.method === "PATCH" && id) {
          const body = await request.json();
          const nowIso = new Date().toISOString();
          const completed_at = body.status === "completed" ? nowIso : null;

          await db
            .prepare(
              "UPDATE events SET status = ?, completed_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND account_id = ? AND user_id = ?"
            )
            .bind(body.status, completed_at, userId, nowIso, id, accountId, userId)
            .run();

          return json({ success: true }, 200, env, request);
        }

        if (request.method === "DELETE" && id) {
          await db
            .prepare(
              "UPDATE events SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?"
            )
            .bind(userId, id, accountId, userId)
            .run();

          return new Response(null, { status: 204, headers: corsHeaders(env, request) });
        }
      }

      return json({ error: "Not Found" }, 404, env, request);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || "Server error" }, 500, env, request);
    }
  },
};

// ===== Helpers =====
const getIdentity = (request) => ({
  accountId: request.headers.get("X-Account-Id") || "demo",
  userId: request.headers.get("X-User-Id") || "demo",
});

// pilih origin yang cocok dari daftar ALLOWED_ORIGIN
const pickAllowedOrigin = (env, request) => {
  const configured = (env.ALLOWED_ORIGIN || "*").trim();
  const reqOrigin = request.headers.get("Origin") || "";
  if (configured === "*") return "*";
  // dukung banyak origin: "http://a:3000,http://b:4000"
  const list = configured.split(",").map(s => s.trim()).filter(Boolean);
  if (reqOrigin && list.includes(reqOrigin)) return reqOrigin;
  // toleransi untuk localhost dengan port berbeda jika user menulis "http://localhost"
  if (reqOrigin && list.includes("http://localhost") && reqOrigin.startsWith("http://localhost")) return reqOrigin;
  if (reqOrigin && list.includes("https://localhost") && reqOrigin.startsWith("https://localhost")) return reqOrigin;
  // fallback: pakai yang pertama agar tetap ada header
  return list[0] || "*";
};

const corsHeaders = (env, request) => ({
  "Access-Control-Allow-Origin": pickAllowedOrigin(env, request),
  "Vary": "Origin",
  "Access-Control-Allow-Headers":
    "content-type, x-account-id, x-user-id, X-Account-Id, X-User-Id",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
});

const json = (data, status = 200, env, request, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env, request), ...extra },
  });

const validateRequired = (obj, fields) => {
  const miss = fields.filter((f) => obj[f] === undefined || !(f in obj) || obj[f] === null);
  if (miss.length) throw new Error(`Missing required field(s): ${miss.join(", ")}`);
};

const parseMaybeJson = (v) => { try { return JSON.parse(v); } catch { return v; } };
const parseEvent = (e) => ({ ...e, notes: parseMaybeJson(e.notes) });
const parseDiagnosis = (d) => ({ ...d, notes: parseMaybeJson(d.notes), recommendations: parseMaybeJson(d.recommendations) });

async function handleR2Stream(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["r2", ":bucket", ...key]
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

function guessContentType(filename = "") {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}
function sanitizeFileName(name = "") {
  const base = name.split("/").pop().split("\\").pop();
  return base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "-");
}
