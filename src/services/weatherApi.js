// src/services/weatherApi.js

import { api } from './api';

// Slice RTK Query untuk cuaca
export const weatherApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Badge cuaca di form diagnosis (real-time snapshot)
    getWeather: builder.query({
      query: ({ lat, lon }) => ({
        url: '/weather',
        params: { lat, lon },
      }),
    }),

    // Saran cuaca untuk kalender / jadwal (AddEventModal.jsx)
    getWeatherAdvice: builder.query({
      query: ({ lat, lon, date }) => ({
        url: '/weather/advice',
        params: { lat, lon, date },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWeatherQuery,
  useGetWeatherAdviceQuery,
} = weatherApi;

/**
 * BACKWARD COMPAT:
 * Beberapa kode lama masih import { getWeatherAdvice } from './weatherApi'.
 * Kita sediakan helper function yang memanggil /api/weather/advice
 * supaya tidak bikin app blank / error lagi.
 */
export async function getWeatherAdvice({ lat, lon, date } = {}) {
  const params = new URLSearchParams();
  if (lat != null) params.set('lat', String(lat));
  if (lon != null) params.set('lon', String(lon));
  if (date) params.set('date', date);

  const resp = await fetch(`/api/weather/advice?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`Failed to fetch weather advice: ${resp.status}`);
  }
  return resp.json();
}
