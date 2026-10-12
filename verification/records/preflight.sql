-- Read only. Inspect existing keys before choosing which ALTER statements to apply.
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS indexed_columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('trn_meal_record','trn_vital_record','trn_bath_record')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE;

SELECT room_no, serial_no, move_in_date, record_date, COUNT(*) AS duplicate_count
FROM trn_vital_record
GROUP BY room_no, serial_no, move_in_date, record_date HAVING COUNT(*) > 1;

SELECT room_no, serial_no, move_in_date, record_date, COUNT(*) AS duplicate_count
FROM trn_bath_record
GROUP BY room_no, serial_no, move_in_date, record_date HAVING COUNT(*) > 1;
