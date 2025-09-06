// src/services/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Ganti baseUrl ini dengan alamat server Anda jika sudah ada.
// Untuk sekarang, kita gunakan alamat dummy.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://ai-tani-kupang-api.olif-tf.workers.dev/' }),
  tagTypes: ['Alerts', 'Diagnosis', 'Events'],
  endpoints: () => ({}),
});