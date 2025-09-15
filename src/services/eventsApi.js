// src/services/eventsApi.js
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

export const eventsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // GET /events?from=&to=&status=
    getEvents: builder.query({
      query: (params) => {
        const range = params ?? defaultRange();
        const qs = new URLSearchParams({ from: range.from, to: range.to });
        if (range.status) qs.set('status', range.status);
        return `events?${qs.toString()}`;
      },
      // Normalisasi bentuk data agar cocok dengan kebutuhan UI
      transformResponse: (res) => {
        if (!Array.isArray(res)) return [];
        return res.map((e) => {
          // start_at ISO -> pecah jadi tanggal (YYYY-MM-DD) dan waktu (HH:mm)
          const start = e.start_at ? new Date(e.start_at) : null;
          const date = start ? start.toISOString().slice(0, 10) : undefined;
          const time = start ? start.toISOString().slice(11, 16) : undefined;

          // Backend pakai status 'pending'/'completed'; UI pakai boolean completed
          const completed = (e.status || '').toLowerCase() === 'completed';

          return {
            ...e,
            date,
            time,
            completed,
          };
        });
      },
      providesTags: ['Events'],
    }),

    // POST /events
    createEvent: builder.mutation({
      query: (eventData) => {
        // Susun start_at jika FE awalnya kirim {date, time}
        const start_at =
          eventData.start_at ||
          new Date(
            (eventData.date || new Date().toISOString().slice(0, 10)) +
            (eventData.time ? `T${eventData.time}:00Z` : 'T00:00:00Z')
          ).toISOString();

        const body = {
          id: eventData.id,
          title: eventData.title,
          type: eventData.type ?? null,
          crop: eventData.crop ?? null,
          location: eventData.location ?? null,
          // Backend akan JSON.stringify(notes), jadi kirimkan array/object OK
          notes: eventData.notes ?? [],
          start_at,
          end_at: eventData.end_at ?? null,
          all_day: eventData.all_day ? 1 : 0,
          status: eventData.status ?? 'pending',
          source_type: eventData.source_type ?? null,
          source_id: eventData.source_id ?? null,
        };

        return { url: 'events', method: 'POST', body };
      },
      invalidatesTags: ['Events'],
    }),

    // PATCH /events/:id
    updateEvent: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `events/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Events'],
    }),

    // DELETE /events/:id
    deleteEvent: builder.mutation({
      query: (id) => ({ url: `events/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Events'],
    }),

  }),
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;
