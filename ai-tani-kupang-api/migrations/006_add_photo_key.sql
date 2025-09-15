-- 006_add_photo_key.sql
PRAGMA foreign_keys=off;

ALTER TABLE alerts ADD COLUMN photo_key TEXT;

-- (Opsional) index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_alerts_photo_key ON alerts(photo_key);

PRAGMA foreign_keys=on;
