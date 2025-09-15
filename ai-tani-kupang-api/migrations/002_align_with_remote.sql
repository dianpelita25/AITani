-- Tambah VIEW yang ada di remote:
CREATE VIEW IF NOT EXISTS v_events_daily_counts AS
  SELECT
    account_id,
    user_id,
    substr(start_at, 1, 10) AS day,
    COUNT(*) AS total
  FROM events
  WHERE deleted_at IS NULL
  GROUP BY account_id, user_id, day;

-- Rapikan index di EVENTS agar sama seperti remote:

-- 1) Hapus index lokal yang beda nama (AMAN untuk dihapus; cuma struktur bantu):
DROP INDEX IF EXISTS idx_events_tenant_ts;
DROP INDEX IF EXISTS idx_events_status_start;

-- 2) Buat index seperti di remote:
CREATE INDEX IF NOT EXISTS idx_events_tenant_start
  ON events(account_id, user_id, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_tenant_status_start
  ON events(account_id, user_id, status, start_at DESC);
