// ai-tani-kupang-api/src/routes/diagnosis.js

import { getIdentity, json, parseMaybeJson, sanitizeFileName, guessContentType, buildPhotoUrl } from './utils.js';
import { fetchWeatherForLocation } from '../utils/weather.js';


const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const resolveGeminiModel = (env, kind) => {
    const perKind =
        kind === 'precheck'
            ? env?.GEMINI_PRECHECK_MODEL
            : kind === 'planner'
            ? env?.GEMINI_PLANNER_MODEL
            : env?.GEMINI_MODEL;
    const model = (perKind || env?.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
    return model || DEFAULT_GEMINI_MODEL;
};
const buildGeminiUrl = (env, kind = 'diagnosis') =>
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveGeminiModel(env, kind)}:generateContent`;
const isPlannerEnabled = (env) => {
    const raw = String(env?.AI_PLANNER_ENABLED ?? 'true').toLowerCase();
    return !['false', '0', 'off', 'no'].includes(raw);
};
const isPrecheckEnabled = (env) => {
    const raw = String(env?.AI_PRECHECK_ENABLED ?? 'true').toLowerCase();
    return !['false', '0', 'off', 'no'].includes(raw);
};
const readPositiveInt = (value) => {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) && num > 0 ? num : null;
};
const buildGenerationConfig = (env, kind) => {
    const perKind =
        kind === 'precheck'
            ? env?.GEMINI_PRECHECK_MAX_TOKENS
            : kind === 'planner'
            ? env?.GEMINI_PLANNER_MAX_TOKENS
            : kind === 'shop'
            ? env?.GEMINI_SHOP_MAX_TOKENS
            : env?.GEMINI_DIAG_MAX_TOKENS;
    const maxOutputTokens =
        readPositiveInt(perKind) ||
        readPositiveInt(env?.GEMINI_MAX_OUTPUT_TOKENS);
    if (!maxOutputTokens) return null;
    return { maxOutputTokens };
};
const IMAGE_PRECHECK_PROMPT = `
PERAN:
Anda adalah asisten yang hanya memeriksa KUALITAS FOTO dan apakah objek utama adalah TANAMAN.

TUGAS:
1. Tentukan apakah objek utama di foto adalah tanaman / bagian tanaman (daun, batang, buah, malai, dll).
2. Tentukan apakah foto terlalu buram / terlalu gelap / terlalu jauh untuk dinilai.
3. Berikan penilaian kualitas (quality_score) 0–1:
   - 1   = sangat jelas
   - 0.5 = cukup, bisa dipakai
   - 0   = tidak bisa dipakai
4. Jangan melakukan diagnosa penyakit / hama.
5. Balas HANYA dengan JSON.

FORMAT JSON WAJIB:
{
  "is_plant": true,
  "is_blurry": false,
  "quality_score": 0.9,
  "status": "ok",
  "reason": "Foto cukup jelas untuk analisa.",
  "suggestions": [
    "Ambil foto lebih dekat ke daun yang sakit.",
    "Pastikan cahaya cukup dan tidak terlalu silau."
  ]
}
`.trim();
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

const SHOP_ASSISTANT_PROMPT = `
PERAN:
Anda adalah Asisten Logistik Pertanian & Belanja Pintar.
Tugas: Menghitung estimasi BELANJA obat & alat, serta menyiapkan kata kunci pencarian e-commerce.

INPUT DARI SISTEM:
- Masalah: {{DISEASE_NAME}}
- Bahan Aktif Rekomendasi: {{ACTIVE_INGREDIENT}}
- Lokasi Petani: {{LOCATION}}
- Luas Lahan / Skala: {{LAND_SIZE}} (Gunakan untuk hitungan volume belanja)

TUGAS & BATASAN (SAFETY RULES):
1. REKOMENDASI MEREK: Sebutkan 2-3 merek paten/umum (Contoh: Bayer/Syngenta/Nufarm) yang mengandung bahan aktif tersebut.
2. VOLUME BELANJA (BUKAN DOSIS CAMPUR):
   - Hitung kasar kebutuhan air (Rumus: ~300L air per Hektar).
   - Tentukan user harus beli kemasan ukuran berapa agar hemat.
   - DILARANG memberikan dosis pencampuran (ml per tangki) karena beda merek beda konsentrasi. Cukup sarankan "Beli botol 100ml" atau "Beli botol 500ml".
