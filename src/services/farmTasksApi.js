// src/services/farmTasksApi.js
import { api } from './api';

// Helper ISO
const iso = (d) => new Date(d).toISOString();

// Range default: -14 s/d +14 hari
const defaultRange = () => {
  const now = new Date();
  const from = new Date(now); from.setDate(from.getDate() - 14);
  const to   = new Date(now); to.setDate(to.getDate() + 14);
  return { from: iso(from), to: iso(to) };
};

export const farmTasksApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // GET /farm-tasks?from=&to=&status=
    getFarmTasks: builder.query({
      query: (params) => {
        const range = params ?? defaultRange();
        const qs = new URLSearchParams({ from: range.from, to: range.to });
        if (range.status) qs.set('status', range.status);
        // [PERUBAHAN KUNCI] Menggunakan URL baru
        return `farm-tasks?${qs.toString()}`;
      },
      // Normalisasi bentuk data agar cocok dengan kebutuhan UI
      transformResponse: (res) => {
        if (!Array.isArray(res)) return [];
        return res.map((e) => {
          const start = e.start_at ? new Date(e.start_at) : null;
          const date = start ? start.toISOString().slice(0, 10) : undefined;
          const time = start ? start.toISOString().slice(11, 16) : undefined;
          const completed = (e.status || '').toLowerCase() === 'completed';
          return { ...e, date, time, completed };
        });
      },
      providesTags: ['FarmTasks'], // [PERUBAHAN KUNCI]
    }),

    // POST /farm-tasks
    createFarmTask: builder.mutation({
      query: (taskData) => {
        // Susun start_at jika FE awalnya kirim {date, time} - LOGIKA LENGKAP ASLI
        const start_at =
          taskData.start_at ||
          new Date(
            (taskData.date || new Date().toISOString().slice(0, 10)) +
            (taskData.time ? `T${taskData.time}:00Z` : 'T00:00:00Z')
          ).toISOString();

        const body = {
          id: taskData.id,
          title: taskData.title,
          type: taskData.type ?? null,
          crop: taskData.crop ?? null,
          location: taskData.location ?? null,
          // Backend akan JSON.stringify(notes), jadi kirimkan array/object OK
          notes: taskData.notes ?? [],
          start_at,
          end_at: taskData.end_at ?? null,
          all_day: taskData.all_day ? 1 : 0,
          status: taskData.status ?? 'pending',
          source_type: taskData.source_type ?? null,
          source_id: taskData.source_id ?? null,
        };
        // [PERUBAHAN KUNCI] Menggunakan URL baru
        return { url: 'farm-tasks', method: 'POST', body };
      },
      invalidatesTags: ['FarmTasks'], // [PERUBAHAN KUNCI]
    }),

    // PATCH /farm-tasks/:id
    updateFarmTask: builder.mutation({
      query: ({ id, ...updates }) => ({
        // [PERUBAHAN KUNCI] Menggunakan URL baru
        url: `farm-tasks/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['FarmTasks'], // [PERUBAHAN KUNCI]
    }),

    // DELETE /farm-tasks/:id
    deleteFarmTask: builder.mutation({
      query: (id) => ({
        // [PERUBAHAN KUNCI] Menggunakan URL baru
        url: `farm-tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FarmTasks'], // [PERUBAHAN KUNCI]
    }),

  }),
});

export const {
  useGetFarmTasksQuery,
  useCreateFarmTaskMutation,
  useUpdateFarmTaskMutation,
  useDeleteFarmTaskMutation,
} = farmTasksApi;