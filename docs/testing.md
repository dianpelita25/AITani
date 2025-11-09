# Automated Testing Guide

## Available commands

- `npm test` &mdash; runs the entire Vitest suite once with v8 coverage output (text summary + HTML report in `coverage/`).
- `npm run test:watch` &mdash; keeps Vitest in watch mode for rapid feedback during development.
- `npm run test:ui` &mdash; opens the Vitest UI runner, useful for debugging flaky specs.

## What gets covered

- Frontend: utility helpers such as `src/utils/normalizePhotoUrl.js` plus the high-impact UI pieces in `src/pages/community-alerts/components` (card + modal flows).
- Backend: Cloudflare Worker routes under `ai-tani-kupang-api/src/routes` (`photos` streaming proxy + `health` probe).

The coverage configuration (see `vite.config.mjs`) collects metrics for both the React app (`src/**`) and the Worker code (`ai-tani-kupang-api/src/**`).

## Known warnings

`@testing-library/react@11.x` is still required elsewhere in the app, so Vitest logs React 18 deprecation warnings (`ReactDOM.render` / `act`). They do not indicate failing behaviour, but upgrading the library would silence them if/when the dependency can be bumped.