3. ESTIMASI BUDGET: Gunakan Range Harga (Rp X - Rp Y), JANGAN harga pasti.
4. MONETISASI & SEARCH KEYWORD:
   - Berikan "Search Keyword" spesifik untuk mencari produk tersebut di toko online.
   - Tambahkan rekomendasi ALAT/APD (Masker/Sprayer) yang relevan dengan masalah (karena alat lebih mudah dikirim dibanding cairan).

OUTPUT JSON:
{
  "shopping_advice": {
    "active_ingredient": "string",
    "recommended_brands": [
      {
        "brand_name": "string (Contoh: Confidor 200SL)",
        "estimated_price_range": "string (Contoh: Rp 35rb - 50rb)",
        "ecommerce_keyword": "string (Keyword bersih untuk Shopee, contoh: 'Insektisida Confidor 200SL Bayer Asli')"
      }
    ],
    "volume_calculation": {
      "analysis": "string (Contoh: Untuk lahan 0.25 Ha, butuh sekitar 5-6 tangki)",
      "buying_tip": "string (Contoh: Cukup beli 1 botol kemasan 60ml atau 100ml. Jangan beli literan agar tidak mubazir.)"
    },
    "complementary_tools": [
      {
        "tool_name": "string (Contoh: Masker Pertanian)",
        "reason": "string (Alasan kenapa perlu)",
        "ecommerce_keyword": "string (Contoh: 'Masker Respirator 3M Pertanian')"
      }
    ]
  },
  "shop_finder": {
    "maps_query": "string (Keyword untuk Google Maps, contoh: 'Toko Pertanian Jual Insektisida dekat saya')"
  },
  "safety_disclaimer": "Harga estimasi. Dosis pencampuran WAJIB mengikuti label di kemasan produk."
}
`.trim();
const PLANNER_PROMPT = `
PERAN:
Anda adalah Asisten Perencanaan Tindakan Lapang untuk petani kecil.

INPUT (dari sistem):
- diagnosis: JSON ringkas (label, severity, confidence, description)
- recommendations: array JSON rekomendasi (id, title, description, category, priority, timeframe)
- raw_diagnosis: boleh null atau berisi JSON detail (disease, actions.immediate, actions.this_week, treatments, dll)
- meta: JSON berisi crop_type, lokasi, catatan petani, weather, affected_parts, dll.

TUGAS:
- Susun rencana bertahap yang praktis dan terurut untuk petani.
- Bagi menjadi beberapa fase waktu:
  - immediate (Hari ini - 2 hari ke depan)
  - this_week (3-7 hari)
  - next_weeks (1-4 minggu ke depan)
  - monitoring (pemantauan lanjutan)
- Gunakan bahasa Indonesia sederhana.
- Jika diagnosis.confidence < 60, buat fase MONITORING lebih kuat dan tekankan untuk cek ulang / foto ulang sebelum tindakan kimia yang agresif.
- Jangan memberi dosis campuran baru yang bertentangan dengan diagnosis awal; jika perlu obat kimia, rujuk pada rekomendasi yang sudah ada saja.

FORMAT OUTPUT WAJIB:
- Model harus BALAS HANYA dengan JSON VALID, TANPA markdown, TANPA teks lain di luar JSON.
- Bentuk JSON:

