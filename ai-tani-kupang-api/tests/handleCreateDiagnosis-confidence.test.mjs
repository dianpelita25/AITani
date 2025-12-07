// ai-tani-kupang-api/tests/handleCreateDiagnosis-confidence.test.mjs

import assert from 'assert';
import { normalizeConfidence, applyNormalizedConfidence } from '../src/routes/diagnosis.js';

// Test 1: normalizeConfidence converts 0.9 to 90
(() => {
  const score = normalizeConfidence(0.9);
  assert.strictEqual(score, 90, '0.9 should normalize to 90');
})();

(() => {
  const score = normalizeConfidence(1);
  assert.strictEqual(score, 100, '1 should normalize to 100');
})();

// Test 2: applyNormalizedConfidence syncs diagnosis and rawResponse
(() => {
  const onlineResult = {
    rawResponse: {
      confidence_explanation: { confidence_score: 0.9, reasoning: 'test' },
      diagnosis: { confidence: 0.9 },
    },
    diagnosis: { confidence: 0.9 },
  };
  const diagnosis = { confidence: 0.9 };

  const score = applyNormalizedConfidence(onlineResult, diagnosis);

  assert.strictEqual(score, 90, 'applyNormalizedConfidence should return 90');
  assert.strictEqual(diagnosis.confidence, 90, 'diagnosis confidence should be 90');
  assert.strictEqual(
    onlineResult.rawResponse.confidence_explanation.confidence_score,
    90,
    'rawResponse confidence_explanation should be 90',
  );
  assert.strictEqual(onlineResult.diagnosis.confidence, 90, 'onlineResult diagnosis confidence should be 90');
})();

console.log('handleCreateDiagnosis-confidence tests passed');
