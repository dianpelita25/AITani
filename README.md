# AI Tani Kupang

> Platform pendamping petani yang memadukan diagnosis hama berbasis AI, kalender tanam pintar, serta pelaporan komunitas dengan dukungan offline dan backend Cloudflare Worker.

## Status perkembangan (Q4 2025)

- ✅ Dashboard, Photo Diagnosis, Community Alerts, Farming Calendar, Riwayat Diagnosis, dan seluruh alur auth (login/register/reset) sudah jalan dengan RTK Query + Redux.
- ✅ Sinkronisasi offline → online berfungsi: antrean IndexedDB menyimpan alert/diagnosis/farm task lalu otomatis dieksekusi ketika token login valid kembali.
- ✅ Backend Cloudflare Worker telah memiliki route lengkap (alerts, diagnosis, farm-tasks, weather advice, auth, photos proxy, dev seeding) plus cron BMKG → KV.
- ✅ Model TensorFlow.js (layers) bisa dipanggil dari browser (`src/ai/localDiagnosis.js`) maupun diuji lewat Node (`scripts/debug-tf.mjs`).
- 🟡 Refactor AI lokal sedang berlangsung: modul baru (`src/ai/localModelConfig.js`, `localLabelConfig.js`, `localModelRunner.js`, `localDiagnosisEngine.js`, `diseaseCatalog.js`) sudah ada namun belum sepenuhnya dipakai UI.
- 🟡 Koleksi label penyakit (`DISEASE_LABELS`, `UI_TEMPLATES`) baru mencakup sedikit kelas contoh—perlu disesuaikan dengan output model final.
- 🟡 Infrastruktur TFLite Web API client tersedia (lihat `node_modules/@tensorflow/tfjs-tflite/...`) tetapi belum dipakai; saat ini tetap memakai TF.js standard.

## Fitur utama

- **Diagnosis foto hybrid** - proses foto daun melalui TensorFlow.js di browser (`src/ai/localDiagnosis.js`) lalu kirim ke API agar hasil server dan lokal saling melengkapi.
- **Perencanaan & riwayat** - halaman Kalender, Riwayat Diagnosis, dan Dashboard memanfaatkan RTK Query + IndexedDB agar tugas tetap tersimpan walau tanpa sinyal.
- **Komunitas & peta** - halaman Community Alerts menampilkan daftar + peta Leaflet, filter dinamis, serta modal pelaporan cepat dengan upload foto ke R2.
- **Offline-first** - antrean `src/offline/queueService.js` menyimpan aksi (alert, diagnosis, farm task) di IndexedDB kemudian disinkron otomatis via `BroadcastChannel`.
- **API Cloudflare Worker** - service `ai-tani-kupang-api/src/index.js` memakai Hono, D1 (SQL), R2 (foto), KV (cache), dan cron untuk saran cuaca BMKG.
- **Otomasi cuaca** - cron Worker mengambil prakiraan, menyimpannya di KV, dan menampilkan rekomendasi di Kalender.
- **Testing siap liputan** - Vitest + Testing Library mencakup utilitas, komponen krusial, serta Worker route (`docs/testing.md`).

## Ekspektasi & target berikutnya

- **Integrasi Engine AI baru**: ganti implementasi `runLocalDiagnosis` agar memanfaatkan modul modular (config/label/catalog) sehingga mapping UI mudah dirawat.
- **Lengkapi kamus penyakit**: sinkronkan `DISEASE_LABELS` dan `UI_TEMPLATES` dengan daftar kelas sebenarnya (ambil dari metadata training + `public/model/model.json`).
- **Optimalkan pipeline foto**: tambahkan kompresi sebelum antrean offline (sesuai runbook) dan dukungan preview hasil lokal + server bersamaan.
- **Telemetry & logging**: tambahkan instrumentation ringan (mis. event toast/log) agar debugging offline queue & TF.js lebih mudah ketika dibawa demo di lapangan.
- **Deploy Cloudflare Worker**: hubungkan binding produksi (DB/R2/KV) dan environment secret sehingga crew bisa melakukan UAT di URL publik.

