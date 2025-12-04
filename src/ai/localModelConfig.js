// Konfigurasi dasar model lokal (satu tempat saja)

export const LOCAL_MODEL_CONFIG = {
  modelUrl: '/model/model.json',   // path model TF.js
  inputSize: 224,                  // sisi gambar (224x224)
  topK: 3,                         // ambil 3 prediksi teratas
  scoreThreshold: 0.20,            // minimal 20% baru dianggap
};
