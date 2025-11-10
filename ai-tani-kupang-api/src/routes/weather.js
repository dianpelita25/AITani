// ai-tani-kupang-api/src/routes/weather.js

import { json } from './utils';

// Handler utama untuk GET /api/weather/advice
export async function handleGetWeatherAdvice(c) {
    const env = c.env;
    const request = c.req.raw;
    const url = new URL(request.url);

    const lat = parseFloat(url.searchParams.get("lat") || "-10.177"); // Default ke Kupang
    const lon = parseFloat(url.searchParams.get("lon") || "123.607");
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const kv = env.KV;

    const q = (n) => Math.round(n * 100) / 100; // Pembulatan untuk cache key
    const key = `weather:advice:${date}:${q(lat)}:${q(lon)}`;

    // Coba ambil dari cache terlebih dahulu
    if (kv) {
        try {
            const cached = await kv.get(key, { type: "json" });
            if (cached) {
                return json({ ...cached, cached: true }, 200, env, request);
            }
        } catch(e) { console.error("KV get failed:", e); }
    }

    // Jika tidak ada di cache, ambil data baru
    try {
        const data = await getWeatherAdviceBMKG(lat, lon);
        
        // Simpan ke cache untuk 3 jam ke depan
        if (kv) {
            await kv.put(key, JSON.stringify(data), { expirationTtl: 3 * 60 * 60 });
        }

        return json(data, 200, env, request);
    } catch (err) {
        // Jika API BMKG gagal, gunakan data heuristik sebagai fallback
        console.warn("BMKG fetch failed, using heuristic fallback:", err.message);
        const fallbackData = buildHeuristicAdvice(lat, lon);
        return json(fallbackData, 200, env, request);
    }
}


// ===== Helper Functions (diambil dari index.js lama) =====

async function getWeatherAdviceBMKG(lat, lon) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort('timeout'), 5000);
  try {
    // NOTE: URL ini di-hardcode ke Kupang di kode lama Anda. Kita pertahankan untuk saat ini.
    const resp = await fetch(`https://ibnux.github.io/BMKG-importer/cuaca/501190.json`, { signal: controller.signal });
    clearTimeout(to);
    if (!resp.ok) throw new Error(`BMKG status ${resp.status}`);
    
    const list = await resp.json();
    const willRain = Array.isArray(list) && list.some((x) => /hujan/i.test(x.cuaca || ''));
    const rainfall_mm = willRain ? 8 + Math.random() * 10 : Math.random() * 1.5;
    const advice = willRain
      ? 'Potensi hujan. Jadwalkan penyemprotan pada pagi hari atau tunda.'
      : 'Cuaca cerah/berawan. Cocok untuk kegiatan di lapangan.';
      
    return {
      source: 'BMKG',
      lat, lon,
      date: new Date().toISOString().slice(0, 10),
      summary: willRain ? 'Berpotensi hujan' : 'Cerah/berawan',
      rainfall_mm: Math.round(rainfall_mm * 10) / 10,
      advice,
    };
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}

function buildHeuristicAdvice(lat, lon) {
  const hour = new Date().getUTCHours();
  const rainish = (hour % 5) === 0; // Logika pseudo dari kode lama Anda
  const rainfall_mm = rainish ? 6.2 : 0.3;
  const advice = rainish
    ? 'Kemungkinan hujan. Pertimbangkan penjadwalan pagi/sore.'
    : 'Cocok untuk kegiatan penanaman/pemupukan.';
  return {
    source: 'BMKG-heuristic',
    lat, lon,
    date: new Date().toISOString().slice(0, 10),
    summary: rainish ? 'Berpotensi hujan (heuristik)' : 'Cerah/berawan (heuristik)',
    rainfall_mm,
    advice,
  };
}