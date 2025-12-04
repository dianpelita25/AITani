// Fokus: terjemahkan hasil model -> bahasa petani
// Di sinilah kita bisa bikin logika mirip "mockup", tapi dinamis.

import { runLocalModel } from './localModelRunner';
import { DISEASE_LABELS, UI_TEMPLATES } from './localLabelConfig';

/**
 * predictFromTensor(imageTensor):
 *   - imageTensor sudah di-preprocess (resize + normalisasi)
 *   - return objek diagnosis yang rapi untuk UI
 */
export async function predictFromTensor(imageTensor) {
  const rawResults = await runLocalModel(imageTensor);

  if (!rawResults.length) {
    return {
      primaryDiagnosis: {
        code: 'unknown',
        name: 'Tidak Diketahui',
        confidence: 0,
        summary: 'Pola penyakit belum bisa dipastikan.',
        farmerMessage: 'Coba ambil foto lebih dekat dan jelas, lalu ulangi diagnosis.',
      },
      alternatives: [],
      raw: rawResults,
    };
  }

  const enriched = rawResults.map(({ index, score }) => {
    const label = DISEASE_LABELS[index] || {
      code: 'unknown',
      name: `Kelas #${index}`,
      templateKey: null,
    };

    const template = label.templateKey
      ? UI_TEMPLATES[label.templateKey]
      : null;

    return {
      code: label.code,
      name: label.name,
      confidence: Math.round(score * 100),
      summary: template?.summary || 'Hasil analisis dari model lokal.',
      farmerMessage: template?.farmerMessage || '',
    };
  });

  return {
    primaryDiagnosis: enriched[0],
    alternatives: enriched.slice(1),
    raw: rawResults,
  };
}
