// ai-tani-kupang-api/src/routes/diagnosis.js

import { getIdentity, json, parseMaybeJson, sanitizeFileName, guessContentType, buildPhotoUrl } from './utils';
import { fetchWeatherForLocation } from '../utils/weather';


const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const PROMPT_TEXT = `
PERAN UTAMA:
Anda adalah Sistem Pakar Agronomi AI untuk petani kecil di Indonesia.

TAHAP 1: VALIDASI KUALITAS FOTO (CRITICAL - EARLY EXIT)
Sebelum mendiagnosa, SELALU periksa kualitas foto.

Jika foto memenuhi salah satu kondisi berikut:
1. Blur / buram parah (detail daun, bercak, atau hama tidak jelas).
2. Terlalu gelap atau terlalu silau sehingga gejala tidak terlihat.
3. Objek terlalu jauh: tanaman hanya tampak kecil (landscape), bukan close-up bagian yang sakit.
4. Objek utama bukan tanaman atau daun (misalnya: tanah kosong, selfie, rumah, hewan, dll).

MAKA:
- JANGAN melakukan diagnosa penyakit atau hama.
- JANGAN mengarang penyakit berdasarkan dugaan.
- Langsung keluarkan JSON dengan aturan berikut:

  - "disease.name": "Foto Tidak Valid"
  - "disease.type": "tidak_pasti"
  - "disease.risk_level": "unknown"
  - "disease.short_summary": Jelaskan singkat alasan foto tidak valid (misalnya: "Foto terlalu buram", "Objek bukan tanaman", "Daun terlalu jauh dan kecil di foto", dll).
  - "danger_if_ignored.summary": Jelaskan bahwa sistem tidak bisa menilai risiko karena foto tidak jelas.
  - "actions.immediate": berisi saran cara memperbaiki foto (misalnya: "Ambil foto lebih dekat ke daun yang sakit", "Gunakan cahaya yang lebih terang tetapi tidak silau", dll).
  - "treatments.organic": kosongkan array ( [] ).
  - "treatments.chemical": kosongkan array ( [] ).
  - "confidence_explanation.confidence_score": 0
  - "confidence_explanation.reasoning": Jelaskan bahwa model tidak dapat mendiagnosa karena kualitas foto.

TAHAP 2: DIAGNOSA MENDALAM (HANYA JIKA FOTO VALID)
Jika foto CUKUP JELAS (daun/bagian tanaman yang sakit tampak jelas), lanjutkan diagnosa sebagai berikut:

1. Gunakan konteks tambahan yang diberikan (jenis tanaman, lokasi, bagian tanaman yang sakit, dan cuaca) sebagai panduan utama.
2. Identifikasi masalah utama:
   - penyakit jamur
   - penyakit bakteri
   - serangan hama (ulat, kutu, penggerek, dll.)
   - virus
   - kekurangan hara
   - kerusakan fisik (terbakar matahari, angin, herbisida, dll.)
3. Jelaskan tingkat risiko dan kecepatan penyebaran secara sederhana untuk petani.
4. Berikan rekomendasi tindakan yang praktis, terurut dari yang paling penting.
5. Gunakan data cuaca (jika tersedia) untuk memvalidasi:
   - apakah kondisi mendukung pertumbuhan jamur/bakteri (lembap, sering hujan),
   - atau lebih mendukung serangan hama/kekeringan (panas dan kering).

FORMAT OUTPUT WAJIB:
Balas HANYA dengan JSON VALID (TANPA markdown, TANPA teks lain di luar JSON), dengan struktur:

{
  "disease": {
    "name": "string",
    "type": "jamur|bakteri|hama|virus|kekurangan_hara|fisik|campuran|tidak_pasti",
    "risk_level": "rendah|sedang|berat|unknown",
    "short_summary": "string (penjelasan singkat, bahasa petani)"
  },
  "danger_if_ignored": {
    "summary": "string (apa yang terjadi jika tidak ditangani)",
    "yield_impact": "string (perkiraan dampak ke hasil panen)",
    "time_frame": "string (kapan kira-kira dampak terasa)"
  },
  "actions": {
    "immediate": ["string", "string"],
    "this_week": ["string", "string"]
  },
  "treatments": {
    "organic": [
      {
        "title": "string (nama tindakan organik)",
        "ingredients": ["string"],
        "steps": ["string"]
      }
    ],
    "chemical": [
      {
        "title": "string (nama tindakan kimia atau cara semprot)",
        "active_ingredient": "string (bahan aktif, bukan merek dagang)",
        "usage": {
          "dose_per_liter": "string (contoh: 2 gram per liter air)",
          "frequency": "string (contoh: semprot 1x setiap 7 hari)"
        },
        "safety": ["string (contoh: gunakan masker dan sarung tangan)", "string"]
      }
    ]
  },
  "confidence_explanation": {
    "confidence_score": 0,
    "reasoning": "string (jelaskan kenapa yakin atau ragu)",
    "when_to_recheck": ["string (kapan petani perlu cek ulang atau foto ulang)"]
  }
}

ATURAN TAMBAHAN:
- Jika Anda ragu antara beberapa penyakit, pilih satu yang paling mungkin sebagai "disease.name", tetapi jelaskan keraguan tersebut di "confidence_explanation.reasoning".
- Gunakan bahasa Indonesia sederhana yang mudah dipahami petani kecil.
- Jangan menyarankan bahan kimia yang dilarang internasional atau sangat berbahaya.
`.trim();