## Arsitektur dalam 1 menit

- **Frontend**: React 18 + Vite + Tailwind. State global memakai Redux Toolkit + RTK Query (`src/services/*`). Rute utama ada di `src/Routes.jsx` (Dashboard, Photo Diagnosis, Community Alerts, Farming Calendar, Login/Reset, dsb).
- **AI lokal**: `src/ai/localDiagnosis.js` memuat TF.js 4.22.0 secara dinamis, menambal layer augmentasi (`RandomFlip/Rotation`), lalu membaca model `public/model/model.json`. `scripts/debug-tf.mjs` membantu validasi struktur model sebelum dibagikan.
- **Offline layer**: `src/offline/db.js` mendefinisikan IndexedDB, `queueService.js` mengatur antrean, `replayClient.js` menjadi adaptor REST ketika koneksi kembali normal.
- **Backend**: `ai-tani-kupang-api/` menjalankan Hono di Cloudflare Worker. `wrangler.toml` mendeskripsikan D1 (`DB`), R2 (`R2`), KV (`KV`), dan cron. Routes modular berada di `src/routes/*.js`.
- **Dokumentasi & skrip**: `docs/` berisi runbook + panduan testing, `scripts/` memuat utilitas debugging TF, sementara `docs/demo-assets/` menyediakan sampel foto untuk dev.

## Prasyarat

- Node.js 18+ dan `pnpm` 9 (lihat `packageManager` pada `package.json`).
- Cloudflare Wrangler 3.70+ untuk menjalankan Worker secara lokal (`npm i -g wrangler`).
- Akun Cloudflare dengan akses D1, R2, dan KV (untuk deployment). Mode `--local` cukup untuk dev.
- Opsional: akses geolokasi browser (untuk fitur Nearby) dan kamera (Photo Diagnosis).

## Setup cepat

1. **Salin variabel lingkungan frontend**
   ```bash
   cp .env.txt .env
   # set VITE_API_BASE_URL=http://127.0.0.1:8787 (atau origin Worker Anda)
   ```

2. **Install dependensi**
   ```bash
   pnpm install
   cd ai-tani-kupang-api && pnpm install
   ```

3. **Provision resource Cloudflare (lokal)**
   ```bash
   cd ai-tani-kupang-api
   npx wrangler d1 migrations apply ai-tani-kupang-web --local
   # Simpan file ke R2 lokal dengan flag --local nanti saat wrangler dev berjalan
   ```
   Pastikan `wrangler.toml` memiliki binding `DB`, `R2`, `KV`, `d1_databases`, dan `r2_buckets` seperti repo.

4. **Jalankan Worker API**
   ```bash
   cd ai-tani-kupang-api
   npx wrangler dev --local --persist-to ./tmp
   # default akan berjalan di http://127.0.0.1:8787
   ```

5. **Jalankan frontend Vite**
   ```bash
   pnpm dev
   # aplikasi tersedia di http://localhost:4028 (lihat log terminal)
   ```

6. **Seed data demo (opsional namun membantu)**
   ```bash
   curl -X POST http://127.0.0.1:8787/api/dev/seed-alerts
   npx wrangler r2 object put aitaniweb-photos/demo/Daun_Jagung.png \
     --file docs/demo-assets/Daun_Jagung.png --local
   ```
   Gunakan endpoint `/photos/:key` untuk memastikan foto diambil dari R2.

7. **Validasi model AI lokal (opsional)**
   ```bash
   node scripts/debug-tf.mjs
   ```
   Skrip ini memuat `public/model/*`, menormalkan `inbound_nodes`, kemudian menjalankan `tf.loadLayersModel` pada Node.js agar error terlihat lebih awal.

