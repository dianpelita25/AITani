// src/ai/diseaseCatalog.js

// Kamus penyakit / kondisi yang dikenal AI
export const DISEASE_CATALOG = {
  Gray_Leaf_Spot: {
    id: 'Gray_Leaf_Spot',
    key: 'Gray_Leaf_Spot',
    title: 'Gray Leaf Spot',
    shortName: 'Gray_Leaf_Spot',
    displayName: 'Gray Leaf Spot',
    shortDescription:
      'Terdeteksi bercak abu-abu pada daun. Biasanya moderat tapi perlu diawasi.',
    defaultSeverity: 'moderate',
  },

  Healthy: {
    id: 'Healthy',
    key: 'Healthy',
    title: 'Tanaman Sehat',
    shortName: 'Healthy',
    displayName: 'Tanaman Sehat',
    shortDescription:
      'Tidak terlihat gejala penyakit yang jelas pada foto ini.',
    defaultSeverity: 'low',
  },

  Unknown: {
    id: 'Unknown',
    key: 'Unknown',
    title: 'Belum Dikenali',
    shortName: 'Unknown',
    displayName: 'Belum Dikenali',
    shortDescription:
      'AI belum yakin jenis penyakitnya. Periksa kembali atau konsultasi penyuluh.',
    defaultSeverity: 'unknown',
  },
};

// Aturan untuk mengubah confidence (0–1) jadi label + warna
export const CONFIDENCE_BUCKETS = [
  {
    min: 0.8,
    label: 'Tinggi',
    className: 'text-emerald-600',
  },
  {
    min: 0.5,
    label: 'Sedang',
    className: 'text-amber-500',
  },
  {
    min: 0,
    label: 'Rendah',
    className: 'text-destructive',
  },
];

// Helper untuk mapping hasil model ke bentuk yang siap dipakai UI
export function mapModelResultToView(result) {
  // result: { label: 'Gray_Leaf_Spot', confidence: 0.33, ... }
  const base =
    DISEASE_CATALOG[result?.label] || DISEASE_CATALOG.Unknown;

  const confidence = typeof result?.confidence === 'number'
    ? result.confidence
    : 0;

  const bucket =
    CONFIDENCE_BUCKETS.find((b) => confidence >= b.min) ||
    CONFIDENCE_BUCKETS[CONFIDENCE_BUCKETS.length - 1];

  return {
    ...base,
    confidence,
    confidencePercent: Math.round(confidence * 100),
    confidenceLabel: bucket.label,
    confidenceClassName: bucket.className,
  };
}
