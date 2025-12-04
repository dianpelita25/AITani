// src/services/api.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-hot-toast';
import { logOut } from './authSlice'; // [PERBAIKAN 1] Impor instruksi logOut

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const baseUrl = `${RAW_BASE.replace(/\/+$/, '')}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    let token = getState().auth.token;
    if (!token) {
        token = localStorage.getItem('sessionToken');
    }
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    const userProfile = getState().auth.user || JSON.parse(localStorage.getItem('userProfile') || '{}');
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
  if (typeof window === 'undefined' || error.status === 401) return; // Jangan tampilkan toast untuk 401
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const detail = error?.data;
  const msgFromBody = typeof detail === 'string' ? detail : detail?.message || detail?.error;
  const message = offline ? 'Sedang offline. Periksa koneksi.' : msgFromBody || `Permintaan gagal (${error?.status || 'unknown'})`;
  toast.error(message, { id: errorToastId(args), duration: 4500 });
};

// [PERBAIKAN 2] Buat "wrapper" di sekitar baseQuery untuk menangani 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // Jika kita mendapatkan error 401, jalankan logout
  if (result.error && result.error.status === 401) {
    console.error("Menerima 401 Unauthorized. Menjalankan auto-logout.");
    api.dispatch(logOut());
    // Kita bisa menambahkan redirect di sini jika perlu, tapi logOut sudah membersihkan state
    // dan aplikasi akan secara alami mengarahkan ke halaman login.
  } else if (result.error) {
    notifyApiError(result.error, args);
  }

  return result;
};


export const api = createApi({
  reducerPath: 'api',
  // [PERBAIKAN 3] Gunakan wrapper baru kita sebagai baseQuery
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Alerts', 'FarmTasks', 'DiagnosisHistory'],
  endpoints: () => ({}),
});