// Fokus: urus TF.js (load model + jalankan prediksi)
// Tidak tahu apa-apa soal nama penyakit, teks, dsb.

import * as tfBase from '@tensorflow/tfjs';
import { LOCAL_MODEL_CONFIG } from './localModelConfig';

let modelPromise = null;
let tfInstance = null;

export function setTfInstance(tf) {
  tfInstance = tf;
  modelPromise = null; // reset supaya load ulang dengan instance baru
}

function getTf() {
  return tfInstance || tfBase;
}

export function loadLocalModel() {
  const tf = getTf();
  if (!modelPromise) {
    modelPromise = tf.loadLayersModel(LOCAL_MODEL_CONFIG.modelUrl);
  }
  return modelPromise;
}

/**
 * inputTensor: Tensor4D [1, H, W, 3] atau [H, W, 3] yang nanti akan di-expand.
 * return: array [{ index, score }]
 */
export async function runLocalModel(inputTensor) {
  const tf = getTf();
  const model = await loadLocalModel();

  const batched = inputTensor.rank === 3
    ? inputTensor.expandDims(0)
    : inputTensor;

  const logits = model.predict(batched);
  const probs = await logits.data();
  logits.dispose();

  const results = Array.from(probs).map((score, index) => ({ index, score }));
  results.sort((a, b) => b.score - a.score);

  return results
    .filter(r => r.score >= LOCAL_MODEL_CONFIG.scoreThreshold)
    .slice(0, LOCAL_MODEL_CONFIG.topK);
}
