// src/services/weatherApi.js
import axios from 'axios';

/**
 * Get weather advice from our API (BMKG-backed).
 * @param {{ lat: number, lon: number, date?: string }} params
 */
export async function getWeatherAdvice(params) {
  const q = new URLSearchParams();
  if (typeof params?.lat === 'number') q.set('lat', String(params.lat));
  if (typeof params?.lon === 'number') q.set('lon', String(params.lon));
  if (params?.date) q.set('date', params.date);
  const { data } = await axios.get(`/api/weather/advice?${q.toString()}`);
  return data;
}

