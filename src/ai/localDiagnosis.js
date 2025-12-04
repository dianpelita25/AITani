// src/ai/localDiagnosis.js
// Memuat TensorFlow.js secara dinamis dan menjalankan diagnosis lokal berbasis model TF.js.
import modelUrl from '/model/model.json?url';

// sekarang pakai file lokal di /public/libs/tf.min.js
const TFJS_CDN_URL = '/libs/tf.min.js';

let tfInstance = null;
let tfLoadPromise = null;
let modelInstance = null;
let augRegistered = false;

function ensureAugmentationStubs(tf) {
  if (augRegistered) return;
  const { serialization, layers } = tf;
  if (!serialization || !layers) return;

  class NoOpRandomFlip extends layers.Layer {
    static className = 'RandomFlip';
    constructor(config) {
      super(config || {});
    }
    call(inputs) {
      return Array.isArray(inputs) ? inputs[0] : inputs;
    }
    getConfig() {
      return { ...super.getConfig() };
    }
  }

  class NoOpRandomRotation extends layers.Layer {
    static className = 'RandomRotation';
    constructor(config) {
      super(config || {});
    }
    call(inputs) {
      return Array.isArray(inputs) ? inputs[0] : inputs;
    }
    getConfig() {
      return { ...super.getConfig() };
    }
  }

  serialization.registerClass(NoOpRandomFlip);
  serialization.registerClass(NoOpRandomRotation);
  augRegistered = true;
}

async function injectTfScript() {
  if (tfInstance) return tfInstance;

  if (typeof window === 'undefined') {
    throw new Error('TF.js hanya bisa dimuat di lingkungan browser.');
  }
// ✅ Kalau TF sudah ada (misal dari load sebelumnya), pakai itu saja
  if (window.tf && typeof window.tf.setBackend === 'function') {
    tfInstance = window.tf;
    await tfInstance.setBackend('webgl');
    await tfInstance.ready();
    ensureAugmentationStubs(tfInstance);
    console.log('TF.js reuse instance, backend:', tfInstance.getBackend());
    return tfInstance;
  }

  if (tfLoadPromise) return tfLoadPromise;

  tfLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('tfjs-script');
    if (existing) {
      existing.addEventListener(
        'load',
        () => {
          if (window.tf) {
            tfInstance = window.tf;
            resolve(tfInstance);
          } else {
            reject(new Error('window.tf tidak ditemukan setelah skrip dimuat.'));
          }
        },
        { once: true }
      );
      existing.addEventListener(
        'error',
        () => reject(new Error('Gagal memuat skrip TF.js (existing).')),
        { once: true }
      );
      return;
    }

    console.log('Menginjeksikan skrip TensorFlow.js dari CDN @4.22.0...');
    const script = document.createElement('script');
    script.id = 'tfjs-script';
    script.src = TFJS_CDN_URL;
    script.async = true;
    script.onload = async () => {
      tfInstance = window.tf;
      if (!tfInstance || typeof tfInstance.setBackend !== 'function') {
        reject(new Error('window.tf tidak valid setelah skrip dimuat.'));
        return;
      }
      try {
        await tfInstance.setBackend('webgl');
        await tfInstance.ready();
        ensureAugmentationStubs(tfInstance);
        console.log('TF.js backend siap: webgl versi:', tfInstance.version?.tfjs);
        resolve(tfInstance);
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('Gagal memuat skrip TF.js dari CDN.'));
    document.head.appendChild(script);
  });

  return tfLoadPromise;
}

async function tryLoadTf() {
  try {
    return await injectTfScript();
  } catch (err) {
    console.warn('TFJS unavailable, using mock fallback:', err?.message || err);
    return null;
  }
}

async function tryLoadModel(tf) {
  if (modelInstance) return modelInstance;

  ensureAugmentationStubs(tf);

  const TIMEOUT_MS = 8000; // 8 detik

  const loadPromise = (async () => {
    console.log(`Mencoba memuat model (layers) dari: ${modelUrl}`);
    const model = await tf.loadLayersModel(modelUrl, {
      fetchFunc: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
    });
    console.log('Model berhasil dimuat dari /model/model.json.');
    modelInstance = model;
    return modelInstance;
  })();

  try {
    const model = await Promise.race([
      loadPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loadLayersModel > 8s')), TIMEOUT_MS)
      ),
    ]);
    return model;
  } catch (err) {
    console.warn(
      'Model not found / failed / TIMEOUT, using mock fallback:',
      err?.message || err
    );
    return null;
  }
}


