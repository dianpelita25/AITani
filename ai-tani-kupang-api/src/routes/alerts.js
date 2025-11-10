//ai-tani-kupang-api/src/routes/alerts.js

import { getIdentity, json, parseMaybeJson, sanitizeFileName, guessContentType, buildPhotoUrl, corsHeaders } from './utils';

// Menerima 'c' (context Hono) sebagai parameter
export async function handleGetAlerts(c) {
    const { accountId, userId } = getIdentity(c); // Mengambil identitas dari context
    const db = c.env.DB;

    const { results } = await db
        .prepare("SELECT * FROM alerts WHERE account_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC")
        .bind(accountId, userId)
        .all();

    const parseAlert = (a) => ({
        ...a,
        coordinates: parseMaybeJson(a.coordinates),
        affected_crops: parseMaybeJson(a.affected_crops),
    });

    return json(results.map(parseAlert), 200, c.env, c.req.raw);
}

// Menerima 'c' (context Hono) sebagai parameter
export async function handleCreateAlert(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const r2 = c.env.R2;
    const request = c.req.raw; // Dapatkan request asli dari context
    const env = c.env;

    try {
        const ct = request.headers.get("content-type") || "";
        let body = {};
        let photoName = null;
        let photoUrl = null;
        let photoKey = null;

        if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            for (const [k, v] of form.entries()) {
                if (v instanceof File) {
                    if (k === "photo") {
                        const MAX = Number(env.MAX_UPLOAD_MB || 8) * 1024 * 1024;
                        if (v.size > MAX) return json({ error: `File too large (> ${env.MAX_UPLOAD_MB || 8}MB)` }, 413, env, request);

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
        let coordinates = body.coordinates ?? body.coords ?? null;
        if (typeof coordinates === "string") { try { coordinates = JSON.parse(coordinates); } catch { } }

        let affected_crops = body.affected_crops ?? body.affectedCrops ?? null;
        if (typeof affected_crops === "string") { try { affected_crops = JSON.parse(affected_crops); } catch { } }

        const data = {
            id: body.id || `alert_${Date.now()}`,
            timestamp: body.timestamp || now,
            pest_type: body.pest_type ?? body.pestType ?? null,
            severity: body.severity ?? null,
            description: body.description ?? null,
            affected_crops,
            location: body.location ?? null,
            coordinates,
            photo_name: photoName,
            photo_url: photoUrl,
            photo_key: photoKey,
            affected_area: body.affected_area ?? body.affectedArea ?? null,
            pest_count: body.pest_count ?? body.pestCount ?? null,
        };
        
        await db.prepare(`INSERT INTO alerts (id, timestamp, pest_type, severity, description, affected_crops, location, coordinates, photo_name, photo_url, photo_key, affected_area, pest_count, account_id, user_id, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(data.id, data.timestamp, data.pest_type, data.severity, data.description, JSON.stringify(data.affected_crops), data.location, JSON.stringify(data.coordinates), data.photo_name, data.photo_url, data.photo_key, data.affected_area, data.pest_count, accountId, userId, now, userId, now, userId)
            .run();

        return json({ success: true, id: data.id, photo_key: data.photo_key, photo_url: data.photo_url }, 201, env, request);
    } catch (err) {
        console.error("[/alerts POST] error:", err.stack || err);
        return json({ error: err.message || String(err) }, 500, env, request);
    }
}

// Menerima 'c' (context Hono) sebagai parameter
export async function handleDeleteAlert(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const r2 = c.env.R2;
    const request = c.req.raw;
    const id = c.req.param('id');
    
    if (!id) return json({ error: "Missing id" }, 400, c.env, request);

    const row = await db.prepare("SELECT photo_key FROM alerts WHERE id = ? AND account_id = ? AND user_id = ? AND deleted_at IS NULL").bind(id, accountId, userId).first();
    await db.prepare("UPDATE alerts SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?").bind(userId, id, accountId, userId).run();

    if (row?.photo_key) {
        try { await r2.delete(row.photo_key); } catch (e) { console.warn("R2 delete failed:", e.message || e); }
    }

    return new Response(null, { status: 204, headers: corsHeaders(c.env, request) });
}