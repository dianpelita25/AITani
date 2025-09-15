# Ai Tani Kupang – React App

A modern React + Vite app with offline-aware reporting, Cloudflare Worker API, and clean UI powered by Tailwind.

## 🚀 Highlights

- **React 18 + Vite** – super fast DX & HMR  
- **Redux Toolkit + RTK Query** – state & data fetching
- **React Router v6** – routing
- **Tailwind CSS** – utility-first styling
- **Framer Motion** – subtle animations
- **React Hook Form** – lean forms
- **Recharts / (D3 where needed)** – charts
- **Jest + RTL** – testing setup
- **Offline queue** – create reports while offline, sync later
- **Cloudflare Workers** – API with **D1** (SQLite) & **R2** (object storage)
- **Image loading without CORS** – custom `<AppImage />` (no fetch/HEAD)

---

## 📋 Prerequisites

- Node.js ≥ 18 (disarankan)
- npm atau yarn
- Cloudflare Wrangler (`npm i -g wrangler`, optional untuk dev API)

---

## 🛠️ Install & Run (Dev)

### 1) Frontend (Vite)
```bash
npm install
npm run dev
# FE will serve at http://localhost:xxxx (lihat console)
```

### 2) API (Cloudflare Worker, local)
Di repo API kamu, jalankan:
```bash
# opsional bila ada migrasi
npx wrangler d1 migrations apply ai-tani-kupang-web --local

# jalankan worker + D1 + R2 lokal
npx wrangler dev
# default di http://127.0.0.1:8787
```

Aplikasi FE memanggil API pada origin Worker lokal (contoh: `http://127.0.0.1:8787/api/alerts`). Jika kamu memakai proxy Vite untuk `/api`, pastikan set di `vite.config.js`.

---

## 🔧 Konfigurasi yang Penting

### 1) Penanganan Gambar (tanpa CORS)
Kita pakai komponen ringan **`AppImage`** yang **tidak** melakukan `fetch()`/`HEAD` ke R2, jadi tidak memicu CORS. Fallback berjalan via `onError`.

**File**: `src/components/AppImage.jsx`  
**Fallback**: letakkan gambar fallback di `public/assets/images/no_image.png`.

### 2) Normalisasi URL Foto (hindari double-encode)
Beberapa nama file (mis. dengan spasi) bisa muncul sebagai `WhatsApp%2520Image...` (double-encoded).  
Di **`AlertDetailModal.jsx`** ada helper `normalizePhotoUrl()` yang:
- `decodeURIComponent()` **sekali** bila menemukan `%25`
- mengganti spasi literal menjadi `%20`

> Hasilnya: URL valid ke R2 (tidak 404), foto tampil di **card** & **detail modal**.

### 3) Mapper API → FE
Di **`src/services/alertsApi.js`**:
- `photo_url` dari API selalu dipetakan menjadi **`photoUrl`**
- field snake_case lain dipetakan ke camelCase
- `coordinates` diparse aman (string/obj)

RTK Query endpoint:
- `GET /api/alerts` → `useGetAlertsQuery`
- `POST /api/alerts` (multipart, mendukung replay offline via antrean)

### 4) Offline Queue
Jika submit gagal (offline), payload (termasuk foto sebagai **DataURL**) diantrikan di **`offline/queueService`** dan akan disinkron otomatis saat online.

---

## 📁 Project Structure (ringkas)