const CROP_PROMPTS = {
  Jagung: `
PERAN SPESIFIK:
Anda adalah Agronomis Spesialis JAGUNG (Zea mays) untuk wilayah **Nusa Tenggara Timur (NTT)**.
Konteks NTT: lahan kering, tanah berkapur, curah hujan terbatas, suhu siang sering > 32C.

LOGIKA DIAGNOSA (MULTI-ANATOMI):
Periksa bagian tanaman yang difoto user. Gunakan panduan berikut, NAMUN jika gejala berbeda, gunakan pengetahuan agronomi umum Anda tentang jagung tropis.

1. BAGIAN DAUN (Leaf):
   - Daun banyak sobek/tidak beraturan + ada kotoran/serbuk ulat -> curigai Ulat Grayak Jagung / FAW (Spodoptera frugiperda). Sangat sering di NTT.
   - Garis-garis putih atau kuning memanjang mengikuti tulang daun (klorosis belang) -> curigai Bulai / Downy Mildew. Penyakit penting dan berbahaya.
   - Bercak coklat memanjang atau oval dengan tepi lebih gelap -> curigai bercak daun / hawar daun (misalnya Helminthosporium, Gray Leaf Spot).
   - Daun menguning pucat atau ungu pada tepi/tulang daun dengan pola yang rapi -> curigai kekurangan hara (N, P, atau K), sangat umum di tanah kapur NTT.

2. BAGIAN BATANG (Stalk):
   - Ada lubang gerekan pada batang + serbuk atau kotoran serangga di sekitar lubang -> curigai Penggerek Batang Jagung.
   - Bagian batang lunak, berair, atau berbau busuk -> curigai busuk batang akibat bakteri atau jamur.

3. BAGIAN TONGKOL & BUNGA (Ear/Tassel):
   - Ulat atau kotoran ulat di ujung tongkol, biji termakan -> curigai serangan ulat tongkol (misalnya Helicoverpa armigera).
   - Biji atau tongkol tertutup massa jamur, berwarna hitam/abu-abu menggembung -> curigai penyakit gosong / smut atau busuk tongkol.
   - Bunga jantan (tassel) kering atau tidak mengeluarkan serbuk sari -> bisa terkait kekeringan ekstrim atau kekurangan hara pada fase vegetatif.

4. BAGIAN AKAR (Root) - jika foto menampilkan tanaman tercabut:
   - Akar coklat gelap, lembek, membusuk -> curigai busuk akar.
   - Akar pendek, sedikit, dan tampak tidak berkembang -> curigai masalah pH tanah, kekeringan parah, atau gangguan nematoda.

LOGIKA LINGKUNGAN (INTEGRASI CUACA):
Gunakan data "weather" yang diberikan di konteks:

- Jika SUHU > 32C dan kelembapan rendah (kering, tipikal kemarau NTT):
  * Turunkan kemungkinan penyakit jamur daun yang berat (karena butuh kelembapan tinggi), kecuali ada embun malam yang kuat.
  * Naikkan prioritas masalah: serangan hama (ulat, kutu, tungau), stres kekeringan, daun terbakar matahari.

- Jika kelembapan tinggi atau sering HUJAN:
  * Naikkan prioritas penyakit jamur dan bakteri: bulai, hawar daun, busuk batang, busuk tongkol.
  * Jelaskan dalam reasoning jika cuaca sangat mendukung pertumbuhan jamur.

FOKUS BAGIAN TANAMAN:
Jika konteks menyebutkan bagian tertentu yang sakit (misalnya: DAUN dan BATANG), analisa gejala pada bagian itu terlebih dahulu sebelum bagian lain.

FALLBACK (PENTING):
Jika gejala pada foto tidak cocok dengan daftar di atas, Anda tetap WAJIB memberikan diagnosis terbaik menggunakan pengetahuan luas Anda tentang penyakit dan hama jagung tropis. Jangan terbatas hanya pada daftar contoh ini.
`.trim(),

  Padi: `
PERAN SPESIFIK:
Anda adalah Agronomis Spesialis PADI (Oryza sativa) untuk wilayah **Nusa Tenggara Timur (NTT)**.
Konteks NTT: sawah irigasi terbatas, sering ada jeda kering, suhu tinggi, dan angin kencang.

LOGIKA DIAGNOSA (MULTI-ANATOMI):

1. BAGIAN DAUN:
   - Bercak berbentuk belah ketupat / lesi lonjong dengan pusat keabu-abuan dan tepi coklat -> curigai penyakit BLAST (Pyricularia).
   - Ujung daun mengering dari atas ke bawah seperti terbakar -> curigai hawar daun bakteri (kresek) atau keracunan pupuk/herbisida.
   - Daun menguning merata tanpa bercak yang jelas -> curigai defisiensi hara (N, K) atau masalah air (kekeringan/genangan).
   - Daun menggulung dan memutih sebagian -> curigai serangan wereng atau hama penghisap lain.

2. BAGIAN BATANG & RUMPUN:
   - Pangkal batang menghitam, rebah, mudah dicabut -> curigai busuk pangkal, penyakit leher, atau serangan penggerek batang.
   - Rumpun mengering seperti terbakar, terutama di petak tertentu -> curigai serangan Wereng Batang Coklat (hopperburn).
   - Lubang pada batang dan malai yang tidak keluar sempurna -> curigai penggerek batang (gejala sundep/beluk).

3. BAGIAN MALAI / BULIR (Panicle & Grains):
   - Banyak bulir hampa (kosong) atau berwarna putih pucat sementara malai lain normal -> curigai beluk (penggerek), serangan walang sangit, atau kekurangan hara saat pembungaan.
   - Bercak coklat atau kehitaman pada bulir -> curigai penyakit bercak bulir atau infeksi jamur karena hujan terus-menerus.
   - Malai tetap tegak (tidak menunduk) dengan banyak bulir hampa -> indikasi hasil sangat rendah (masalah pada fase generatif).

LOGIKA LINGKUNGAN:
- Jika kelembapan sangat tinggi dan sering hujan:
  * Naikkan prioritas penyakit BLAST, hawar daun bakteri, dan penyakit jamur lain.
  * Jelaskan jika pola cuaca mendukung infeksi di daun dan malai.
- Jika panas dan periode kering panjang:
  * Naikkan prioritas serangan wereng, penggerek batang, dan stres kekeringan.
  * Pertimbangkan juga masalah pengelolaan air yang tidak stabil.

FOKUS BAGIAN TANAMAN:
Jika konteks menyebutkan bagian tertentu yang sakit (DAUN, BATANG/RUMPUN, atau MALAI), fokuskan analisa pada bagian tersebut terlebih dahulu.

FALLBACK:
Jika gejala yang terlihat tidak sepenuhnya cocok dengan daftar di atas, gunakan pengetahuan umum agronomi padi tropis untuk memilih satu diagnosis yang paling mungkin dan jelaskan keraguan Anda pada bagian reasoning.
`.trim(),
};


