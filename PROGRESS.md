# Project Progress

Last updated: 2025-12-29

## Current state
- Diagnosis works with Gemini fallback and local fallback.
- Precheck separate call is disabled to save tokens; diagnosis prompt still includes precheck logic.
- Planner is on-demand (button in results). Default auto planner is disabled.
- Community report can be created directly from diagnosis with a confirm prompt; it also supports prefill in the community modal.
- Photos load via /api/photos with auth and token fetch in the frontend.
- Image upload is compressed on the client to reduce size and latency.
- Welcome header uses GPS and reverse geocode (BigDataCloud) for location text.
- Gemini JSON parsing is hardened to reduce fallback-to-mock when output has newlines or trailing commas.

## Active local config
- ai-tani-kupang-api/.dev.vars
  - GEMINI_MODEL=gemini-2.5-flash-lite
  - AI_PRECHECK_ENABLED=false
  - AI_PLANNER_ENABLED=false
  - GEMINI_DIAG_MAX_TOKENS=1100
  - GEMINI_PRECHECK_MAX_TOKENS=256
  - GEMINI_PLANNER_MAX_TOKENS=700
  - GEMINI_SHOP_MAX_TOKENS=600
- Frontend env (optional)
  - VITE_API_BASE_URL=http://127.0.0.1:8787
  - VITE_PHOTO_MAX_SIDE=1280
  - VITE_PHOTO_QUALITY=0.72

## Recent changes (key files)
- Community report from diagnosis (auto save or prefill)
  - src/pages/diagnosis-results/index.jsx
  - src/pages/diagnosis-results/components/ActionButtons.jsx
  - src/pages/photo-diagnosis/index.jsx
  - src/pages/diagnosis-history/index.jsx
  - ai-tani-kupang-api/src/routes/alerts.js
- Planner on-demand endpoint and UI
  - ai-tani-kupang-api/src/routes/diagnosis.js
  - ai-tani-kupang-api/src/index.js
  - src/services/diagnosisApi.js
  - src/pages/diagnosis-results/index.jsx
- Token and AI settings (flash-lite, output limits, precheck off)
  - ai-tani-kupang-api/.dev.vars
  - ai-tani-kupang-api/src/routes/diagnosis.js
- Photo handling and local R2 access
  - ai-tani-kupang-api/src/routes/utils.js
  - ai-tani-kupang-api/src/index.js
  - src/components/AppImage.jsx
  - src/utils/normalizePhotoUrl.js

## Known issues / notes
- Flash-lite can return invalid JSON. The parser is more robust now, but if output is truncated it can still fall back to mock.
- You may see 401 then 200 for /api/photos in logs. This is expected because the first <img> request has no token, then AppImage refetches with Authorization.
- Planner is off by default; users must click "Buat rencana tindakan".

## Next steps (options)
- Decide if diagnosis should switch to gemini-2.5-flash (more stable JSON) while keeping lite for planner/shop.
- If needed, re-enable precheck with a local (non-AI) precheck to keep cost low.
- Add tests for the planner on-demand flow and community auto-report flow.
- Consider a feature flag to auto-prompt community save after each diagnosis.

## How to continue
1) Backend
   - cd ai-tani-kupang-api
   - npx wrangler dev --local --persist-to ./tmp
2) Frontend
   - pnpm dev

