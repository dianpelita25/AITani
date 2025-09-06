// src/index.jsx

import React from "react";
import { createRoot } from "react-dom/client";
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { api } from './services/api'; // <-- IMPORT API KITA
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

// Buat Redux store
const store = configureStore({
  reducer: {
    // Tambahkan reducer dari API kita
    [api.reducerPath]: api.reducer,
  },
  // Tambahkan middleware API untuk mengelola caching, invalidation, dll.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});


const container = document.getElementById("root");
const root = createRoot(container);

// Bungkus <App /> dengan <Provider>
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);