const DEFAULT_MODEL_VERSION = 'online-v1';

const getOptionalIdentity = (c) => {
    try {
        return getIdentity(c);
    } catch {
        return { accountId: 'anon', userId: 'anon' };
    }
};

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

const dataUrlToBase64 = (dataUrl = '') => dataUrl.split(',').pop() || '';

const pickSeverity = (confidence, fallback) => {
    if (fallback) return fallback;
    if (confidence >= 80) return 'berat';
    if (confidence >= 60) return 'sedang';
    return 'ringan';
};

const mockOnlineResult = (meta = {}) => ({
    source: 'online-mock',
    provider: 'mock',
    modelVersion: DEFAULT_MODEL_VERSION,
    diagnosis: {
        label: 'Gray Leaf Spot (online mock)',
        confidence: 80,
        severity: 'sedang',
        description: 'Mock online: bercak abu-abu terdeteksi.',
    },
    recommendations: [
        { id: 'rec_online_mock_1', title: 'Pantau bercak', description: 'Monitor sebaran 2-3 hari.', priority: 'sedang', timeframe: '2-3 hari' },
        { id: 'rec_online_mock_2', title: 'Uji ulang bila perlu', description: 'Jalankan ulang jika gejala makin parah.', priority: 'rendah', timeframe: 'Opsional' },
    ],
    rawResponse: { type: 'mock', meta },
});

