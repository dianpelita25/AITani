// src/offline/db.js

import { openDB } from 'idb';

// Fungsi ini akan membuka (atau membuat jika belum ada) database kita.
// Ini adalah praktik terbaik untuk memastikan koneksi hanya dibuat sekali.
async function setupDatabase() {
  const db = await openDB(
    'ai-tani-kupang-db', // Nama database Anda
    1,                  // Versi database. Ubah ini jika Anda mengubah struktur "tabel"
    {
    // Fungsi 'upgrade' hanya akan berjalan JIKA database belum ada, 
    // atau JIKA nomor versi di atas lebih tinggi dari yang sudah ada.
    upgrade(db) {
      // Cek apakah "tabel" (disebut objectStore di IndexedDB) sudah ada
      if (!db.objectStoreNames.contains('request-queue')) {
        // Jika belum, buat "tabel" baru bernama 'request-queue'.
        // 'keyPath: 'id'' berarti setiap entri akan punya ID unik.
        // 'autoIncrement: true' berarti ID akan dibuat secara otomatis.
        db.createObjectStore('request-queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
}

// Kita panggil fungsi setup dan ekspor hasilnya agar bisa digunakan di file lain.
// Variabel ini (dbPromise) akan berisi "koneksi" ke database kita.
export const dbPromise = setupDatabase();