// src/services/api.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-hot-toast';

// Normalisasi baseUrl agar SELALU pakai /api di belakang,
// dan hindari double slash kalau env ada trailing slash.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const baseUrl = `${RAW_BASE.replace(/\/+$/, '')}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  // 'prepareHeaders' adalah fungsi yang berjalan sebelum setiap permintaan dikirim.
  // Ini adalah tempat yang sempurna untuk menambahkan token kita.
  prepareHeaders: (headers, { getState }) => {
    // 1. Ambil state 'auth' dari memori Redux.
    // Kita coba ambil token dari Redux dulu, jika tidak ada, coba dari localStorage.
    let token = getState().auth.token;
    if (!token) {
        token = localStorage.getItem('sessionToken');
    }

    // 2. Jika token ditemukan, tambahkan ke header 'Authorization'.
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Header X-User-Id dan X-Account-Id tidak lagi menjadi sumber utama identitas,
    // tetapi kita bisa tetap mengirimkannya sebagai fallback atau untuk logging.
    const userProfile = getState().auth.user || JSON.parse(localStorage.getItem('userProfile'));
    headers.set('X-Account-Id', userProfile?.accountId || 'demo');
    headers.set('X-User-Id', userProfile?.userId || 'demo');

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
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const detail = error?.data;
  const msgFromBody = typeof detail === 'string' ? detail : detail?.message || detail?.error;
  const message = offline ? 'Sedang offline. Periksa koneksi.' : msgFromBody || `Permintaan gagal (${error?.status || 'unknown'})`;
  toast.error(message, { id: errorToastId(args), duration: 4500 });
};

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error) {
    // Jangan tampilkan toast untuk error 401 (Unauthorized), 
    // karena kita akan menangani ini dengan mengarahkan pengguna ke halaman login.
    if (result.error.status !== 401) {
        notifyApiError(result.error, args);
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Alerts', 'FarmTasks', 'DiagnosisHistory'],
  endpoints: () => ({}),
});