{
  "summary": "string (ringkasan strategi dalam 1-2 kalimat)",
  "phases": [
    {
      "id": "immediate|this_week|next_weeks|monitoring",
      "title": "string (judul fase, contoh: 'Hari ini - 2 hari ke depan')",
      "timeframe": "string (contoh: '0-2 hari', '3-7 hari')",
      "priority": "tinggi|sedang|rendah",
      "goals": ["string", "string"],
      "steps": [
        {
          "id": "string (id unik langkah, contoh: 'step_buang_daun_berat')",
          "title": "string (judul langkah singkat)",
          "description": "string (penjelasan langkah, bahasa petani)",
          "category": "sanitasi|organik|kimia|pemantauan|lainnya",
          "related_recommendation_ids": [
            "string (id rekomendasi dari input.recommendations, boleh kosong)"
          ]
        }
      ]
    }
  ],
  "warnings": [
    "string (peringatan praktis, contoh: 'Gunakan masker dan sarung tangan saat menyemprot.')"
  ],
  "recheck_advice": [
    "string (kapan petani perlu cek ulang atau foto ulang)"
  ]
}

ATURAN TAMBAHAN:
- Jika tidak ada data recommendations atau raw_diagnosis, tetap buat plan sederhana (sanitasi + monitoring).
- Jangan menyebut merek dagang baru; jika perlu bahan aktif atau merek, pakai yang sudah muncul di diagnosis / recommendations saja.
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

const normalizeConfidence = (raw) => {
    let score = Number(raw) || 0;
    if (score > 0 && score <= 1) {
        score = score * 100;
    }
    score = Math.round(score);
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return score;
};

const extractJsonBlock = (rawText = '') => {
    let cleaned = String(rawText || '').trim();
    const fenceMatch = cleaned.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
    }
    if (!cleaned.startsWith('{')) {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            cleaned = cleaned.slice(first, last + 1).trim();
        }
    }
    return cleaned;
};

const escapeJsonStringLiterals = (raw = '') => {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < raw.length; i += 1) {
        const ch = raw[i];
        if (escaped) {
            out += ch;
            escaped = false;
            continue;
        }
        if (ch === '\\') {
            out += ch;
            escaped = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            out += ch;
            continue;
        }
        if (inString && (ch === '\n' || ch === '\r')) {
            out += '\\n';
            continue;
        }
        if (inString && ch === '\t') {
            out += '\\t';
            continue;
        }
        out += ch;
    }
    return out;
};

const normalizeJsonText = (rawText = '') => {
    let cleaned = extractJsonBlock(rawText);
    cleaned = escapeJsonStringLiterals(cleaned);
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return cleaned;
};

const applyNormalizedConfidence = (onlineResult, diagnosisObj) => {
    const raw =
        onlineResult?.rawResponse?.confidence_explanation?.confidence_score ??
        onlineResult?.rawResponse?.diagnosis?.confidence ??
        diagnosisObj?.confidence ??
        0;

    const score = normalizeConfidence(raw);

    if (diagnosisObj && typeof diagnosisObj === 'object') {
        diagnosisObj.confidence = score;
    }

    if (
        onlineResult &&
        onlineResult.rawResponse &&
        typeof onlineResult.rawResponse === 'object'
    ) {
        if (!onlineResult.rawResponse.confidence_explanation) {
            onlineResult.rawResponse.confidence_explanation = {
                confidence_score: score,
                reasoning: '',
                when_to_recheck: [],
            };
        } else {
            onlineResult.rawResponse.confidence_explanation.confidence_score = score;
        }
    }

    if (onlineResult && onlineResult.diagnosis) {
        onlineResult.diagnosis.confidence = score;
    }

    return score;
};

function shouldSkipOnlineDiagnosis(precheck) {
    if (!precheck || typeof precheck !== 'object') return false;

    const isPlant = precheck.is_plant !== false;
    const isBlurry = !!precheck.is_blurry;
    const status = precheck.status || 'ok';
    const quality =
        typeof precheck.quality_score === 'number'
            ? precheck.quality_score
            : 1;

    if (!isPlant) return true;
    if (status === 'reject') return true;
    if (quality < 0.3) return true;
    if (isBlurry && quality < 0.3) return true;

    return false;
}