```
ai_tani_kupang Tallwind
├── .env.txt
├── KONTEKS_WEB.txt
├── README.md
├── README.md.txt
├── ai-tani-kupang-api
│   ├── .wrangler
│   │   ├── state
│   │   │   └── v3
│   │   │       ├── cache
│   │   │       │   └── miniflare-CacheObject
│   │   │       ├── d1
│   │   │       │   └── miniflare-D1DatabaseObject
│   │   │       │       └── 5ae9da099f6cfd381eabd0dd98dea07b3919d6ef80713ba9d8802efef8b9d036.sqlite
│   │   │       ├── r2
│   │   │       │   ├── aitaniweb-photos
│   │   │       │   │   └── blobs
│   │   │       │   │       ├── 145e90cb043214655da53ae60f9c3c2009de4b6be3a999bba7a27f84cb323fc1000001994137d690
│   │   │       │   │       ├── 17e15f4549191400f985a15033fff5060a3e0a9158b89bcbe3577ed28653b962000001993b890340
│   │   │       │   │       ├── 253d0cdf8758e01f6e554a0aba8b3db84c3e2e88baa9863caa81acbd91e623320000019941135d8f
│   │   │       │   │       ├── 276d78488906b8780221d127ec03380b3f85d0ddf71984b8764b4e54f46a9122000001993d2bdef6
│   │   │       │   │       ├── 2cab905cd4dbe0460feed4f34948ea1ec7622b5350f937ead18c80737b86180b000001993ce849c9
│   │   │       │   │       ├── 2f8339ab856fcf0492eaeb8c384a711d06a84cc5eaa9dcf85e54c489bd8e08b5000001994112fbe6
│   │   │       │   │       ├── 346334ec54382334f42d89a8bf4936d9c8bffb8ccc3c76b3494bb18b46a17704000001993c445ddd
│   │   │       │   │       ├── 4c511463f771697455501e31ea877679e92a5093f34e7e991bd14dee8606cb4e000001994109c8a8
│   │   │       │   │       ├── 4dd517d5067101f7b8c5456d2421002a6e823aac826a7ccbf031837427315971000001993d32ee9e
│   │   │       │   │       ├── 53b24ebdd1127dfdfefc42366cdc849f655b13ab7eb34316404c75e051a2e6d7000001993c46d22e
│   │   │       │   │       ├── 5f56014dbb5e8615e1d5187f3ba6bf7c9f0c240c71ca211e15ac53bd72f86b3f000001993c47f3f8
│   │   │       │   │       ├── 7f31aeee0a01ea2ea1dcb113eb50456be7044a2efbf95ccd17c37b9f8855938b0000019941489186
│   │   │       │   │       ├── 7fa5951b56477c85244f82055e414022f5ed79edacf46bf4ab567dca5136df1f000001993d0119d2
│   │   │       │   │       ├── 9e682555d64f8b0134e00a509eefe12dbde07847b668b998769d00b54ba39609000001993ccf6672
│   │   │       │   │       ├── a250c881bec64b10d3e9d2a532f01afe488974d5268fdac3c940fa51e375e93b000001994113f0c0
│   │   │       │   │       ├── a36d44fe74f8355f466a3b592d40e4266fefd6cbb1f91ccb68d9eb175e1e27d60000019940b772f5
│   │   │       │   │       ├── ac4e9c3eb382058d1ec7de4caa1c8f5dc7b27c10e2e6a224f39eecf281bd5029000001993b67f052
│   │   │       │   │       ├── bcfd32ade40220407d8de3b167dd369a9d505f6fe7e95eb68de7e0dd2eeb3e7c0000019940fee848
│   │   │       │   │       ├── ce356431fc5033347f0b87b0f880a58a183bec82a94141e65a27f1d4eee2da010000019937b79fba
│   │   │       │   │       ├── e5a16bb6a1c5e4c352b102fa6c4a319587ffb00d1e3bd963430eabaacb632be0000001993969131b
│   │   │       │   │       ├── e969717f15c765e981c928d7907c51c53e9023a29e71b5643fa1f48e98d425c30000019941111e42
│   │   │       │   │       ├── fe137531195cffad3400a28343216561be8aad29c721a99e57f2e76d0660bda3000001993d3f689e
│   │   │       │   │       └── ff95c365c0ae996938de2aa8ad5384fbe7a030460d5cefde6abe4c85fd3bceb1000001993b117a86
│   │   │       │   └── miniflare-R2BucketObject
│   │   │       │       └── 9720582e742b2d0573c56af6f4fb8eaeeff0b0843e2eaa987d9e5501564a6d80.sqlite
│   │   │       └── workflows
│   │   └── tmp
│   │       ├── bundle-CeSID1
│   │       │   ├── checked-fetch.js
│   │       │   ├── middleware-insertion-facade.js
│   │       │   └── middleware-loader.entry.ts
│   │       ├── bundle-JKtFaP
│   │       │   ├── checked-fetch.js
│   │       │   ├── middleware-insertion-facade.js
│   │       │   └── middleware-loader.entry.ts
│   │       ├── bundle-R5PBgf
│   │       │   ├── checked-fetch.js
│   │       │   ├── middleware-insertion-facade.js
│   │       │   └── middleware-loader.entry.ts
│   │       ├── bundle-rJpwiW
│   │       │   ├── checked-fetch.js
│   │       │   ├── middleware-insertion-facade.js
│   │       │   └── middleware-loader.entry.ts
│   │       ├── bundle-uI5BaS
│   │       │   ├── checked-fetch.js
│   │       │   ├── middleware-insertion-facade.js
│   │       │   └── middleware-loader.entry.ts
│   │       ├── dev-7CmjSa
│   │       │   ├── index.js
│   │       │   └── index.js.map
│   │       ├── dev-8dZu5J
│   │       │   ├── index.js
│   │       │   └── index.js.map
│   │       ├── dev-Kwsqpq
│   │       │   ├── index.js
│   │       │   └── index.js.map
│   │       └── dev-byeFH4
│   │           ├── index.js
│   │           └── index.js.map
│   ├── local_schema.sql
│   ├── migrations
│   │   ├── 001_schema.sql
│   │   ├── 002_align_with_remote.sql
│   │   ├── 003_add_photo_url.sql
│   │   ├── 004_add_alert_extra_fields.sql
│   │   ├── 005_refresh_alerts_view.sql
│   │   └── 006_add_photo_key.sql
│   ├── node_modules
│   │   ├── .cache
│   │   │   └── wrangler
│   │   │       └── wrangler-account.json
│   │   ├── .mf
│   │   │   └── cf.json
│   │   └── .package-lock.json
│   ├── package.json
│   ├── remote_schema.sql
│   ├── src
│   │   └── index.js
│   ├── tmp
│   │   └── out.txt
│   └── wrangler.toml
├── ambil-kode-web.mjs
├── buat-struktur.mjs
├── index.html
├── jsconfig.json
├── package.json
├── postcss.config.js
├── public
│   ├── assets
│   │   └── images
│   ├── manifest.json
│   └── robots.txt
├── scripts
│   └── simulate.mjs
├── src
│   ├── App.jsx
│   ├── Routes.jsx
│   ├── components
│   │   ├── AppIcon.jsx
│   │   ├── AppImage.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ScrollToTop.jsx
│   │   ├── layout
│   │   │   ├── DesktopTopNav.jsx
│   │   │   └── MobileLayout.jsx
│   │   └── ui
│   │       ├── BottomNavigation.jsx
│   │       ├── Button.jsx
│   │       ├── Checkbox.jsx
│   │       ├── Input.jsx
│   │       ├── LoadingOverlay.jsx
│   │       ├── OfflineStatusBanner.jsx
│   │       ├── Select.jsx
│   │       └── ShareActionSheet.jsx
│   ├── index.jsx
│   ├── offline
│   │   ├── db.js
│   │   ├── queueService.js
│   │   └── replayClient.js
│   ├── pages
│   │   ├── NotFound.jsx
│   │   ├── community-alerts
│   │   │   ├── components
│   │   │   │   ├── AlertCard.jsx
│   │   │   │   ├── AlertDetailModal.jsx
│   │   │   │   ├── AlertFilters.jsx
│   │   │   │   └── ReportPestModal.jsx
│   │   │   └── index.jsx
│   │   ├── diagnosis-history
│   │   │   ├── components
│   │   │   │   └── HistoryCard.jsx
│   │   │   └── index.jsx
│   │   ├── diagnosis-results
│   │   │   ├── components
│   │   │   │   ├── ActionButtons.jsx
│   │   │   │   ├── CropImageDisplay.jsx
│   │   │   │   ├── DiagnosisCard.jsx
│   │   │   │   ├── DiagnosisHeader.jsx
│   │   │   │   ├── EnvironmentalFactors.jsx
│   │   │   │   ├── OfflineIndicator.jsx
│   │   │   │   └── RecommendationCard.jsx
│   │   │   └── index.jsx
│   │   ├── farming-calendar
│   │   │   ├── components
│   │   │   │   ├── AddEventModal.jsx
│   │   │   │   ├── CalendarGrid.jsx
│   │   │   │   ├── CalendarHeader.jsx
│   │   │   │   ├── EventDetailsPanel.jsx
│   │   │   │   ├── EventFilterBar.jsx
│   │   │   │   └── MobileCalendarView.jsx
│   │   │   └── index.jsx
│   │   ├── home-dashboard
│   │   │   ├── components
│   │   │   │   ├── CommunityAlertSnippet.jsx
│   │   │   │   ├── NavigationCard.jsx
│   │   │   │   ├── QuickActions.jsx
│   │   │   │   └── WelcomeHeader.jsx
│   │   │   └── index.jsx
│   │   └── photo-diagnosis
│   │       ├── components
│   │       │   ├── CameraInterface.jsx
│   │       │   ├── DiagnosisForm.jsx
│   │       │   └── DiagnosisResults.jsx
│   │       └── index.jsx
│   ├── services
│   │   ├── alertsApi.js
│   │   ├── api.js
│   │   ├── diagnosisApi.js
│   │   └── eventsApi.js
│   ├── styles
│   │   ├── index.css
│   │   └── tailwind.css
│   └── utils
│       └── cn.js
├── struktur_proyek.txt
├── tailwind.config.js
└── vite.config.mjs



---

## 🧭 Routes

Gunakan `useRoutes` di `Routes.jsx` (atau file routing kamu) untuk menambah halaman baru.  
Halaman **Community Alerts** berada di `/community-alerts`.

---

## 🎨 Styling

- Tailwind CSS + plugins (forms, typography, aspect-ratio, container queries, fluid typography, anim utilities).
- Komponen UI sederhana di `components/ui/*`.
- Ikon via `AppIcon` (Lucide).

---

## 🧪 Testing

```bash
npm run test
```

---

## 📦 Build & Deploy

```bash
npm run build   # Vite builds to dist/
```

Untuk API: deploy Cloudflare Worker sesuai setup Wrangler (R2 & D1 binding sama seperti lokal).

---

## 🛟 Troubleshooting

- **Foto tidak muncul / placeholder saja**
  - Cek `src` pada `<img>` di DevTools. Jika terlihat `...%2520...`, berarti **double-encoded**.  
    Pastikan `AlertDetailModal.jsx` memakai `normalizePhotoUrl()` dan **jangan** `encodeURI/encodeURIComponent` lagi pada URL yang sudah lengkap.
  - Jika 404, `AppImage` otomatis jatuh ke `/assets/images/no_image.png`.

- **Banyak error CORS gambar**
  - Dengan `AppImage` (tanpa `fetch/HEAD` & tanpa `crossOrigin`), **tidak** akan ada error CORS saat menampilkan gambar dari R2.  
    CORS hanya masalah saat *membaca pixel canvas*—kita tidak melakukan itu.

- **Console ada `net::ERR_BLOCKED_BY_CLIENT`**
  - Itu dari request uji CSP Google Maps (`gen_204`) yang diblokir extension/ad-block. Aman diabaikan.

- **Order of hooks / “Rendered more hooks than during previous render”**
  - Jangan `return null` di awal render **setelah** memanggil hooks yang jumlahnya berbeda tergantung kondisi.  
    Di modal kita, komponen selalu render; visibilitas dikontrol dengan kelas (`opacity / pointer-events`).

---

## 🙏 Credits

- Built by **PT. AiTi Global Nexus**
- Powered by **React + Vite**
- Backend: **Cloudflare Workers (D1 + R2)**
- Styled with **Tailwind CSS**

