// src/ai/onlineDiagnosis.js
// Memanggil diagnosis online (rencana: Gemini API) via backend endpoint.

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const BASE_URL = `${RAW_BASE.replace(/\/+$/, '')}/api/diagnosis/online`;

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function runOnlineDiagnosis({ imageFile, imageDataUrl, meta = {} }) {
  const token = localStorage.getItem('sessionToken') || '';
  const payload = {
    image: imageDataUrl || (imageFile ? await fileToDataURL(imageFile) : ''),
    meta,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    console.log('[onlineDiagnosis] mengirim ke backend online...', { meta, hasToken: !!token, baseUrl: BASE_URL });
    const resp = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`Online diagnosis gagal: ${resp.status} ${detail}`);
    }

    const data = await resp.json();
    console.log('[onlineDiagnosis] respons backend online', data);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
