// src/services/authSlice.js

import { createSlice } from '@reduxjs/toolkit';

// Ini adalah keadaan awal saat aplikasi pertama kali dibuka.
// Awalnya, tidak ada pengguna yang login.
const initialState = {
  user: null,         // Untuk menyimpan data profil pengguna (nama, email, dll.)
  token: null,        // Untuk menyimpan Token JWT
  isAuthenticated: false, // Penanda sederhana apakah sudah login atau belum
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  // 'reducers' adalah kumpulan "instruksi" untuk mengubah state.
  reducers: {
    // Instruksi ini akan dijalankan saat login berhasil.
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      // Simpan token ke localStorage agar tidak hilang saat refresh.
      // Ini seperti menyimpan "tiket masuk" ke dalam dompet.
      localStorage.setItem('sessionToken', token);
      // Simpan juga data pengguna jika perlu
      localStorage.setItem('userProfile', JSON.stringify(user));
    },

    // Instruksi ini akan dijalankan saat logout.
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // Hapus "tiket masuk" dari dompet.
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userProfile');
    },
  },
});

// Ekspor "instruksi" agar bisa digunakan di komponen lain.
export const { setCredentials, logOut } = authSlice.actions;

// Ekspor reducer agar bisa dihubungkan ke "otak" utama Redux.
export default authSlice.reducer;

// Ekspor "selector" untuk memudahkan pengambilan data dari state.
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;