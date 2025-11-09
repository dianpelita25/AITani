# WOW RUNBOOK – AiTani Prototype (Ringkas)

## Target Upgrade
1. **AI Diagnosis On-Device**
   - Tambah prediksi penyakit tanaman dengan TensorFlow.js (fallback mock).
   - Integrasi ke layar “Buka Kamera” + overlay scan animasi.

2. **Weather Advice (BMKG Backbone)**
   - Endpoint `/weather/advice` (cache edge 5m, KV 3h).
   - Hook frontend + integrasi ke modal “Tambah Kegiatan” Kalender (tooltip saran otomatis).

3. **Community Map**
   - Komponen peta (Leaflet) + marker laporan + overlay hujan sederhana.
   - Integrasi ke halaman Komunitas di atas daftar alert.

4. **Scheduled Notification**
   - Cron Worker panggil weather advice tiap siang.
   - Simpan rekomendasi di KV untuk notifikasi proaktif (demo key `notif:demo`).

5. **UX Polish**
   - Tambah tab “Riwayat” di BottomNavigation.
   - Kompres foto sebelum antre/upload (canvas.toBlob quality 0.8).

## Build & Test Flow
- Jalankan `pnpm typecheck`, `pnpm build` di setiap fase.
- Final demo:
  1. Diagnosis foto → overlay scan → hasil AI.
  2. Kalender tambah kegiatan → tooltip cuaca.
  3. Komunitas → peta & marker.
  4. Cron (cloud) → notif tersimpan.
