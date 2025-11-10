// ai-tani-kupang-api/src/routes/events.js

import { getIdentity, json, corsHeaders, parseMaybeJson } from './utils';

// Fungsi helper khusus untuk file ini
const validateRequired = (obj, fields) => {
    const miss = fields.filter((f) => obj[f] === undefined || obj[f] === null);
    if (miss.length) throw new Error(`Missing required field(s): ${miss.join(", ")}`);
};

// Handler untuk GET /api/events
export async function handleGetEvents(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const url = new URL(c.req.url); // Menggunakan URL dari context Hono
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let sql = "SELECT * FROM events WHERE account_id = ? AND user_id = ? AND deleted_at IS NULL";
    const binds = [accountId, userId];

    if (from) { sql += " AND start_at >= ?"; binds.push(from); }
    if (to) { sql += " AND start_at < ?"; binds.push(to); }
    sql += " ORDER BY start_at ASC";

    const { results } = await db.prepare(sql).bind(...binds).all();
    const parseEvent = (e) => ({ ...e, notes: parseMaybeJson(e.notes) });
    
    return json(results.map(parseEvent), 200, c.env, c.req.raw);
}

// Handler untuk POST /api/events
export async function handleCreateEvent(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const request = c.req.raw;

    const body = await request.json();
    validateRequired(body, ["id", "title", "start_at"]);
    const nowIso = new Date().toISOString();

    const data = {
        id: body.id,
        title: body.title,
        start_at: body.start_at,
        type: body.type ?? null,
        crop: body.crop ?? null,
        location: body.location ?? null,
        notes: Array.isArray(body.notes) || typeof body.notes === 'object' ? body.notes : [],
        source_type: body.source_type ?? null,
        source_id: body.source_id ?? null,
    };

    await db
        .prepare(
            `INSERT INTO events (id, title, type, crop, location, notes, start_at, status, source_type, source_id, account_id, user_id, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(data.id, data.title, data.type, data.crop, data.location, JSON.stringify(data.notes || []), data.start_at, data.source_type, data.source_id, accountId, userId, nowIso, userId, nowIso, userId)
        .run();

    return json({ success: true, id: data.id }, 201, c.env, request);
}

// Handler untuk PATCH /api/events/:id
export async function handleUpdateEvent(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const request = c.req.raw;
    const id = c.req.param('id');
    
    const body = await request.json();
    const nowIso = new Date().toISOString();
    const completed_at = body.status === "completed" ? nowIso : null;

    await db
        .prepare("UPDATE events SET status = ?, completed_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND account_id = ? AND user_id = ?")
        .bind(body.status, completed_at, userId, nowIso, id, accountId, userId)
        .run();

    return json({ success: true }, 200, c.env, request);
}

// Handler untuk DELETE /api/events/:id
export async function handleDeleteEvent(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;
    const request = c.req.raw;
    const id = c.req.param('id');

    await db
        .prepare("UPDATE events SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?")
        .bind(userId, id, accountId, userId)
        .run();

    return new Response(null, { status: 204, headers: corsHeaders(c.env, request) });
}