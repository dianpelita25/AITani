// src/services/alertsApi.js
import { api } from './api';

const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};

const parseMaybeJson = (v) => {
  if (v == null) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

const toCamelAlert = (a) => ({
  ...a,
  id: a.id,
  timestamp: a.timestamp,
  pestType: a.pestType ?? a.pest_type ?? null,
  severity: a.severity,
  description: a.description,
  affectedCrops:
    Array.isArray(a.affected_crops) || typeof a.affected_crops === 'string'
      ? a.affected_crops
      : a.affectedCrops ?? null,
  location: a.location ?? null,
  coordinates: parseMaybeJson(a.coordinates),
  photoName: a.photoName ?? a.photo_name ?? null,
  photoUrl: a.photoUrl ?? a.photo_url ?? null,
  photoKey: a.photoKey ?? a.photo_key ?? null,          // ← DITAMBAHKAN
  affectedArea: a.affectedArea ?? a.affected_area ?? null,
  pestCount: a.pestCount ?? a.pest_count ?? null,
  accountId: a.account_id ?? a.accountId ?? null,
  userId: a.user_id ?? a.userId ?? null,
  createdAt: a.created_at ?? a.createdAt ?? null,
  updatedAt: a.updated_at ?? a.updatedAt ?? null,
  deletedAt: a.deleted_at ?? a.deletedAt ?? null,
  version: a.version ?? 1,
  hasPhoto: !!(a.photo_key || a.photo_url || a.photoUrl || a.photo_name || a.photoName), // ← DITAMBAHKAN
});

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query({
      query: (filters) => {
        const params = new URLSearchParams({ radius: 'all', severity: 'all', pestType: 'all' });
        if (filters) {
          params.set('radius', filters.distance || 'all');
          params.set('severity', filters.severity || 'all');
          params.set('pestType', filters.pestType || 'all');
        }
        return `alerts?${params.toString()}`;
      },
      transformResponse: (res) => Array.isArray(res) ? res.map(toCamelAlert) : [],
      providesTags: ['Alerts'],
    }),

    createAlert: builder.mutation({
      query: (newAlertData) => {
        const formData = new FormData();
        const payload = { ...newAlertData };

        // Offline replay: dataURL → File
        if (typeof payload.photo === 'string' && payload.photo.startsWith('data:')) {
          payload.photo = dataURLtoFile(
            payload.photo,
            payload.photoName || 'offline-photo.jpg'
          );
        }

        Object.keys(payload).forEach((k) => {
          const v = payload[k];
          if (v == null) return;
          if (v instanceof File) formData.append(k, v, v.name);
          else if (typeof v === 'object') formData.append(k, JSON.stringify(v));
          else formData.append(k, v);
        });

        return { url: 'alerts', method: 'POST', body: formData };
      },
      invalidatesTags: ['Alerts'],
    }),
  }),
});

export const { useGetAlertsQuery, useCreateAlertMutation } = alertsApi;
