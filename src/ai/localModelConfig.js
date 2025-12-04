// Konfigurasi dasar model lokal (satu tempat saja)

export const LOCAL_MODEL_CONFIG = {
  modelUrl: '/model/model.json',   // path model TF.js
  inputSize: 128,                  // sisi gambar (128x128 sesuai pipeline lama)
  topK: 3,                         // ambil 3 prediksi teratas
  scoreThreshold: 0.20,            // minimal 20% baru dianggap
};
