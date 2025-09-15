-- 005_refresh_alerts_view.sql
DROP VIEW IF EXISTS v_alerts_active;
CREATE VIEW v_alerts_active AS
SELECT
  id, timestamp, pest_type, severity, description,
  affected_crops, location, coordinates,
  photo_name, photo_url,
  affected_area, pest_count,
  account_id, user_id, created_at, created_by, updated_at, updated_by,
  deleted_at, version
FROM alerts
WHERE deleted_at IS NULL;