async function fileToInputTensor(tf, file, size = 224) {
  const bitmap = await createImageBitmap(file);
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(bitmap).toFloat();
    const normalized = tensor.div(255);
    const resized = tf.image.resizeBilinear(normalized, [size, size]);
    return resized.expandDims(0);
  });
}

function mockPredict() {
  console.log('Fallback: Menjalankan mockPredict().');
  return {
    diagnosis: {
      label: 'Bercak Daun (MOCK)',
      confidence: 75,
      severity: 'sedang',
      description: 'Model lokal gagal dimuat. Gunakan hasil server atau coba ulang.'
    },
    recommendations: [
      {
        id: 'rec_mock_1',
        title: 'Periksa koneksi & console',
        description: 'Lihat pesan error di console (F12) untuk detail mengapa model gagal dimuat.',
        priority: 'tinggi',
        timeframe: 'Segera'
      }
    ]
  };
}
export async function runLocalDiagnosis(imageFile) {
    console.log('[localDiagnosis] masuk runLocalDiagnosis, file =', imageFile);

  try {
    const tf = await tryLoadTf();
    if (!tf) return mockPredict();

    const model = await tryLoadModel(tf);
    if (!model) return mockPredict();

    console.log('Memproses gambar untuk input model...');
    const input = await fileToInputTensor(tf, imageFile, 128);

    console.log('Menjalankan prediksi (local TF.js model)...');
    const output = model.predict(input);
    const data = await output.data();

    const maxIndex = data.indexOf(Math.max(...data));
    const confidence = Math.round(data[maxIndex] * 100);

    // ⚠️ Sesuaikan dengan output model yang sekarang 3 kelas
    const classLabels = ['Blight', 'Common_Rust', 'Gray_Leaf_Spot'];
    const label = classLabels[maxIndex] || 'Unknown';

    // ➜ LOG DEBUG OUTPUT MENTAH & PILIHAN INDEX
    console.log('[localDiagnosis] raw output =', Array.from(data));
    console.log(
      '[localDiagnosis] picked index =',
      maxIndex,
      'label =',
      label,
      'confidence =',
      confidence
    );

    input.dispose();
    output.dispose();

    const severityMap = {
      Blight: 'berat',
      Common_Rust: 'sedang',
      Gray_Leaf_Spot: 'sedang'
    };
    const descriptionMap = {
      Blight: 'Terdeteksi Hawar Daun (Blight). Monitor penyebaran dan lakukan tindakan cepat.',
      Common_Rust: 'Terdeteksi Karat Biasa. Perhatikan bercak coklat/oranye pada daun.',
      Gray_Leaf_Spot: 'Terdeteksi Bercak Abu-abu. Biasanya moderat tapi perlu diawasi.'
    };

    const result = {
      diagnosis: {
        label,
        confidence,
        severity: severityMap[label] || 'tidak diketahui',
        description: descriptionMap[label] || 'Analisis AI selesai.'
      },
      recommendations: [
        {
          id: 'rec_tf_1',
          title: `Langkah untuk ${label}`,
          description: 'Ikuti panduan budidaya yang sesuai dan konsultasi jika gejala memburuk.',
          priority: 'sedang',
          timeframe: '2-3 hari'
        },
        {
          id: 'rec_tf_2',
          title: 'Pencegahan umum',
          description: 'Pertahankan sanitasi lahan, sirkulasi udara, dan nutrisi yang seimbang.',
          priority: 'rendah',
          timeframe: 'Berkelanjutan'
        }
      ]
    };

    // ➜ LOG HASIL FINAL YANG DIKIRIM KE UI
    console.log('[localDiagnosis] result yang dikembalikan =', result);

    return result;
  } catch (err) {
    console.error('Terjadi error saat diagnosis lokal, menggunakan mock:', err);
    return mockPredict();
  }
}

export async function warmupLocalTf() {
  console.log('[localDiagnosis] warmupLocalTf() dipanggil...');
  try {
    const tf = await tryLoadTf();
    if (!tf) {
      console.warn('[localDiagnosis] warmup: TF.js tidak tersedia (akan pakai mock kalau diagnosis).');
      return;
    }
    // Tidak usah load model di sini dulu biar startup tetap ringan.
    console.log('[localDiagnosis] warmup: TF.js berhasil dimuat & siap dipakai.');
  } catch (err) {
    console.warn('[localDiagnosis] warmup: gagal memuat TF.js lebih awal:', err);
  }
}

export async function compressImage(file, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return file;
  return new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '') + '.jpg',
    { type: 'image/jpeg' }
  );
}
