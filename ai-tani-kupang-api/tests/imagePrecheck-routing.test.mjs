// ai-tani-kupang-api/tests/imagePrecheck-routing.test.mjs

import assert from 'assert';
import { shouldSkipOnlineDiagnosis } from '../src/routes/diagnosis.js';

// Case 1: foto bagus → tidak skip
(() => {
  const precheck = {
    is_plant: true,
    is_blurry: false,
    quality_score: 0.8,
    status: 'ok',
  };
  assert.strictEqual(shouldSkipOnlineDiagnosis(precheck), false, 'good photo should NOT skip');
})();

// Case 2: bukan tanaman → skip
(() => {
  const precheck = {
    is_plant: false,
    is_blurry: false,
    quality_score: 0.9,
    status: 'ok',
  };
  assert.strictEqual(shouldSkipOnlineDiagnosis(precheck), true, 'non-plant should skip');
})();

// Case 3: quality sangat rendah → skip
(() => {
  const precheck = {
    is_plant: true,
    is_blurry: true,
    quality_score: 0.1,
    status: 'retry',
  };
  assert.strictEqual(shouldSkipOnlineDiagnosis(precheck), true, 'very low quality should skip');
})();

// Case 4: status reject → skip
(() => {
  const precheck = {
    is_plant: true,
    is_blurry: true,
    quality_score: 0.5,
    status: 'reject',
  };
  assert.strictEqual(shouldSkipOnlineDiagnosis(precheck), true, 'status reject should skip');
})();

console.log('imagePrecheck-routing tests passed');
