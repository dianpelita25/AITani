// src/services/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-hot-toast';

// Normalisasi baseUrl agar SELALU pakai /api di belakang,
// dan hindari double slash kalau env ada trailing slash.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const baseUrl = `${RAW_BASE.replace(/\/+$/, '')}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    headers.set('X-Account-Id', localStorage.getItem('accountId') || 'demo');
    headers.set('X-User-Id', localStorage.getItem('userId') || 'demo');
    return headers;
  },
});

const errorToastId = (args) => {
  if (typeof args === 'string') return `api-error-${args}`;
  if (typeof args === 'object' && args?.url) return `api-error-${args.url}`;
  return 'api-error-generic';
};

const notifyApiError = (error, args) => {
  if (typeof window === 'undefined') return;
  const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
  const detail = error?.data;
  const msgFromBody =
    typeof detail === 'string'
      ? detail
      : detail?.message || detail?.error || detail?.reason;

  const message = offline
    ? 'Sedang offline. Periksa koneksi lalu coba lagi.'
    : msgFromBody || `Permintaan gagal (${error?.status || 'unknown'})`;

  toast.error(message, {
    id: errorToastId(args),
    duration: 4500,
  });
};

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error) {
    notifyApiError(result.error, args);
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Alerts', 'Events', 'DiagnosisHistory'],
  endpoints: () => ({}),
});
