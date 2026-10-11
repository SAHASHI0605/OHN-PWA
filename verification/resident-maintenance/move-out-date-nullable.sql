-- Apply ONLY if information_schema.COLUMNS reports IS_NULLABLE = 'NO'.
-- No SQL was applied during this implementation.
-- Check table metadata and take the normal backup before an approved schema change.
ALTER TABLE mst_tenant
MODIFY COLUMN move_out_date DATETIME NULL DEFAULT NULL COMMENT '退居日';
