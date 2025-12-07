// src/services/shopApi.js

import { api } from './api';

export const shopApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getShopEstimate: builder.mutation({
      query: (payload) => ({
        url: '/shop/estimate',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetShopEstimateMutation } = shopApi;
