import { api } from './api';

export const eventsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query({
      query: (month) => `events?month=${month}`,
      providesTags: ['Events'],
    }),
    createEvent: builder.mutation({
      query: (newEvent) => ({
        url: 'events',
        method: 'POST',
        body: newEvent,
      }),
      invalidatesTags: ['Events'],
    }),
  }),
});

export const { useGetEventsQuery, useCreateEventMutation } = eventsApi;