function buildPrecheckFailureResult(precheck, meta = {}) {
    const reason =
        (precheck && precheck.reason) ||
        'Foto kurang jelas atau objek utama bukan tanaman, sehingga sistem tidak dapat menganalisis dengan aman.';

    const suggestions =
        precheck && Array.isArray(precheck.suggestions) && precheck.suggestions.length
            ? precheck.suggestions.map((s) => String(s))
            : [
                  'Ambil foto lebih dekat ke bagian tanaman yang sakit (daun/batang/malai).',
                  'Pastikan cahaya cukup (tidak terlalu gelap atau silau).',
                  'Pastikan objek utama adalah tanaman, bukan tanah kosong atau benda lain.',
              ];

    const diagnosis = {
        label: 'Foto Tidak Valid',
        confidence: 0,
        severity: 'ringan',
        description: reason,
    };

    const recommendations = suggestions.map((text, idx) => ({
        id: `precheck_fix_${idx + 1}`,
        title: `Perbaiki foto ${idx + 1}`,
        description: text,
        category: 'precheck',
        priority: 'tinggi',
        timeframe: 'hari ini',
    }));

    const rawResponse = {
        disease: {
            name: 'Foto Tidak Valid',
            type: 'tidak_pasti',
            risk_level: 'unknown',
            short_summary: reason,
        },
        danger_if_ignored: {
            summary: 'Sistem tidak bisa menilai risiko penyakit karena foto tidak jelas.',
            yield_impact: '',
            time_frame: '',
        },
        actions: {
            immediate: suggestions,
            this_week: [],
        },
        treatments: {
            organic: [],
            chemical: [],
        },
        confidence_explanation: {
            confidence_score: 0,
            reasoning:
                'Foto tidak memenuhi kualitas minimal (blur/bukan tanaman/objek terlalu jauh), sehingga model TIDAK melakukan diagnosa.',
            when_to_recheck: [
                'Ambil ulang foto setelah memperbaiki kualitas sesuai saran precheck.',
            ],
        },
        precheck,
        meta,
    };

    const onlineResult = {
        source: 'online-precheck',
        provider: 'precheck',
        modelVersion: DEFAULT_MODEL_VERSION,
        diagnosis,
        recommendations,
        rawResponse,
        precheck,
    };

    return { diagnosis, recommendations, onlineResult };
}

/**
 * @typedef {Object} ImagePrecheckResult
 * @property {boolean} is_plant
 * @property {boolean} is_blurry
 * @property {number} quality_score
 * @property {'ok' | 'retry' | 'reject'} status
 * @property {string} reason
 * @property {string[]} suggestions
 * @property {any} [rawResponse]
 */

function parseImagePrecheckResponse(text) {
    if (typeof text !== 'string') {
        throw new Error('Precheck response is not a string');
    }
    let cleaned = (text || '').trim();
    const fenceMatch = cleaned.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
    }
    if (!cleaned.startsWith('{')) {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            cleaned = cleaned.slice(first, last + 1).trim();
        }
    }
    const parsed = JSON.parse(cleaned);
    const result = {
        is_plant: Boolean(parsed.is_plant ?? true),
        is_blurry: Boolean(parsed.is_blurry ?? false),
        quality_score: Number(parsed.quality_score ?? 1),
        status: ['ok', 'retry', 'reject'].includes(parsed.status) ? parsed.status : 'ok',
        reason: parsed.reason ? String(parsed.reason) : '',
        suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.map((s) => String(s)).filter(Boolean)
            : [],
        rawResponse: parsed,
    };
    return result;
}

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

