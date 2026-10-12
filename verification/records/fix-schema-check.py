from pathlib import Path
p=Path('verification/records/RecordSchemaCheck.cs');s=p.read_text(encoding='utf-8');a=s.index('foreach(var kind in new[]{"vital","bath"})');s=s[:a]+'''foreach(var table in new[]{"trn_vital_record","trn_bath_record"}) {
 var unique = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM (SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table AND NON_UNIQUE=0 GROUP BY INDEX_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)='room_no,serial_no,move_in_date,record_date' AND SUM(SUB_PART IS NOT NULL)=0) indexes_found",new {Table=table});
 Console.WriteLine($"REAL_RECORD_UNIQUE_READ_ONLY: {table} matchingUnique={unique}; no DB write attempted");
}
} }\n''';p.write_text(s,encoding='utf-8')
