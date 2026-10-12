-- NOT executed by Codex. Apply only with user approval, after preflight.sql and backup.
-- Omit an ALTER when an equivalent unique index already exists.
-- If either duplicate query returns rows, stop: never delete or merge them automatically.
ALTER TABLE trn_vital_record ADD UNIQUE KEY uq_vital_tenant_date
(room_no, serial_no, move_in_date, record_date);

ALTER TABLE trn_bath_record ADD UNIQUE KEY uq_bath_tenant_date
(room_no, serial_no, move_in_date, record_date);
