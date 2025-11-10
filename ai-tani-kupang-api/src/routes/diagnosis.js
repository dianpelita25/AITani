// ai-tani-kupang-api/src/routes/diagnosis.js

import { getIdentity, json, parseMaybeJson, sanitizeFileName, guessContentType, buildPhotoUrl } from './utils';

// Handler untuk GET /api/diagnosis
export async function handleGetDiagnosisHistory(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;

    const { results } = await db
        .prepare("SELECT * FROM diagnosis WHERE account_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC")
        .bind(accountId, userId)
        .all();
    
    const parseDiagnosis = (d) => ({ ...d, recommendations: parseMaybeJson(d.recommendations) });

    return json(results.map(parseDiagnosis), 200, c.env, c.req.raw);
}

// Handler untuk POST /api/diagnosis
export async function handleCreateDiagnosis(c) {
    const { accountId, userId } = getIdentity(c);
    const env = c.env; // <-- PERBAIKAN: Definisikan 'env' di sini
    const db = env.DB;
    const r2 = env.R2;
    const request = c.req.raw;

    const formData = await request.formData();
    const submissionData = {};
    for (const [key, value] of formData.entries()) submissionData[key] = value;

    const photoFile = submissionData.photo;
    let diagPhotoName = null;
    let diagPhotoUrl = null;
    let diagPhotoKey = null;

    if (photoFile instanceof File && r2) {
        const sanitized = sanitizeFileName(photoFile.name || `diagnosis_${Date.now()}.jpg`);
        diagPhotoKey = `diagnosis/${accountId}/${userId}/${Date.now()}_${sanitized}`;

        await r2.put(diagPhotoKey, await photoFile.arrayBuffer(), {
            httpMetadata: {
                contentType: photoFile.type || guessContentType(sanitized),
                cacheControl: "public, max-age=31536000, immutable",
            },
        });

        diagPhotoName = sanitized;
        diagPhotoUrl = buildPhotoUrl(request, env, diagPhotoKey); // <-- Sekarang 'env' sudah terdefinisi
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
        .prepare(`INSERT INTO diagnosis (id, timestamp, field_id, crop_type, latitude, longitude, notes, photo_name, photo_url, result_label, result_confidence, result_severity, result_description, recommendations, account_id, user_id, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, submissionData.timestamp || now, submissionData.field_id, submissionData.crop_type, submissionData.latitude, submissionData.longitude, submissionData.notes, diagPhotoName, diagPhotoUrl, mockAiResult.diagnosis.label, mockAiResult.diagnosis.confidence, mockAiResult.diagnosis.severity, mockAiResult.diagnosis.description, JSON.stringify(mockAiResult.recommendations), accountId, userId, now, userId, now, userId)
        .run();

    return json({ success: true, ...mockAiResult }, 201, env, request);
}