async function runShopAssistant({ env, diseaseName, activeIngredient, location, landSize }) {
    const fallback = (meta = {}) => ({
        source: 'shop-assistant-mock',
        provider: 'mock',
        shopping_advice: {
            active_ingredient: activeIngredient || null,
            recommended_brands: [],
            volume_calculation: {
                analysis: 'Data tidak cukup untuk perhitungan otomatis.',
                buying_tip: 'Diskusikan dengan toko pertanian terdekat.',
            },
            complementary_tools: [],
        },
        shop_finder: {
            maps_query: 'Toko Pertanian dekat saya',
        },
        safety_disclaimer: 'Ini hanya saran umum. Ikuti selalu label resmi produk.',
        rawResponse: meta.rawResponse || null,
    });

    // 1) Custom endpoint jika tersedia
    if (env.AI_DIAG_ENDPOINT) {
        try {
            const payload = {
                type: 'shop_assistant',
                disease_name: diseaseName,
                active_ingredient: activeIngredient,
                location,
                land_size: landSize,
            };
            const headers = { 'Content-Type': 'application/json' };
            if (env.AI_DIAG_API_KEY) headers.Authorization = `Bearer ${env.AI_DIAG_API_KEY}`;

            const resp = await fetch(env.AI_DIAG_ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Shop assistant endpoint error ${resp.status}: ${detail}`);
            }
            const data = await resp.json().catch(() => ({}));
            return {
                source: 'shop-assistant',
                provider: 'custom-api',
                shopping_advice: data.shopping_advice || {},
                shop_finder: data.shop_finder || null,
                safety_disclaimer: data.safety_disclaimer || 'Harga estimasi. Ikuti label kemasan.',
                rawResponse: data,
            };
        } catch (err) {
            console.warn('[runShopAssistant] custom endpoint failed, fallback to mock:', err?.message || err);
            return fallback({ rawResponse: { error: String(err) } });
        }
    }

    // 2) Gemini fallback
    if (env.GEMINI_API_KEY) {
        try {
            const parts = [
                { text: SHOP_ASSISTANT_PROMPT },
                { text: `Masalah: ${diseaseName || '-'}` },
                { text: `Bahan aktif: ${activeIngredient || '-'}` },
                { text: `Lokasi: ${JSON.stringify(location || null)}` },
                { text: `Luas lahan: ${JSON.stringify(landSize || null)}` },
            ];

            const generationConfig = buildGenerationConfig(env, 'shop');
            const payload = {
                contents: [{ parts }],
                ...(generationConfig ? { generationConfig } : {}),
            };
            const resp = await fetch(`${buildGeminiUrl(env, 'diagnosis')}?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Gemini shop assistant error ${resp.status}: ${detail}`);
            }
            const data = await resp.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let cleaned = (text || '').trim();
            const fence = cleaned.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
            if (fence) cleaned = fence[1].trim();
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
                throw new Error(`Gemini parse failed: ${err?.message || err}`);
            }

            return {
                source: 'shop-assistant',
                provider: 'gemini',
                shopping_advice: parsed.shopping_advice || {},
                shop_finder: parsed.shop_finder || null,
                safety_disclaimer: parsed.safety_disclaimer || 'Harga estimasi. Ikuti label kemasan.',
                rawResponse: parsed,
            };
        } catch (err) {
            console.warn('[runShopAssistant] Gemini failed, fallback to mock:', err?.message || err);
            return fallback({ rawResponse: { error: String(err) } });
        }
    }

    // 3) Mock total jika tidak ada AI online
    return fallback();
}

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

    const generationConfig = buildGenerationConfig(env, 'diagnosis');
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
        ...(generationConfig ? { generationConfig } : {}),
    };

    console.log('[AI] Calling Gemini API with crop+weather context...');
    const resp = await fetch(`${buildGeminiUrl(env, 'diagnosis')}?key=${apiKey}`, {
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
    const cleaned = normalizeJsonText(text || '');

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

/**
 * @param {{ env: any, imageBase64: string, meta?: any }} params
 * @returns {Promise<ImagePrecheckResult>}
 */
async function runImagePrecheck({ env, imageBase64, meta }) {
    if (!imageBase64) {
        return {
            is_plant: true,
            is_blurry: false,
            quality_score: 1,
            status: 'ok',
            reason: 'Precheck dilewati: tidak ada gambar.',
            suggestions: [],
            rawResponse: null,
        };
    }

    // 1) Custom endpoint jika tersedia
    if (env.AI_PRECHECK_ENDPOINT) {
        try {
            const payload = {
                type: 'image_precheck',
                image: `data:image/jpeg;base64,${imageBase64}`,
                meta,
            };
            const headers = { 'Content-Type': 'application/json' };
            if (env.AI_DIAG_API_KEY) headers.Authorization = `Bearer ${env.AI_DIAG_API_KEY}`;

            const resp = await fetch(env.AI_PRECHECK_ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Precheck endpoint error ${resp.status}: ${detail}`);
            }
            const data = await resp.json().catch(() => ({}));
            return {
                is_plant: Boolean(data.is_plant ?? true),
                is_blurry: Boolean(data.is_blurry ?? false),
                quality_score: Number(data.quality_score ?? 1),
                status: ['ok', 'retry', 'reject'].includes(data.status) ? data.status : 'ok',
                reason: data.reason ? String(data.reason) : '',
                suggestions: Array.isArray(data.suggestions)
                    ? data.suggestions.map((s) => String(s)).filter(Boolean)
                    : [],
                rawResponse: data,
            };
        } catch (err) {
            console.warn('[runImagePrecheck] custom endpoint failed, fallback to ok:', err?.message || err);
        }
    }

    // 2) Gemini fallback
    if (env.GEMINI_API_KEY) {
        try {
            const parts = [
                { text: IMAGE_PRECHECK_PROMPT },
                ...(meta ? [{ text: `Konteks tambahan (opsional): ${JSON.stringify(meta)}` }] : []),
                {
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64,
                    },
                },
            ];

            const generationConfig = buildGenerationConfig(env, 'precheck');
            const payload = {
                contents: [{ parts }],
                ...(generationConfig ? { generationConfig } : {}),
            };
            const resp = await fetch(`${buildGeminiUrl(env, 'precheck')}?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Gemini precheck error ${resp.status}: ${detail}`);
            }
            const data = await resp.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const result = parseImagePrecheckResponse(text);
            result.rawResponse = result.rawResponse || data;
            return result;
        } catch (err) {
            console.warn('[runImagePrecheck] Gemini failed, fallback to ok:', err?.message || err);
        }
    }

    // 3) Fallback ok
    return {
        is_plant: true,
        is_blurry: false,
        quality_score: 1,
        status: 'ok',
        reason: 'Precheck otomatis gagal, lanjutkan diagnosa seperti biasa.',
        suggestions: [],
        rawResponse: { error: 'precheck_failed' },
    };
}

