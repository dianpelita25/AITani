// src/services/authApi.js

import { api } from './api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Endpoint untuk 'login' (tetap sama)
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // BARU: Definisikan endpoint untuk 'register'
    register: builder.mutation({
      query: (userInfo) => ({
        url: 'auth/register',
        method: 'POST',
        body: userInfo, // userInfo akan berisi { fullName, email, password }
      }),
    }),
  }),
});

// BARU: Ekspor hook 'useRegisterMutation' bersama dengan yang lama.
export const { useLoginMutation, useRegisterMutation } = authApi;