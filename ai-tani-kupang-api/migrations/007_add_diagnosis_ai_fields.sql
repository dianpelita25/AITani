-- 007_add_diagnosis_ai_fields.sql
-- Menambahkan kolom untuk menyimpan sumber hasil diagnosis, versi model, penyedia,
-- hasil online/offline, dan key foto di R2. Tidak mengubah data lama.

PRAGMA foreign_keys=off;

ALTER TABLE diagnosis ADD COLUMN photo_key TEXT;
ALTER TABLE diagnosis ADD COLUMN result_source TEXT;
ALTER TABLE diagnosis ADD COLUMN model_version TEXT;
ALTER TABLE diagnosis ADD COLUMN provider TEXT;
ALTER TABLE diagnosis ADD COLUMN online_result_json TEXT;
ALTER TABLE diagnosis ADD COLUMN local_result_json TEXT;
ALTER TABLE diagnosis ADD COLUMN raw_response_json TEXT;

PRAGMA foreign_keys=on;
