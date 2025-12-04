// Mapping index output model -> penyakit + teks UI

// Urutan DISEASE_LABELS HARUS sama dengan urutan output model
export const DISEASE_LABELS = [
  { id: 0, code: 'healthy',         name: 'Tanaman Sehat',       templateKey: 'healthy_desc' },
  { id: 1, code: 'gray_leaf_spot',  name: 'Gray Leaf Spot',      templateKey: 'gray_leaf_spot_desc' },
  { id: 2, code: 'blight',          name: 'Blight',              templateKey: 'blight_desc' },
  // tambahkan sesuai kelas di model...
];

// Template teks yang nanti bisa gampang kamu edit tanpa sentuh logika AI
export const UI_TEMPLATES = {
  healthy_desc: {
    summary: 'Tanaman tampak sehat.',
    farmerMessage: 'Pertahankan pola perawatan seperti sekarang, tetap pantau kondisi daun secara berkala.',
  },
  gray_leaf_spot_desc: {
    summary: 'Terindikasi serangan Gray Leaf Spot.',
    farmerMessage: 'Segera periksa sebaran bercak di beberapa titik lahan. Jika menyebar cepat, lakukan penyemprotan fungisida sesuai anjuran.',
  },
  blight_desc: {
    summary: 'Terindikasi penyakit hawar (blight).',
    farmerMessage: 'Prioritaskan pembersihan daun yang parah dan konsultasikan dosis fungisida yang aman.',
  },
};
