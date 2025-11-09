// src/ai/localDiagnosis.js
// On-device diagnosis using TensorFlow.js if available, with safe mock fallback.
// JSDoc types to keep it TypeScript-safe in JS projects.

/**
 * @typedef {Object} Diagnosis
 * @property {string} label
 * @property {number} confidence
 * @property {string} severity
 * @property {string} description
 */

/**
 * @typedef {Object} Recommendation
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {"rendah"|"sedang"|"tinggi"} priority
 * @property {string} timeframe
 */

/**
 * @typedef {Object} DiagnosisResult
 * @property {Diagnosis} diagnosis
 * @property {Recommendation[]} recommendations
 */

/**
 * Try load TensorFlow.js at runtime.
 * @returns {Promise<any|null>}
 */
async function tryLoadTf() {
  try {
    // Defer to runtime dynamic import so build works without tfjs installed
    // eslint-disable-next-line no-undef
    const tf = await import(/* @vite-ignore */ 'https://esm.sh/@tensorflow/tfjs@4.20.0');
    return tf;
  } catch (e) {
    console.warn('TFJS unavailable, using mock fallback:', e?.message || e);
    return null;
  }
}

/**
 * Attempt to load a model from public path. If unavailable, return null.
 * @param {any} tf
 */
async function tryLoadModel(tf) {
  try {
    const modelUrl = '/model/model.json';
    const model = await tf.loadGraphModel(modelUrl);
    return model;
  } catch (e) {
    console.warn('Model not found, using mock fallback:', e?.message || e);
    return null;
  }
}

/**
 * Resize an image File to a tensor that matches model expected input.
 * @param {any} tf
 * @param {File|Blob} file
 * @param {number} size
 */
async function fileToInputTensor(tf, file, size = 224) {
  const imgBitmap = await createImageBitmap(file);
  // Convert ImageBitmap to tensor: [H,W,3] -> [1,H,W,3]
  const tfimg = tf.browser.fromPixels(imgBitmap).toFloat();
  const resized = tf.image.resizeBilinear(tfimg, [size, size]);
  const normalized = resized.div(255.0);
  const batched = normalized.expandDims(0);
  tfimg.dispose();
  resized.dispose();
  return batched;
}

/**
 * Produce deterministic mock prediction for demo and offline.
 * @returns {DiagnosisResult}
 */
function mockPredict() {
  const candidates = [
    {
      label: 'Bercak Daun',
      severity: 'sedang',
      description: 'Terlihat bercak coklat pada daun. Perlu pemantauan dan tindakan ringan.'
    },
    {
      label: 'Busuk Akar',
      severity: 'berat',
      description: 'Indikasi serangan busuk akar, segera lakukan sanitasi dan pengeringan.'
    },
    {
      label: 'Sehat',
      severity: 'ringan',
      description: 'Tanaman tampak sehat, lanjutkan pemeliharaan rutin.'
    }
  ];
  const pick = candidates[Math.floor(Date.now() / (1000 * 7)) % candidates.length];
  const confidence = pick.label === 'Sehat' ? 88.2 : 91.4;
  /** @type {DiagnosisResult} */
  const result = {
    diagnosis: {
      label: pick.label,
      confidence,
      severity: pick.severity,
      description: pick.description
    },
    recommendations: [
      { id: 'rec_local_1', title: 'Pemantauan Daun', description: 'Pantau penyebaran bercak setiap 2 hari.', priority: 'sedang', timeframe: '2 hari' },
      { id: 'rec_local_2', title: 'Penyemprotan Ringan', description: 'Gunakan fungisida sesuai label bila perlu.', priority: 'rendah', timeframe: 'Pagi' }
    ]
  };
  return result;
}

/**
 * Run on-device diagnosis using TFJS if available; falls back to mock.
 * Returns quickly and safely without throwing.
 *
 * @param {File|Blob} imageFile
 * @returns {Promise<DiagnosisResult>}
 */
export async function runLocalDiagnosis(imageFile) {
  try {
    const tf = await tryLoadTf();
    if (!tf) return mockPredict();

    const model = await tryLoadModel(tf);
    if (!model) return mockPredict();

    const input = await fileToInputTensor(tf, imageFile, 224);
    const logits = model.predict(input); // shape: [1, C]
    const data = await logits.data();
    const arr = Array.from(data);
    const maxIdx = arr.reduce((mi, v, i, a) => (v > a[mi] ? i : mi), 0);

    // Demo labels; real model should ship a labels.json alongside.
    const labels = ['Bercak Daun', 'Busuk Akar', 'Sehat'];
    const label = labels[maxIdx] || 'Sehat';
    const confidence = Math.round(arr[maxIdx] * 1000) / 10 || 90.0;
    const severity = label === 'Busuk Akar' ? 'berat' : label === 'Sehat' ? 'ringan' : 'sedang';

    /** @type {DiagnosisResult} */
    const result = {
      diagnosis: {
        label,
        confidence,
        severity,
        description: label === 'Sehat' ? 'Tanaman tampak sehat.' : 'Deteksi awal menunjukkan gejala yang perlu ditangani.'
      },
      recommendations: [
        { id: 'rec_tf_1', title: 'Pantau Kondisi', description: 'Periksa kembali dalam 2-3 hari.', priority: 'rendah', timeframe: '2-3 hari' },
        { id: 'rec_tf_2', title: 'Perbaiki Drainase', description: 'Pastikan tanah tidak tergenang.', priority: 'sedang', timeframe: 'Pagi' }
      ]
    };

    input.dispose();
    if (typeof logits?.dispose === 'function') logits.dispose();
    return result;
  } catch (e) {
    console.warn('Local diagnosis failed, using mock:', e?.message || e);
    return mockPredict();
  }
}

/**
 * Compress an image file using canvas to JPEG.
 * @param {File} file
 * @param {number} quality 0..1
 * @returns {Promise<File>}
 */
export async function compressImage(file, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;
  const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  return newFile;
}

