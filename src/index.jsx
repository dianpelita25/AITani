console.log("Aplikasi Mulai: index.jsx sedang dieksekusi."); // <-- PENANDA 1

import React from "react";
import { createRoot } from "react-dom/client";
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { api } from './services/api'; 
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import authReducer from './services/authSlice'; // <-- 1. TAMBAHKAN IMPORT INI


console.log("Aplikasi Konfigurasi: Membuat Redux store."); // <-- PENANDA 2
const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
        auth: authReducer, // <-- 2. TAMBAHKAN REDUCER BARU DI SINI

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

const container = document.getElementById("root");
const root = createRoot(container);

console.log("Aplikasi Render: Menjalankan root.render()."); // <-- PENANDA 3
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);