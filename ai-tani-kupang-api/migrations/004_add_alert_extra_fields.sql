-- 004_add_alert_extra_fields.sql
ALTER TABLE alerts ADD COLUMN affected_area TEXT;
ALTER TABLE alerts ADD COLUMN pest_count   TEXT;
