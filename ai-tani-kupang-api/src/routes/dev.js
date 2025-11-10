// src/routes/dev.js - VERSI DIPERBARUI

// Kita tidak lagi mengimpor 'getIdentity' karena kita akan definisikan secara manual.
import { json } from './utils';
import alertsFixture from '../../fixtures/alerts.fixture.json';

// Fungsi helper 'seedAlertsFromFixtures' yang diambil dari index.js lama
async function seedAlertsFromFixtures(db, fixtures = [], accountId = 'demo', userId = 'demo') {
    if (!db || !Array.isArray(fixtures) || !fixtures.length) return 0;
    let inserted = 0;

    for (const raw of fixtures) {
        if (!raw || typeof raw !== 'object') continue;
        const nowIso = new Date().toISOString();
        const norm = {
            id: raw.id || `seed_alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            timestamp: raw.timestamp || nowIso,
            pest_type: raw.pest_type ?? raw.pestType ?? 'Hama',
            severity: raw.severity ?? 'medium',
            description: raw.description ?? '',
            affected_crops: raw.affected_crops ?? raw.affectedCrops ?? null,
            location: raw.location ?? raw.reporterLocation ?? null,
            coordinates: raw.coordinates ?? raw.coords ?? null,
            photo_name: raw.photo_name ?? raw.photoName ?? null,
            photo_url: raw.photo_url ?? raw.photoUrl ?? null,
            photo_key: raw.photo_key ?? raw.photoKey ?? null,
            affected_area: raw.affected_area ?? raw.affectedArea ?? null,
            pest_count: raw.pest_count ?? raw.pestCount ?? null,
        };

        // Hapus data lama dengan ID yang sama, tidak peduli siapa pemiliknya
        await db.prepare("DELETE FROM alerts WHERE id = ?").bind(norm.id).run();

        await db
            .prepare(`INSERT INTO alerts (id, timestamp, pest_type, severity, description, affected_crops, location, coordinates, photo_name, photo_url, photo_key, affected_area, pest_count, account_id, user_id, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(norm.id, norm.timestamp, norm.pest_type, norm.severity, norm.description, JSON.stringify(norm.affected_crops), norm.location, JSON.stringify(norm.coordinates), norm.photo_name, norm.photo_url, norm.photo_key, norm.affected_area, norm.pest_count, accountId, userId, nowIso, userId, nowIso, userId)
            .run();
        inserted++;
    }
    return inserted;
}

// Handler utama untuk POST /api/dev/seed-alerts
export async function handleSeedAlerts(c) {
    // PERBAIKAN: Definisikan accountId dan userId secara manual untuk tujuan seeding.
    const accountId = 'demo';
    const userId = 'demo';

    const env = c.env;
    const db = env.DB;
    const request = c.req.raw;
    const url = new URL(request.url);

    if (env?.DISABLE_DEV_SEED === 'true') {
        return json({ ok: false, error: 'Dev seed disabled' }, 403, env, request);
    }
    
    const table = (url.searchParams.get('table') || 'alerts').toLowerCase();
    if (table !== 'alerts') {
        return json({ ok: false, error: `Unsupported table: ${table}` }, 400, env, request);
    }

    let bodyPayload = null;
    try {
        bodyPayload = await request.json();
    } catch {
        bodyPayload = null;
    }

    const fallback = Array.isArray(alertsFixture?.alerts) ? alertsFixture.alerts : Array.isArray(alertsFixture) ? alertsFixture : [];
    const candidate = Array.isArray(bodyPayload?.alerts) ? bodyPayload.alerts : Array.isArray(bodyPayload) ? bodyPayload : fallback;

    // Masukkan data sebagai pengguna 'demo'
    const inserted = await seedAlertsFromFixtures(db, candidate, accountId, userId);
    return json({ ok: true, table, inserted }, 200, env, request);
}