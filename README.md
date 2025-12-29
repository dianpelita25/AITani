# AI Tani Kupang

Platform pendamping petani: diagnosis foto hybrid (online + lokal), rencana tindakan lapang, antrean offline, serta asisten belanja obat & alat. Frontend React/Vite, backend Cloudflare Worker (D1/R2/KV), dengan alur yang aman untuk offline/online.

## Progress log
Lihat `PROGRESS.md` untuk ringkasan keadaan aplikasi saat ini, perubahan terakhir, konfigurasi aktif, dan next steps.

## Status ringkas (2026)
- Diagnosis hybrid: online-first (Gemini/custom endpoint) dengan fallback TF.js lokal + antrean offline.
- Precheck foto: bisa diaktifkan/nonaktifkan untuk hemat token (lihat `PROGRESS.md`).
- Planner lapang: saat ini on-demand (lihat `PROGRESS.md`).
- Asisten Toko: endpoint `/api/shop-assistant` + tombol "Hitung belanja obat & alat" (badge AI, offline-safe, toast non-blocking).
- Weather snapshot: Open-Meteo (fallback mock) otomatis dikirim ke AI & ditampilkan sebagai badge.
- Offline-first: antrean IndexedDB untuk diagnosis/farm tasks tetap berjalan, replay saat online.

## Arsitektur singkat
- **Frontend**: React 18 + Vite + Tailwind + Redux Toolkit + RTK Query. DiagnosisResults menampilkan precheck, planner, shop assistant, rekomendasi, dan toast.
- **AI lokal**: `src/ai/localDiagnosis.js` (TF.js 4.22) + modul modular (config/runner/catalog) siap integrasi penuh.
- **AI online**: `ai-tani-kupang-api/src/routes/diagnosis.js` menjalankan runImagePrecheck + runOnlineDiagnosis (custom/Gemini/mock) + normalizeConfidence + planner + shop assistant.
- **Offline layer**: IndexedDB + queue service; replay ketika online & auth tersedia.
- **Backend**: Cloudflare Worker (Hono) dengan D1 (diagnosis/farm tasks), R2 (foto), KV (cuaca/cache). Weather via Open-Meteo fallback mock.

## Endpoint penting (Worker)
- `POST /api/diagnosis` — simpan diagnosis (online-first + precheck + planner).
- `POST /api/diagnosis/online` — proxy AI (tidak menyimpan).
- `GET /api/diagnosis` — riwayat diagnosis.
- `POST /api/shop-assistant` — asisten belanja obat & alat.
- `GET /api/weather` — snapshot cuaca (Open-Meteo/mock).
- Endpoint auth/alerts/farm-tasks/photos/dev seed tetap tersedia (lihat `ai-tani-kupang-api/src/index.js`).

## Setup cepat
1) **Env frontend**
   ```bash
   cp .env.txt .env
   # set VITE_API_BASE_URL=http://127.0.0.1:8787
   ```
2) **Install**
   ```bash
   pnpm install
   cd ai-tani-kupang-api && pnpm install
   ```
3) **Migrasi D1 lokal**
   ```bash
   cd ai-tani-kupang-api
   npx wrangler d1 migrations apply ai-tani-kupang-web --local
   ```
4) **Jalankan Worker**
   ```bash
   cd ai-tani-kupang-api
   npx wrangler dev --local --persist-to ./tmp   # http://127.0.0.1:8787
   ```
5) **Jalankan frontend**
   ```bash
   pnpm dev   # http://localhost:4028 (proxy /api -> 127.0.0.1:8787)
   ```
6) **Optional seed** — lihat `ai-tani-kupang-api/src/routes/dev.js` dan `docs/demo-assets/`.

## Testing
- Vitest/RTL + Worker: `pnpm test`
- Playwright e2e: `pnpm test:e2e`

## Konfigurasi kunci
- **Frontend (.env)**: `VITE_API_BASE_URL` (default http://127.0.0.1:8787). Jangan simpan API key AI di Vite.
- **Worker secrets**: `GEMINI_API_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, binding D1/R2/KV (lihat `wrangler.toml`).
- Weather: gunakan Open-Meteo fallback; BMKG reserved for future.

## Struktur proyek (ringkas)
```
.
|- src/                       # React app (pages, components, services, ai, offline)
|- public/model/              # Model TF.js lokal
|- scripts/                   # Util (generate-readme, debug tf, dll)
|- docs/                      # runbook, testing, demo assets
|- ai-tani-kupang-api/        # Cloudflare Worker (routes, migrations, wrangler.toml)
|- tests/                     # Playwright e2e
```

## Fitur utama (detail)
- Precheck foto: kualitas & objek tanaman, tampil di UI.
- Diagnosis hybrid: normalize confidence 0–100, weather + affected_parts ke AI, mock fallback aman.
- Planner: fase tindakan, langkah bisa "Jadikan tugas" ke kalender (online/offline).
- Shop Assistant: hitung belanja + keyword e-commerce + maps query, badge AI, offline-safe.
- Toast UX: non-blocking dengan ikon standar (🌱 success, ℹ️ info/offline, ⚠️ error) + CTA "Lihat di kalender".
- Riwayat: sumber AI Online / AI Lokal, provider, model version terlihat di HistoryCard.

## Tips & keamanan
- Jalankan Vite dengan proxy bawaan (lihat `vite.config.mjs`) agar FE memanggil Worker lokal tanpa CORS.
- Simpan semua kunci AI di Worker secret; FE hanya kirim foto/meta.
- Jika diagnosis online/Gemini tidak tersedia, backend otomatis fallback (mock/offline) tanpa memblok UI.
