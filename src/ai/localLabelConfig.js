// Mapping index output model -> penyakit + teks UI

// Urutan DISEASE_LABELS HARUS sama dengan urutan output model (Dense units = 3)
// Berdasarkan pipeline lama: ['Blight', 'Common_Rust', 'Gray_Leaf_Spot']
export const DISEASE_LABELS = [
  { id: 0, code: 'blight',        name: 'Blight',        templateKey: 'blight_desc' },
  { id: 1, code: 'common_rust',   name: 'Common Rust',   templateKey: 'common_rust_desc' },
  { id: 2, code: 'gray_leaf_spot',name: 'Gray Leaf Spot',templateKey: 'gray_leaf_spot_desc' },
];

// Template teks yang nanti bisa gampang kamu edit tanpa sentuh logika AI
export const UI_TEMPLATES = {
  blight_desc: {
    summary: 'Terdeteksi Hawar Daun (Blight). Monitor penyebaran dan lakukan tindakan cepat.',
    farmerMessage: 'Segera singkirkan daun terinfeksi berat, gunakan fungisida sesuai anjuran, dan jaga aerasi lahan.',
  },
  common_rust_desc: {
    summary: 'Terdeteksi Karat Biasa (Common Rust).',
    farmerMessage: 'Periksa bercak coklat/oranye di beberapa titik lahan; lakukan penyemprotan preventif bila cuaca lembap berlanjut.',
  },
  gray_leaf_spot_desc: {
    summary: 'Terdeteksi Bercak Abu-abu (Gray Leaf Spot).',
    farmerMessage: 'Awasi perkembangan bercak; pertimbangkan fungisida jika luas sebaran meningkat dalam 2–3 hari.',
  },
};