const normalizeOnlineResponse = (data = {}, { provider = 'custom-api', modelVersion = DEFAULT_MODEL_VERSION } = {}) => {
    const diag = data.diagnosis || {};
    const label = diag.label || data.label || 'Diagnosis AI';
    const confidence = Math.round(diag.confidence ?? data.confidence ?? 80);
    const severity = diag.severity || data.severity || pickSeverity(confidence);
    const description = diag.description || data.description || 'Diagnosis AI online.';
    const recommendations = Array.isArray(diag.recommendations)
        ? diag.recommendations
        : Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

    return {
        source: 'online',
        provider,
        modelVersion: data.modelVersion || data.model_version || modelVersion,
        diagnosis: { label, confidence, severity, description },
        recommendations,
        rawResponse: data,
    };
};

async function runGeminiDiagnosis({ env, imageBase64, meta }) {
    console.log('[AI] runGeminiDiagnosis called, has apiKey?', !!env.GEMINI_API_KEY);
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return mockOnlineResult(meta);

    // --- Crop type & prompt spesialis ---
    const rawCropType = (meta?.crop_type || '').trim();
    const cropKey =
        Object.keys(CROP_PROMPTS).find(
            (k) => k.toLowerCase() === rawCropType.toLowerCase()
        ) || rawCropType;
    const cropPrompt = cropKey && CROP_PROMPTS[cropKey] ? CROP_PROMPTS[cropKey] : '';

    // --- Weather snapshot (sudah ada di meta.weather) ---
    const weather = meta?.weather || {};
    const tempC =
        typeof weather.tempC === 'number'
            ? weather.tempC
            : typeof weather.temp === 'number'
            ? weather.temp
            : null;
    const humidity = typeof weather.humidity === 'number' ? weather.humidity : null;
    const condition = weather.condition || null;
    const heatLevel = weather.heatLevel || null;
    const moistureLevel = weather.moistureLevel || null;

    let weatherInfo = 'Data cuaca tidak tersedia.';
    if (
        tempC !== null ||
        humidity !== null ||
        condition ||
        heatLevel ||
        moistureLevel ||
        weather.source ||
        weather.observedAt
    ) {
        const lines = ['DATA LINGKUNGAN REAL-TIME (gunakan ini dalam analisa):'];
        if (tempC !== null) lines.push(`- Suhu: ${tempC} C`);
        if (humidity !== null) lines.push(`- Kelembapan: ${humidity}%`);
        if (condition) lines.push(`- Kondisi: ${condition}`);
        if (heatLevel) lines.push(`- Tingkat panas: ${heatLevel}`);
        if (moistureLevel) lines.push(`- Kelembapan tanah/udara (level): ${moistureLevel}`);
        if (weather.source) lines.push(`- Sumber: ${weather.source}`);
        if (weather.observedAt) lines.push(`- Waktu observasi: ${weather.observedAt}`);
        weatherInfo = lines.join('\n');
    }

    // --- Bagian tanaman yang sakit (dari user) ---
    let affectedParts = [];
    const rawParts = meta?.affected_parts;
    if (Array.isArray(rawParts)) {
        affectedParts = rawParts.map((p) => String(p).trim()).filter(Boolean);
    } else if (typeof rawParts === 'string') {
        affectedParts = rawParts
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
    }

    const affectedPartsLine = affectedParts.length
        ? `Bagian tanaman yang dilaporkan sakit oleh petani: ${affectedParts.join(
              ', ',
          )}. Fokuskan analisa visual pada bagian ini terlebih dahulu sebelum bagian lain.`
        : 'Bagian tanaman yang sakit tidak disebutkan secara spesifik; gunakan penilaian visual Anda untuk menentukan bagian yang paling terdampak.';

    const contextText = `
--- KONTEKS TANAMAN & LOKASI ---
Jenis tanaman: ${cropKey || rawCropType || 'Tidak diketahui'}
Koordinat: ${meta.latitude || '-'}, ${meta.longitude || '-'}
Catatan petani: ${meta.notes || '-'}

${affectedPartsLine}

${weatherInfo}

--- INSTRUKSI SPESIALIS TANAMAN ---
${cropPrompt || '(Gunakan pengetahuan umum tanaman pangan tropis jika prompt spesialis kosong)'}
  `.trim();

    const promptParts = [
        { text: PROMPT_TEXT.trim() }, // Satpam foto + skema JSON
        { text: contextText },        // Tanaman + bagian sakit + cuaca + NTT
        ...(Object.keys(meta || {}).length
            ? [{ text: `Konteks tambahan (JSON mentah, opsional): ${JSON.stringify(meta)}` }]
            : []),
    ];

    const payload = {
        contents: [
            {
                parts: [
                    ...promptParts,
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: imageBase64,
                        },
                    },
                ],
            },
        ],
    };

    console.log('[AI] Calling Gemini API with crop+weather context...');
    const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Gemini error ${resp.status}: ${detail}`);
    }

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let cleaned = (text || '').trim();

    // 1) kalau ada code fence ```json ... ``` ambil isinya saja
    const fenceMatch = cleaned.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
    }

    // 2) kalau masih ada teks lain, potong dari { pertama sampai } terakhir
    if (!cleaned.startsWith('{')) {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            cleaned = cleaned.slice(first, last + 1).trim();
        }
    }

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        console.warn(
            '[runGeminiDiagnosis] JSON parse failed after cleanup, fallback to mock',
            err?.message || err,
            'snippet=',
            cleaned.slice(0, 200),
        );
        return mockOnlineResult({ meta, error: 'JSON parse failed', rawText: text });
    }

    const disease = parsed?.disease || {};
    const danger = parsed?.danger_if_ignored || {};
    const conf = parsed?.confidence_explanation || {};

    const label = disease.name || 'Diagnosis AI (tidak pasti)';
    const confidence = typeof conf.confidence_score === 'number' ? conf.confidence_score : 80;
    const severity = disease.risk_level || 'sedang';
    const description = disease.short_summary || danger.summary || 'Ringkasan penyakit dari AI.';

    const recommendations = [];

    (parsed?.actions?.immediate || []).forEach((step, idx) => {
        if (!step) return;
        recommendations.push({
            id: `act_immediate_${idx + 1}`,
            title: `Segera lakukan ${idx + 1}`,
            description: String(step),
            category: 'immediate',
            priority: 'tinggi',
            timeframe: 'hari ini - minggu ini',
        });
    });

    (parsed?.treatments?.organic || []).forEach((t, idx) => {
        if (!t) return;
        const desc =
            t.description ||
            (Array.isArray(t.steps) ? t.steps.join(' ') : '') ||
            t.title ||
            'Tindakan organik yang disarankan.';
        recommendations.push({
            id: t.id || `org_${idx + 1}`,
            title: `Organik: ${t.title || `Pilihan ${idx + 1}`}`,
            description: desc,
            category: 'organic',
            priority: 'sedang',
            timeframe: 'beberapa hari',
        });
    });

    (parsed?.treatments?.chemical || []).forEach((t, idx) => {
        if (!t) return;
        const desc =
            t.description ||
            (t.usage && typeof t.usage === 'object'
                ? Object.values(t.usage).join(' ')
                : '') ||
            t.title ||
            'Tindakan kimia yang disarankan.';
        recommendations.push({
            id: t.id || `chem_${idx + 1}`,
            title: `Kimia: ${t.title || `Pilihan ${idx + 1}`}`,
            description: desc,
            category: 'chemical',
            priority: 'tinggi',
            timeframe: 'sesuai jadwal semprot',
        });
    });

    return {
        source: 'online',
        provider: 'gemini',
        modelVersion: data?.modelVersion || DEFAULT_MODEL_VERSION,
        diagnosis: {
            label,
            confidence,
            severity: pickSeverity(confidence, severity),
            description,
        },
        recommendations,
        rawResponse: parsed,
    };
}

async function runOnlineDiagnosis({ env, imageBase64, meta }) {
    console.log('[AI] AI_DIAG_ENDPOINT?', !!env.AI_DIAG_ENDPOINT);
    console.log('[AI] GEMINI_API_KEY present?', !!env.GEMINI_API_KEY);
    const timeoutMs = Number(env.AI_DIAG_TIMEOUT_MS || env.AI_TIMEOUT_MS || 20000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // 1) Custom endpoint (preferred)
        if (env.AI_DIAG_ENDPOINT) {
            console.log('[AI] Using AI_DIAG_ENDPOINT');
            const endpoint = env.AI_DIAG_ENDPOINT;
            const apiKey = env.AI_DIAG_API_KEY;
            const provider = env.AI_DIAG_PROVIDER || 'custom-api';
            const modelVersion = env.AI_DIAG_MODEL_VERSION || DEFAULT_MODEL_VERSION;

            const payload = {
                image: `data:image/jpeg;base64,${imageBase64}`,
                meta,
            };

            const headers = { 'Content-Type': 'application/json' };
            if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`AI endpoint error ${resp.status}: ${detail}`);
            }

            const data = await resp.json().catch(() => ({}));
            return normalizeOnlineResponse(data, { provider, modelVersion });
        }

        // 2) Gemini fallback
        if (env.GEMINI_API_KEY) {
            console.log('[AI] Using Gemini fallback');
            return await runGeminiDiagnosis({ env, imageBase64, meta });
        }

        // 3) Mock fallback
        console.log('[AI] Using mockOnlineResult (no AI online)');
        return mockOnlineResult(meta);
    } finally {
        clearTimeout(timer);
    }
}

const normalizeFinalResponse = ({
    id,
    timestamp,
    source,
    provider,
    modelVersion,
    diagnosis,
    recommendations,
    photoUrl,
    photoKey,
    photoName,
    fieldId,
    cropType,
    latitude,
    longitude,
    notes,
    affectedParts,
    localResult,
    onlineResult,
}) => ({
    id,
    timestamp,
    source,
    provider,
    modelVersion,
    diagnosis,
    recommendations,
    photo: {
        url: photoUrl,
        key: photoKey,
        name: photoName,
    },
    meta: {
        fieldId,
        cropType,
        latitude,
        longitude,
        notes,
        affectedParts: affectedParts || null,
    },
    localResult: localResult || null,
    onlineResult: onlineResult || null,
});

// Handler untuk GET /api/diagnosis
export async function handleGetDiagnosisHistory(c) {
    const { accountId, userId } = getIdentity(c);
    const db = c.env.DB;

    const { results } = await db
        .prepare("SELECT * FROM diagnosis WHERE account_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC")
        .bind(accountId, userId)
        .all();

    const parseDiagnosis = (d) => ({
        ...d,
        recommendations: parseMaybeJson(d.recommendations),
        online_result_json: parseMaybeJson(d.online_result_json),
        local_result_json: parseMaybeJson(d.local_result_json),
        raw_response_json: parseMaybeJson(d.raw_response_json),
    });

    return json(results.map(parseDiagnosis), 200, c.env, c.req.raw);
}

// Handler untuk POST /api/diagnosis (online-first + simpan ke D1/R2)
export async function handleCreateDiagnosis(c) {
    const { accountId, userId } = getIdentity(c);
    const env = c.env;
    const db = env.DB;
    const r2 = env.R2;
    const request = c.req.raw;

    const formData = await request.formData();
    const submissionData = {};
    for (const [key, value] of formData.entries()) submissionData[key] = value;

    // Parse bagian tanaman yang sakit (bisa dikirim sebagai JSON string atau "Daun,Batang")
    let affectedParts = null;
    if (submissionData.affected_parts) {
        const parsed = parseMaybeJson(submissionData.affected_parts);
        if (Array.isArray(parsed)) {
            affectedParts = parsed.map((p) => String(p).trim()).filter(Boolean);
        } else if (typeof submissionData.affected_parts === 'string') {
            affectedParts = submissionData.affected_parts
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean);
        }
    }

    const photoFile = submissionData.photo;
    let diagPhotoName = null;
    let diagPhotoUrl = null;
    let diagPhotoKey = null;
    let imageBase64 = '';

    if (typeof photoFile === 'string') {
        imageBase64 = dataUrlToBase64(photoFile);
    }

    if (photoFile instanceof File && r2) {
        const sanitized = sanitizeFileName(photoFile.name || `diagnosis_${Date.now()}.jpg`);
        diagPhotoKey = `diagnosis/${accountId}/${userId}/${Date.now()}_${sanitized}`;

        const buffer = await photoFile.arrayBuffer();
        imageBase64 = arrayBufferToBase64(buffer);

        await r2.put(diagPhotoKey, buffer, {
            httpMetadata: {
                contentType: photoFile.type || guessContentType(sanitized),
                cacheControl: "public, max-age=31536000, immutable",
            },
        });

        diagPhotoName = sanitized;
        diagPhotoUrl = buildPhotoUrl(request, env, diagPhotoKey);
    } else if (photoFile instanceof File && !r2) {
        const buffer = await photoFile.arrayBuffer();
        imageBase64 = arrayBufferToBase64(buffer);
        diagPhotoName = photoFile.name || null;
    }

    const meta = {
        field_id: submissionData.field_id,
        crop_type: submissionData.crop_type,
        latitude: submissionData.latitude,
        longitude: submissionData.longitude,
        notes: submissionData.notes,
        affected_parts: affectedParts,
    };

    meta.weather = null;
    if (meta.latitude && meta.longitude) {
        try {
            meta.weather = await fetchWeatherForLocation(env, {
                latitude: meta.latitude,
                longitude: meta.longitude,
            });
            console.log('[handleCreateDiagnosis] Weather fetched:', meta.weather);
        } catch (err) {
            console.warn('[handleCreateDiagnosis] Weather fetch failed:', err);
        }
    }

    const localResult = submissionData.localResult ? parseMaybeJson(submissionData.localResult) : null;

    let onlineResult = null;
    let onlineError = null;
    if (imageBase64) {
        try {
            onlineResult = await runOnlineDiagnosis({ env, imageBase64, meta });
        } catch (err) {
            onlineError = err?.message || String(err);
            console.warn('[handleCreateDiagnosis] online AI failed, will fallback to localResult:', onlineError);
        }
    }

    if (onlineResult && meta.weather && !onlineResult.weather) {
        onlineResult.weather = meta.weather;
        if (onlineResult.rawResponse && typeof onlineResult.rawResponse === 'object' && !onlineResult.rawResponse.weather) {
            onlineResult.rawResponse.weather = meta.weather;
        }
    }

    const finalResult = onlineResult || localResult || mockOnlineResult(meta);
    const source = onlineResult ? (onlineResult.source || 'online') : localResult ? (localResult.source || 'offline-local') : finalResult.source || 'online-mock';
    const provider = onlineResult?.provider || localResult?.provider || 'local';
    const modelVersion = onlineResult?.modelVersion || localResult?.modelVersion || DEFAULT_MODEL_VERSION;
    const diagnosis = finalResult.diagnosis || {
        label: 'Diagnosis',
        confidence: 0,
        severity: 'ringan',
        description: 'Tidak ada detail',
    };
    const recommendations = Array.isArray(finalResult.recommendations) ? finalResult.recommendations : [];

    const id = `diag_${Date.now()}`;
    const now = new Date().toISOString();
    const timestamp = submissionData.timestamp || now;

    await db
        .prepare(`INSERT INTO diagnosis (
            id, timestamp, field_id, crop_type, latitude, longitude, notes,
            photo_name, photo_url, photo_key,
            result_label, result_confidence, result_severity, result_description, recommendations,
            result_source, model_version, provider,
            online_result_json, local_result_json, raw_response_json,
            account_id, user_id, created_at, created_by, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
            id, timestamp, submissionData.field_id, submissionData.crop_type, submissionData.latitude, submissionData.longitude, submissionData.notes,
            diagPhotoName, diagPhotoUrl, diagPhotoKey,
            diagnosis.label, diagnosis.confidence, diagnosis.severity, diagnosis.description, JSON.stringify(recommendations),
            source, modelVersion, provider,
            onlineResult ? JSON.stringify(onlineResult) : null,
            localResult ? JSON.stringify(localResult) : null,
            onlineResult?.rawResponse ? JSON.stringify(onlineResult.rawResponse) : null,
            accountId, userId, now, userId, now, userId
        )
        .run();

    const responsePayload = normalizeFinalResponse({
        id,
        timestamp,
        source,
        provider,
        modelVersion,
        diagnosis,
        recommendations,
        photoUrl: diagPhotoUrl,
        photoKey: diagPhotoKey,
        photoName: diagPhotoName,
        fieldId: submissionData.field_id,
        cropType: submissionData.crop_type,
        latitude: submissionData.latitude,
        longitude: submissionData.longitude,
        notes: submissionData.notes,
        affectedParts: affectedParts,
        localResult,
        onlineResult: onlineResult || (onlineError ? { error: onlineError } : null),
    });

    return json(responsePayload, 201, env, request);
}

