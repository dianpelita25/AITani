// src/services/alertsApi.js
import { api } from './api';

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Definisi untuk mengambil (GET) semua alerts
    getAlerts: builder.query({
      query: (filters) => `alerts?radius=${filters.radius}`, // Contoh filter
      providesTags: ['Alerts'], // Tandai data ini sebagai 'Alerts'
    }),
    // Definisi untuk membuat (POST) alert baru
    createAlert: builder.mutation({
      query: (newAlertData) => ({
        url: 'alerts',
        method: 'POST',
        body: newAlertData,
      }),
      invalidatesTags: ['Alerts'], // Jika berhasil, data 'Alerts' akan diambil ulang
    }),
  }),
});

// Ekspor "hooks" yang bisa digunakan di komponen React Anda
export const { useGetAlertsQuery, useCreateAlertMutation } = alertsApi;