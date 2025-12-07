// ai-tani-kupang-api/tests/imagePrecheck.test.mjs

import assert from 'assert';
import { parseImagePrecheckResponse } from '../src/routes/diagnosis.js';

// 1) JSON polos
(() => {
  const json = JSON.stringify({
    is_plant: false,
    is_blurry: true,
    quality_score: 0.2,
    status: 'reject',
    reason: 'Foto terlalu buram.',
    suggestions: ['Ambil ulang foto lebih dekat.'],
  });
  const result = parseImagePrecheckResponse(json);
  assert.strictEqual(result.is_plant, false);
  assert.strictEqual(result.is_blurry, true);
  assert.strictEqual(result.quality_score, 0.2);
  assert.strictEqual(result.status, 'reject');
  assert.ok(Array.isArray(result.suggestions));
  assert.ok(result.suggestions.length > 0);
})();

// 2) JSON di dalam ```json ``` + ada spasi
(() => {
  const text = '```json\\n{"is_plant": true, "is_blurry": false, "quality_score": 0.9}\\n```';
  const result = parseImagePrecheckResponse(text);
  assert.strictEqual(result.is_plant, true);
  assert.strictEqual(result.is_blurry, false);
  assert.strictEqual(result.quality_score, 0.9);
  assert.strictEqual(result.status, 'ok'); // default
})();

console.log('imagePrecheck tests passed');
