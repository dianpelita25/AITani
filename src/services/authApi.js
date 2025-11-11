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

    // Endpoint untuk 'register' (tetap sama)
    register: builder.mutation({
      query: (userInfo) => ({
        url: 'auth/register',
        method: 'POST',
        body: userInfo,
      }),
    }),

    // Endpoint untuk meminta link reset password
    forgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),

    // Endpoint untuk mengirim password baru beserta token reset
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: { token, password },
      }),
    }),
  }),
});

// Ekspor semua hook yang kita butuhkan sekarang.
export const { 
    useLoginMutation, 
    useRegisterMutation, 
    useForgotPasswordMutation, 
    useResetPasswordMutation 
} = authApi;