## Skrip pnpm yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Menjalankan Vite (`--host 0.0.0.0 --port 4028`). |
| `pnpm build` | Build produksi Vite + source map (`dist/`). |
| `pnpm serve` | Preview hasil build secara lokal. |
| `pnpm typecheck` | Pemeriksaan tipe ringan (JSDoc). |
| `pnpm test` | Menjalankan Vitest sekali + laporan cakupan v8 (`coverage/`). |
| `pnpm test:watch` | Vitest watch mode. |
| `pnpm test:ui` | Vitest UI runner. |
| `cd ai-tani-kupang-api && npx wrangler dev` | Menjalankan Worker API lokal dengan D1/R2/KV. |

## Struktur proyek

```
.
|- src/
|  |- ai/                # TensorFlow.js loader & bobot lokal
|  |- components/        # UI reusable + komponen layout
|  |- offline/           # IndexedDB, antrean, replay client
|  |- pages/             # Halaman utama (Dashboard, Photo Diagnosis, Alerts, dll)
|  `- services/          # RTK Query services (alerts, diagnosis, farm tasks, auth)
|- public/model/         # Model TF.js (model.json + *.bin)
|- scripts/debug-tf.mjs  # Utility cek konsistensi model
|- docs/                 # testing.md, WOW-RUNBOOK, demo assets
|- ai-tani-kupang-api/
|  |- migrations/        # Skema D1
|  |- src/routes/        # Handler Hono (alerts, auth, farm-tasks, dll)
|  `- wrangler.toml      # Binding DB/R2/KV + cron
`- pnpm-lock.yaml
```

## AI lokal & model TensorFlow.js

- `runLocalDiagnosis(imageFile)` akan:
  1. Memuat skrip TF.js 4.22.0 dari CDN jika belum tersedia.
  2. Registrasi layer dummy `RandomFlip/Rotation` supaya model Keras dapat diload walau augmentation tidak ada di browser.
  3. Mengambil `public/model/model.json` + weight manifest melalui `import modelUrl from '/model/model.json?url'` agar cache-busting otomatis.
  4. Mengubah foto menjadi tensor (resize 224x224, normalisasi), menjalankan `model.predict`, lalu memetakan label + rekomendasi.
- Bila TF.js gagal (timeout/unsupported), fungsi mengembalikan mock diagnosis sehingga UI tetap memberi feedback.
- Gunakan `scripts/debug-tf.mjs` setiap kali mengganti `public/model/*` atau `src/ai/modelWeights.js` untuk memastikan manifest valid.
- Untuk mengganti model: timpa isi `public/model/`, commit file besar via Git LFS bila diperlukan, lalu uji lewat `pnpm dev` dan skrip debug di atas.

### Modul AI baru (sedang dalam pengerjaan)

- `src/ai/localModelConfig.js` - konfigurasi tunggal untuk ukuran input, threshold, topK.
- `src/ai/localLabelConfig.js` - mapping index output → kode penyakit + template narasi.
- `src/ai/localModelRunner.js` - fokus memuat TF.js + menjalankan model, tidak tahu soal UI.
- `src/ai/localDiagnosisEngine.js` - menyusun hasil ramah petani (primary diagnosis + alternatif).
- `src/ai/diseaseCatalog.js` - kamus label → teks (confidence bucket, severity default).
- Status: modul-modul ini siap dipakai tetapi `src/ai/localDiagnosis.js` masih memakai versi lama; berikutnya perlu digabung agar UI cukup konsumsi satu bentuk data konsisten.

## Offline-first & sinkronisasi

- `src/offline/db.js` membuat IndexedDB bernama `aitani-web` dengan object store `request-queue` dan `events`. Data dipartisi berdasarkan tenant (`accountId:userId`) dari `localStorage`.
- `enqueueRequest` menyimpan permintaan (create alert/diagnosis/farm task) sebagai JSON, menyiarkan `queue-updated` lewat `BroadcastChannel`.
- `App.jsx` memantau status online dan hanya menjalankan `retryQueue` ketika koneksi **dan** sesi login tersedia (`selectIsAuthenticated`).
- `OfflineStatusBanner` + `NetworkStatusPill` memberi konteks pengguna jika ada data tertunda.
- `src/offline/replayClient.js` memastikan antrian memanggil endpoint sesuai base URL (`VITE_API_BASE_URL`) tanpa double slash.

## API Cloudflare Worker (ringkasan)

Semua endpoint berada di `ai-tani-kupang-api/src/routes`. Prefix `/api` otomatis disisipkan oleh Worker (`src/index.js`).

| Method & Path | Deskripsi | Catatan |
| --- | --- | --- |
| `GET /health` | Pemeriksaan kesehatan Worker + info commit. | Publik. |
| `POST /auth/register` | Membuat akun baru. | Publik (menulis ke D1). |
| `POST /auth/login` | Mengembalikan JWT (`Authorization: Bearer`). | Publik. |
| `POST /auth/forgot-password` | Menyimpan token reset dan mengirim email via Resend. | Butuh `RESEND_API_KEY`. |
| `POST /auth/reset-password` | Memvalidasi token reset lalu perbarui password. | Publik. |
| `GET /alerts` | Daftar alert komunitas. | Auth wajib. |
| `POST /alerts` | Membuat alert baru + upload foto ke R2. | Auth + batas ukuran `MAX_UPLOAD_MB`. |
| `DELETE /alerts/:id` | Menghapus alert milik user. | Auth. |
| `GET /farm-tasks` | Menarik tugas antara `from` dan `to`. | Auth; menyaring `account_id/user_id`. |
| `POST /farm-tasks` | Membuat tugas baru. | Auth; payload ID berasal dari FE (UUID). |
| `PATCH /farm-tasks/:id` | Pembaruan status (pending/completed). | Auth. |
| `DELETE /farm-tasks/:id` | Soft delete tugas. | Auth. |
| `GET /diagnosis` | Riwayat diagnosis tersimpan. | Auth. |
| `POST /diagnosis` | Menyimpan hasil diagnosis + metadata foto (ditautkan ke R2). | Auth. |
| `GET /photos/:key+` | Streaming foto dari R2 (tanpa CORS). | Auth. |
| `GET /weather/advice` | Membaca cache KV untuk rekomendasi cuaca terbaru. | Auth. |
| `POST /dev/seed-alerts` | Mengisi D1 memakai fixture `fixtures/alerts.fixture.json`. | Gunakan hanya di dev. |

Tambahan: cron Worker (lihat `wrangler.toml`) menjalankan `scheduled()` setiap pukul 12:00 WIB untuk menyegarkan cache weather ke KV key `notif:demo`.

## Variabel lingkungan & binding

### Frontend (`.env`)

| Kunci | Fungsi | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Origin Worker tanpa suffix `/api`. Dipakai RTK Query & offline replay. | `http://127.0.0.1:8787` |

### Worker (atur melalui `wrangler.toml` atau `wrangler secret put`)

| Kunci | Fungsi |
| --- | --- |
| `JWT_SECRET` | Kunci penandatanganan JWT login. |
| `ALLOWED_ORIGIN` | CSV origin yang boleh melakukan request (contoh `http://localhost:4028`). |
| `MAX_UPLOAD_MB` | Batas ukuran file upload saat membuat alert. |
| `ENV_NAME` | Label environment untuk log/health. |
| `PUBLIC_R2_BASE_URL` | Base URL R2 publik (untuk merakit link foto). |
| `R2_PUBLIC_BUCKET_PATH` | Nama bucket publik (fallback). |
| `R2_LOCAL_BASE` | Origin Miniflare R2 lokal (`http://127.0.0.1:8787/r2`). |
| `R2_BUCKET` | Nama bucket default saat membuat URL lokal. |
| `RESEND_API_KEY` | API key Resend untuk email reset password. |

### Cloudflare binding

Defined pada `wrangler.toml`:

- `DB`: Cloudflare D1 database `ai-tani-kupang-web`.
- `R2`: Bucket R2 `aitaniweb-photos` untuk foto diagnosis/alert.
- `KV`: Namespace KV untuk cache weather dan demo notification.

## Pengujian & kualitas kode

- Dokumentasi lengkap tersedia di `docs/testing.md`.
- `pnpm test` menjalankan Vitest untuk frontend + Worker (via jsdom + Miniflare) dan menghasilkan laporan HTML di `coverage/`.
- `src/services/__tests__/api.test.jsx` memastikan error 401 memicu logout otomatis dan membersihkan storage.
- Folder `ai-tani-kupang-api/src/routes/__tests__` mencakup health check, foto proxy, serta seeding Worker.
- Lighthouse / manual QA: fokus pada Photo Diagnosis, Kalender, Community Alerts, dan alur auth.

## Tips & troubleshooting

- **Foto tidak tampil / nama ter-encode dua kali** - gunakan helper `src/utils/normalizePhotoUrl.js` (sudah dipakai di `AlertDetailModal.jsx` dan `AlertCard.jsx`) untuk membersihkan `%2520`.
- **TF.js gagal dimuat di browser** - periksa console untuk log `TF.js backend siap`. Jika gagal, jalankan `node scripts/debug-tf.mjs` dan pastikan file `public/model/*` tidak dikompresi oleh CDN.
- **Antrean offline tidak tersinkron** - cek tab Application -> IndexedDB (`aitani-web`). Pastikan pengguna sudah login; sinkronisasi hanya berjalan ketika `selectIsAuthenticated` bernilai true.
- **R2 403/404** - verifikasi `PUBLIC_R2_BASE_URL`, `R2_BUCKET`, serta binding `R2` di `wrangler.toml`. Untuk lokal, jalankan Worker dengan `--persist-to` agar file tersimpan di `.wrangler/state/v3/r2`.
- **Email reset tidak terkirim** - pastikan `RESEND_API_KEY` terset dan domain sudah diverifikasi di Resend. Endpoint akan mengembalikan error detail bila gagal.

## Referensi internal

- `docs/WOW-RUNBOOK.md` - ringkasan roadmap fitur (AI on-device, cuaca BMKG, Community Map, Cron notif, UX polish).
- `docs/testing.md` - komando testing dan cakupan.
- `docs/demo-assets/` - kumpulan foto contoh untuk testing upload.
- `struktur_proyek.txt` dan `KONTEKS_WEB*.txt` - catatan eksplorasi awal developer sebelumnya.

## Saran tambahan & pekerjaan belum tuntas

- **Satukan pipeline AI lokal**: update `runLocalDiagnosis` agar memanfaatkan `localModelRunner` + `localDiagnosisEngine`. Saat ini ada dua pendekatan paralel sehingga mudah terjadi drift.
- **Isi penuh `DISEASE_LABELS`/`UI_TEMPLATES`**: mapping masih placeholder. Ambil daftar kelas final dari training notebook agar rekomendasi konsisten.
- **Tambah fallback TFLite**: saat TF.js gagal, opsional gunakan `@tensorflow/tfjs-tflite` (sudah tersedia di deps) untuk perangkat low-end.
- **Kompresi & encrypt antrean foto**: sesuai runbook, tambahkan `canvas.toBlob` sebelum `enqueueRequest` agar ukuran DataURL tidak meledak kalau offline lama.
- **Monitoring backend**: tambahkan endpoint `/health` ke dashboard + logging ke KV untuk cron agar mudah audit ketika pindah ke staging/production.
- **Dokumentasikan proses deploy**: README ini menjelaskan setup lokal; tambahkan panduan CI/CD (mis. `wrangler deploy`, binding secrets) supaya handover cepat.

Selamat membangun! Jika ada perubahan besar (misalnya model baru atau migrasi schema), dokumentasikan di README ini agar onboarding tim berikutnya tetap mulus.
