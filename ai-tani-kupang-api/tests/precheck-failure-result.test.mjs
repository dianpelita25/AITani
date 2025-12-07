// ai-tani-kupang-api/tests/precheck-failure-result.test.mjs

import assert from 'assert';
import { buildPrecheckFailureResult } from '../src/routes/diagnosis.js';

(() => {
  const precheck = {
    is_plant: false,
    is_blurry: true,
    quality_score: 0.1,
    status: 'reject',
    reason: 'Objek bukan tanaman.',
  };

  const { diagnosis, recommendations, onlineResult } = buildPrecheckFailureResult(precheck, {
    crop_type: 'Jagung',
  });

  assert.strictEqual(diagnosis.label, 'Foto Tidak Valid');
  assert.strictEqual(diagnosis.confidence, 0);
  assert.ok(Array.isArray(recommendations) && recommendations.length > 0, 'recommendations should exist');
  assert.strictEqual(onlineResult.source, 'online-precheck');
  assert.strictEqual(onlineResult.precheck.is_plant, false);
  assert.strictEqual(onlineResult.rawResponse.disease.name, 'Foto Tidak Valid');
  assert.strictEqual(
    onlineResult.rawResponse.confidence_explanation.confidence_score,
    0,
    'confidence score should be 0',
  );
})();

console.log('precheck-failure-result tests passed');