// Handler untuk POST /api/diagnosis/online (proxy AI saja, tidak simpan)
export async function handleOnlineDiagnosis(c) {
    const { accountId, userId } = getOptionalIdentity(c);
    const env = c.env;
    const request = c.req.raw;

    let body = {};
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, env, request);
    }

    const image = body?.image;
    const meta = body?.meta || {};
    if (!image || typeof image !== 'string') {
        return json({ error: 'image (data URL) wajib dikirim' }, 400, env, request);
    }

    if (!meta.weather && meta.latitude && meta.longitude) {
        try {
            meta.weather = await fetchWeatherForLocation(env, {
                latitude: meta.latitude,
                longitude: meta.longitude,
            });
            console.log('[handleOnlineDiagnosis] Weather fetched:', meta.weather);
        } catch (err) {
            console.warn('[handleOnlineDiagnosis] Weather fetch failed:', err);
        }
    }

    try {
        const base64 = dataUrlToBase64(image);
        const result = await runOnlineDiagnosis({ env, imageBase64: base64, meta: { ...meta, accountId, userId } });
        if (meta.weather && result && !result.weather) {
            result.weather = meta.weather;
            if (result.rawResponse && typeof result.rawResponse === 'object' && !result.rawResponse.weather) {
                result.rawResponse.weather = meta.weather;
            }
        }
        return json(result, 200, env, request);
    } catch (err) {
        return json({ error: 'Online diagnosis failed', detail: err?.message || err }, 500, env, request);
    }
}
