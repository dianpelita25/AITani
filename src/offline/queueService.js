// src/offline/queueService.js

import { dbPromise } from './db';

export async function enqueueRequest(request) {
  const db = await dbPromise;
  await db.add('request-queue', request);
  console.log('Permintaan ditambahkan ke antrean offline:', request);
}

export async function getQueuedRequests() {
  const db = await dbPromise;
  return await db.getAll('request-queue');
}

export async function clearRequest(id) {
  const db = await dbPromise;
  await db.delete('request-queue', id);
  console.log('Permintaan berhasil dikirim dan dihapus dari antrean:', id);
}

// --- TAMBAHKAN FUNGSI BARU INI ---
/**
 * Mencoba mengirim ulang semua permintaan yang ada di antrean.
 * @param {function} apiClient - Fungsi yang akan menjalankan mutasi RTK Query.
 */
export async function retryQueue(apiClient) {
  const db = await dbPromise;
  const requests = await db.getAll('request-queue');
  
  if (requests.length === 0) {
    console.log('Antrean kosong, tidak ada yang perlu disinkronkan.');
    return;
  }
  
  console.log(`Mencoba sinkronisasi ${requests.length} permintaan...`);

  for (const req of requests) {
    try {
      // Panggil fungsi API yang sebenarnya (misal: createAlert)
      await apiClient(req);
      // Jika berhasil, hapus dari antrean
      await clearRequest(req.id);
    } catch (err) {
      console.error('Gagal sinkronisasi permintaan, akan tetap di antrean:', req, err);
      // Jika gagal lagi, biarkan saja di antrean untuk dicoba lain waktu
    }
  }
}