# Project Structure Overview

Ringkasan struktur repositori `ai_tani_kupang Tallwind - Copy` supaya bisa dipakai sebagai konteks AI maupun dokumentasi internal.

```
.
|- ai-tani-kupang-api/          # Cloudflare Worker backend (Hono + D1/R2/KV)
|  |- fixtures/
|  |  `- alerts.fixture.json
|  |- migrations/               # File SQL (0007 … 0008 + 001–006)
|  |- src/
|  |  |- index.js               # Entry Worker (routing + cron)
|  |  `- routes/                # alerts, auth, dev, diagnosis, farm-tasks, health, photos, utils, weather
|  |     `- __tests__/          # dev.seed.worker.test.js, health.worker.test.js, photos.worker.test.js
|  |- tmp/                      # Artefak wrangler dev
|  |- .dev.vars                 # Env lokal Worker
|  |- local_schema.sql / remote_schema.sql
|  |- package.json / pnpm-lock.yaml / package-lock.json
|  `- wrangler.toml             # Binding DB/R2/KV + cron
|
|- docs/
|  |- demo-assets/Daun_Jagung.png
|  |- testing.md
|  `- WOW-RUNBOOK.md
|
|- public/
|  |- assets/images/            # Asset statis umum
|  |- model/                    # Distribusi model TensorFlow.js
|  |  |- old_model/ + old_model.1/
+|  |  |- ai_tani_corn_disease.tflite
|  |  |- group1-shard1of1.bin
|  |  |- group1-shard1of2.bin
|  |  |- group1-shard2of2.bin
|  |  |- model.json
|  |  `- README.txt
|  |- favicon.ico
|  |- manifest.json
|  `- robots.txt
|
|- scripts/
|  |- debug-tf.mjs              # Validasi/patch TF.js model
|  |- patch-model.mjs
|  `- simulate.mjs
|
|- src/
|  |- ai/
|  |  |- aiTaniTflite.ts        # (legacy placeholder)
|  |  |- localDiagnosis.js      # Loader TF.js di browser
|  |  |- modelWeights.js        # Dump bobot pengganti (fallback)
|  |  `- __tests__/modelArtifacts.test.js
|  |- components/
|  |  |- layout/                # DesktopTopNav, dsb.
|  |  |- ui/                    # Button, LoadingOverlay, dsb.
|  |  |- AppIcon.jsx
|  |  |- AppImage.jsx
|  |  |- ErrorBoundary.jsx
|  |  `- ScrollToTop.jsx
|  |- offline/
|  |  |- db.js                  # IndexedDB schema
|  |  |- queueService.js        # Antrean offline + sinkronisasi
|  |  `- replayClient.js        # Client untuk replay request
|  |- pages/
|  |  |- community-alerts/
|  |  |  `- components/ + __tests__/
|  |  |- diagnosis-history/
|  |  |  `- components/
|  |  |- diagnosis-results/
|  |  |  `- components/
|  |  |- farming-calendar/
|  |  |  `- components/
|  |  |- forgot-password/
|  |  |- home-dashboard/
|  |  |  `- components/
|  |  |- login/
|  |  |- photo-diagnosis/
|  |  |  `- components/
|  |  |- register/
|  |  |- reset-password/
|  |  `- NotFound.jsx
|  |- services/
|  |  |- alertsApi.js
|  |  |- api.js
|  |  |- authApi.js
|  |  |- authSlice.js
|  |  |- diagnosisApi.js
|  |  |- farmTasksApi.js
|  |  |- weatherApi.js
|  |  `- __tests__/api.test.jsx
|  |- styles/
|  |  |- index.css
|  |  `- tailwind.css
|  |- utils/
|  |  |- cn.js
|  |  |- normalizePhotoUrl.js
|  |  `- __tests__/
|  |- App.jsx
|  |- index.jsx
|  |- Routes.jsx
|  `- setupTests.js
|
|- scripts/config lainnya: vite.config.mjs, tailwind.config.js, postcss.config.js, jsconfig.json
-  Root files: .env, .env.txt, README.md, README.md.txt, KONTEKS_WEB*.txt, struktur_proyek.txt, ambil-kode-web.mjs, buat-struktur.mjs, temp_model.json, dll.
```

Gunakan file ini sebagai referensi struktur siap pakai untuk model AI atau dokumentasi otomatis lainnya.
