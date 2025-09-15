-- === TABLES ===

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  pest_type TEXT,
  severity TEXT,
  description TEXT,
  affected_crops TEXT,
  location TEXT,
  coordinates TEXT,          -- JSON string
  photo_name TEXT,
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,           -- soft delete
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS diagnosis (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  field_id TEXT,
  crop_type TEXT,
  latitude REAL,
  longitude REAL,
  notes TEXT,                -- JSON/string
  photo_name TEXT,
  result_label TEXT,
  result_confidence REAL,
  result_severity TEXT,
  result_description TEXT,
  recommendations TEXT,      -- JSON string
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  crop TEXT,
  location TEXT,
  notes TEXT,                -- JSON string (array)
  start_at TEXT NOT NULL,
  end_at TEXT,
  all_day INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')),
  completed_at TEXT,
  source_type TEXT CHECK (source_type IN ('manual','diagnosis')),
  source_id TEXT,
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (source_id) REFERENCES diagnosis(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- === INDEXES (membantu query & filter) ===
CREATE INDEX IF NOT EXISTS idx_alerts_active      ON alerts(account_id, user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_ts   ON alerts(account_id, user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_active   ON diagnosis(account_id, user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_diagnosis_tenant_ts ON diagnosis(account_id, user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_events_active      ON events(account_id, user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_ts   ON events(account_id, user_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(account_id, user_id, status, start_at DESC);

-- === VIEWS (yang dipakai Worker) ===
CREATE VIEW IF NOT EXISTS v_alerts_active    AS SELECT * FROM alerts    WHERE deleted_at IS NULL;
CREATE VIEW IF NOT EXISTS v_diagnosis_active AS SELECT * FROM diagnosis WHERE deleted_at IS NULL;
CREATE VIEW IF NOT EXISTS v_events_active    AS SELECT * FROM events    WHERE deleted_at IS NULL;
