// src/services/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalisasi baseUrl agar SELALU pakai /api di belakang,
// dan hindari double slash kalau env ada trailing slash.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const baseUrl = `${RAW_BASE.replace(/\/+$/, '')}/api`;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Tenant headers (fallback ke 'demo' kalau belum diset)
      headers.set('X-Account-Id', localStorage.getItem('accountId') || 'demo');
      headers.set('X-User-Id', localStorage.getItem('userId') || 'demo');
      return headers;
    },
  }),
  tagTypes: ['Alerts', 'Events', 'DiagnosisHistory'],
  endpoints: () => ({}),
});