/**
 * @param {{ env: any, finalResult: any, meta?: any }} params
 * @returns {Promise<{ source: string, provider: string, plan: any, rawResponse: any }>}
 */
async function runPlanner({ env, finalResult, meta }) {
    const fallbackPlanner = (metaData = {}) => ({
        source: 'planner-mock',
        provider: 'mock',
        plan: {
            summary: 'Rencana umum: pantau gejala dan lakukan perbaikan dasar.',
            phases: [
                {
                    id: 'immediate',
                    title: 'Langkah awal',
                    timeframe: 'Hari ini',
                    priority: 'sedang',
                    goals: ['Mengendalikan gejala paling berat', 'Mencegah penyebaran di lahan'],
                    steps: [
                        {
                            id: 'step_observasi',
                            title: 'Observasi tanaman di beberapa titik',
                            description:
                                'Periksa beberapa tanaman di beberapa titik lahan untuk melihat seberapa luas gejala menyebar.',
                            category: 'pemantauan',
                            related_recommendation_ids: [],
                        },
                    ],
                },
            ],
            warnings: [],
            recheck_advice: [
                'Jika gejala makin parah dalam 3-5 hari, konsultasi dengan penyuluh atau foto ulang untuk diagnosa ulang.',
            ],
        },
        rawResponse: { type: 'mock', meta: metaData },
    });

    const diagnosis = finalResult?.diagnosis || {};
    const recommendations = Array.isArray(finalResult?.recommendations) ? finalResult.recommendations : [];
    const rawDiagnosis = finalResult?.rawResponse || null;

    // 1) Custom endpoint
    if (env.AI_DIAG_ENDPOINT) {
        try {
            const payload = {
                type: 'planner',
                diagnosis,
                recommendations,
                raw_diagnosis: rawDiagnosis,
                meta,
            };
            const headers = { 'Content-Type': 'application/json' };
            if (env.AI_DIAG_API_KEY) headers.Authorization = `Bearer ${env.AI_DIAG_API_KEY}`;

            const resp = await fetch(env.AI_DIAG_ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Planner endpoint error ${resp.status}: ${detail}`);
            }
            const data = await resp.json().catch(() => ({}));
            return {
                source: 'planner',
                provider: 'custom-api',
                plan: data.plan || data,
                rawResponse: data,
            };
        } catch (err) {
            console.warn('[runPlanner] custom endpoint failed, fallback to next:', err?.message || err);
        }
    }

    // 2) Gemini fallback
    if (env.GEMINI_API_KEY) {
        try {
            const parts = [
                { text: PLANNER_PROMPT },
                {
                    text: `DATA DIAGNOSA:\n${JSON.stringify(
                        { diagnosis, recommendations, raw_diagnosis: rawDiagnosis },
                        null,
                        2,
                    )}`,
                },
                { text: `KONTEKS TAMBAHAN:\n${JSON.stringify(meta || null, null, 2)}` },
            ];

            const generationConfig = buildGenerationConfig(env, 'planner');
            const payload = {
                contents: [{ parts }],
                ...(generationConfig ? { generationConfig } : {}),
            };
            const resp = await fetch(`${buildGeminiUrl(env, 'planner')}?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const detail = await resp.text();
                throw new Error(`Gemini planner error ${resp.status}: ${detail}`);
            }
            const data = await resp.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let cleaned = (text || '').trim();
            const fence = cleaned.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
            if (fence) cleaned = fence[1].trim();
            if (!cleaned.startsWith('{')) {
                const first = cleaned.indexOf('{');
                const last = cleaned.lastIndexOf('}');
                if (first !== -1 && last !== -1 && last > first) {
                    cleaned = cleaned.slice(first, last + 1).trim();
                }
            }
            const parsed = JSON.parse(cleaned);
            const plan = parsed.plan || parsed;

            return {
                source: 'planner',
                provider: 'gemini',
                plan,
                rawResponse: parsed,
            };
        } catch (err) {
            console.warn('[runPlanner] Gemini failed, fallback to mock:', err?.message || err);
        }
    }

    return fallbackPlanner(meta);
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
    planner,
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
    precheck: onlineResult?.precheck || null,
    planner: planner || null,
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

    let precheckResult = null;
    let onlineResult = null;
    let onlineError = null;
    if (imageBase64) {
        const precheckEnabled = isPrecheckEnabled(env);
        if (precheckEnabled) {
            try {
                precheckResult = await runImagePrecheck({ env, imageBase64, meta });
            } catch (err) {
                console.warn('[handleCreateDiagnosis] image precheck failed:', err);
                precheckResult = null;
            }
        }

        const skipOnline = precheckEnabled && shouldSkipOnlineDiagnosis(precheckResult);

        if (skipOnline) {
            const precheckOnly = buildPrecheckFailureResult(precheckResult, meta);
            onlineResult = precheckOnly.onlineResult;
        } else {
            try {
                onlineResult = await runOnlineDiagnosis({ env, imageBase64, meta });
            } catch (err) {
                onlineError = err?.message || String(err);
                console.warn('[handleCreateDiagnosis] online AI failed, will fallback to localResult:', onlineError);
            }
        }
    }

    if (onlineResult && meta.weather && !onlineResult.weather) {
        onlineResult.weather = meta.weather;
        if (onlineResult.rawResponse && typeof onlineResult.rawResponse === 'object' && !onlineResult.rawResponse.weather) {
            onlineResult.rawResponse.weather = meta.weather;
        }
    }

    if (onlineResult && precheckResult) {
        onlineResult.precheck = precheckResult;
        if (onlineResult.rawResponse && typeof onlineResult.rawResponse === 'object' && !onlineResult.rawResponse.precheck) {
            onlineResult.rawResponse.precheck = precheckResult;
        }
    }

    if (onlineResult && onlineResult.diagnosis) {
        applyNormalizedConfidence(onlineResult, onlineResult.diagnosis);
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

    // Pastikan confidence diagnosis tersinkron 0-100
    diagnosis.confidence = normalizeConfidence(diagnosis.confidence);
    if (onlineResult?.rawResponse) {
        if (!onlineResult.rawResponse.confidence_explanation) {
            onlineResult.rawResponse.confidence_explanation = {
                confidence_score: diagnosis.confidence,
                reasoning: '',
                when_to_recheck: [],
            };
        } else {
            onlineResult.rawResponse.confidence_explanation.confidence_score = diagnosis.confidence;
        }
    }

    let planner = null;
    try {
        if (isPlannerEnabled(env) && diagnosis.label !== 'Foto Tidak Valid') {
            planner = await runPlanner({
                env,
                finalResult,
                meta: {
                    fieldId: submissionData.field_id,
                    cropType: submissionData.crop_type,
                    latitude: submissionData.latitude,
                    longitude: submissionData.longitude,
                    notes: submissionData.notes,
                    affectedParts,
                    weather: meta.weather || null,
                    precheck: onlineResult?.precheck || null,
                },
            });
        }
    } catch (err) {
        console.warn('[handleCreateDiagnosis] planner failed:', err?.message || err);
        planner = null;
    }

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
        planner,
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
        let precheckResult = null;
        const precheckEnabled = isPrecheckEnabled(env);
        if (precheckEnabled) {
            try {
                precheckResult = await runImagePrecheck({
                    env,
                    imageBase64: base64,
                    meta: { ...meta, accountId, userId },
                });
            } catch (err) {
                console.warn('[handleOnlineDiagnosis] image precheck failed:', err);
                precheckResult = null;
            }
        }

        const skipOnline = precheckEnabled && shouldSkipOnlineDiagnosis(precheckResult);

        let result;
        if (skipOnline) {
            const precheckOnly = buildPrecheckFailureResult(precheckResult, { ...meta, accountId, userId });
            result = precheckOnly.onlineResult;
        } else {
            result = await runOnlineDiagnosis({
                env,
                imageBase64: base64,
                meta: { ...meta, accountId, userId },
            });
        }

        if (precheckResult && result) {
            result.precheck = precheckResult;
            if (result.rawResponse && typeof result.rawResponse === 'object' && !result.rawResponse.precheck) {
                result.rawResponse.precheck = precheckResult;
            }
        }

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

export async function handleShopAssistant(c) {
    const env = c.env;
    const request = c.req.raw;

    let body = {};
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, env, request);
    }

    const { diseaseName, activeIngredient, location, landSize } = body || {};

    if (!diseaseName && !activeIngredient) {
        return json({ error: 'diseaseName atau activeIngredient wajib diisi' }, 400, env, request);
    }

    try {
        const result = await runShopAssistant({
            env,
            diseaseName,
            activeIngredient,
            location: location || null,
            landSize: landSize || null,
        });
        return json(result, 200, env, request);
    } catch (err) {
        return json(
            {
                error: 'Shop assistant failed',
                detail: err?.message || String(err),
            },
            500,
            env,
            request,
        );
    }
}

export async function handlePlannerOnDemand(c) {
    const env = c.env;
    const request = c.req.raw;

    let body = {};
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, env, request);
    }

    const diagnosis = body?.diagnosis || null;
    const recommendations = Array.isArray(body?.recommendations) ? body.recommendations : [];
    const rawDiagnosis = body?.raw_diagnosis ?? body?.rawDiagnosis ?? body?.rawResponse ?? null;
    const meta = body?.meta || null;

    try {
        const planner = await runPlanner({
            env,
            finalResult: {
                diagnosis,
                recommendations,
                rawResponse: rawDiagnosis,
            },
            meta,
        });
        return json(planner, 200, env, request);
    } catch (err) {
        return json(
            {
                error: 'Planner failed',
                detail: err?.message || String(err),
            },
            500,
            env,
            request,
        );
    }
}

export { runShopAssistant, normalizeConfidence, applyNormalizedConfidence, runImagePrecheck, parseImagePrecheckResponse, shouldSkipOnlineDiagnosis, buildPrecheckFailureResult, runPlanner, isPlannerEnabled };
