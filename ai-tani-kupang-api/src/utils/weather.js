// ai-tani-kupang-api/src/utils/weather.js
// Util cuaca dengan fallback mock; kini memakai Open-Meteo sebagai sumber utama.
// TODO: integrasi ke API BMKG SATU PETA / layanan cuaca lain di masa depan.
// Fungsi ini harus tetap mengembalikan WeatherSnapshot meski layanan eksternal down.

/**
 * WeatherSnapshot shape (JS doc, bukan TS):
 * {
 *   source: 'mock-local' | 'bmkg' | 'open-meteo' | string,
 *   observedAt: string,          // ISO timestamp
 *   locationName?: string,
 *   latitude?: number,
 *   longitude?: number,
 *   tempC: number | null,        // suhu dalam Celsius (C)
 *   temp: number | null,         // alias untuk tempC
 *   humidity: number | null,     // kelembapan RH %
 *   condition: string | null,    // deskripsi cuaca
 *   rainMm1h?: number | null,
 *   rainMm24h?: number | null,
 *   windSpeedKph?: number | null,
 *   windDirectionDeg?: number | null,
 *   moistureLevel?: 'kering' | 'normal' | 'lembap' | null,
 *   heatLevel?: 'sejuk' | 'normal' | 'panas' | 'sangat_panas' | null,
 * }
 */

const computeHeatLevel = (tempC) => {
  if (typeof tempC !== 'number') return null;
  if (tempC <= 24) return 'sejuk';
  if (tempC <= 32) return 'normal';
  if (tempC <= 36) return 'panas';
  return 'sangat_panas';
};

const computeMoistureLevel = (humidity) => {
  if (typeof humidity !== 'number') return null;
  if (humidity < 50) return 'kering';
  if (humidity <= 80) return 'normal';
  return 'lembap';
};

const buildSnapshot = ({
  source,
  observedAt,
  latitude,
  longitude,
  tempC,
  humidity,
  condition,
  locationName,
  rainMm1h = null,
  rainMm24h = null,
  windSpeedKph = null,
  windDirectionDeg = null,
}) => {
  const heatLevel = computeHeatLevel(tempC);
  const moistureLevel = computeMoistureLevel(humidity);

  return {
    source,
    observedAt,
    locationName: locationName || undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    tempC: typeof tempC === 'number' ? tempC : null,
    temp: typeof tempC === 'number' ? tempC : null, // alias untuk kompatibilitas
    humidity: typeof humidity === 'number' ? humidity : null,
    condition: condition || null,
    rainMm1h,
    rainMm24h,
    windSpeedKph,
    windDirectionDeg,
    moistureLevel,
    heatLevel,
  };
};

const mapWmoToCondition = (code) => {
  const map = {
    0: 'Cerah',
    1: 'Cerah Berawan',
    2: 'Berawan',
    3: 'Mendung',
    45: 'Berkabut',
    48: 'Kabut Tebal',
    51: 'Gerimis Ringan',
    53: 'Gerimis Sedang',
    55: 'Gerimis Lebat',
    61: 'Hujan Ringan',
    63: 'Hujan Sedang',
    65: 'Hujan Lebat',
    80: 'Hujan Lokal Ringan',
    81: 'Hujan Lokal Sedang',
    82: 'Hujan Lokal Lebat',
    95: 'Badai Petir',
    96: 'Badai Petir & Hujan Ringan',
    99: 'Badai Petir & Hujan Lebat',
  };
  return map[code] || 'Tidak Diketahui';
};

export async function fetchWeatherForLocation(env, { latitude, longitude }) {
  // env reserved for future use (misal integrasi layanan cuaca lain)
  const observedAt = new Date().toISOString();
  const latNum = Number(latitude);
  const lonNum = Number(longitude);

  if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(env?.WEATHER_TIMEOUT_MS || 8000));

      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', latNum);
      url.searchParams.set('longitude', lonNum);
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,rain');
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('forecast_days', '1');

      const resp = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`Open-Meteo error ${resp.status}`);

      const data = await resp.json().catch(() => ({}));
      const current = data?.current || {};

      const tempC = typeof current.temperature_2m === 'number' ? current.temperature_2m : Number(current.temperature_2m);
      const humidity = typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : Number(current.relative_humidity_2m);
      const wmoCode = typeof current.weather_code === 'number' ? current.weather_code : Number(current.weather_code);
      const rainMm1h = typeof current.rain === 'number' ? current.rain : Number(current.rain);

      return buildSnapshot({
        source: 'open-meteo',
        observedAt: current.time || observedAt,
        latitude: latNum,
        longitude: lonNum,
        tempC,
        humidity,
        condition: mapWmoToCondition(wmoCode),
        locationName: data?.timezone || undefined,
        rainMm1h: Number.isFinite(rainMm1h) ? rainMm1h : null,
        rainMm24h: null,
        windSpeedKph: null,
        windDirectionDeg: null,
      });
    } catch (err) {
      console.warn('[fetchWeatherForLocation] Open-Meteo failed, fallback to mock:', err?.message || err);
    }
  }

  // Fallback mock (default / jika parsing lat/lon gagal)
  return buildSnapshot({
    source: 'mock-open-meteo-fallback',
    observedAt,
    latitude: Number.isFinite(latNum) ? latNum : undefined,
    longitude: Number.isFinite(lonNum) ? lonNum : undefined,
    tempC: 32,
    humidity: 70,
    condition: 'Cerah Berawan',
  });
}
