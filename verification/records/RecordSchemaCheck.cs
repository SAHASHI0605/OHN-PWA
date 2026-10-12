using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Ohana.Server.Models;
using Ohana.Server.Repositories;
using Ohana.Server.DTOs.Records;
using Ohana.Server.Utilities;

public static class RecordSchemaCheck { public static async Task Run() {
var configuration = new ConfigurationBuilder().SetBasePath(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../Ohana.Server")))
 .AddJsonFile("appsettings.json",true).AddJsonFile("appsettings.Development.json",true).AddUserSecrets(typeof(Staff).Assembly,true).AddEnvironmentVariables().Build();
await using var connection = new MySqlConnection(configuration.GetConnectionString("DefaultConnection"));
await connection.OpenAsync();
foreach(var table in new[]{"trn_meal_record","trn_vital_record","trn_bath_record"}) {
 Console.WriteLine("TABLE "+table);
 foreach(var column in await connection.QueryAsync("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY,COLUMN_DEFAULT,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table ORDER BY ORDINAL_POSITION",new{Table=table})) Console.WriteLine(System.Text.Json.JsonSerializer.Serialize((IDictionary<string,object>)column));
 foreach(var index in await connection.QueryAsync("SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table GROUP BY INDEX_NAME,NON_UNIQUE",new{Table=table})) Console.WriteLine(System.Text.Json.JsonSerializer.Serialize((IDictionary<string,object>)index));
 var key="room_no,serial_no,move_in_date,record_date"+(table=="trn_meal_record"?",meal_type":"");
 Console.WriteLine("duplicate_groups="+await connection.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM (SELECT {key} FROM {table} GROUP BY {key} HAVING COUNT(*)>1) duplicate_slots"));
}
var sample = await connection.QuerySingleOrDefaultAsync<(string RoomNo,string SerialNo,DateTime MoveInDate)>("SELECT room_no,serial_no,move_in_date FROM mst_tenant ORDER BY room_no,serial_no,move_in_date LIMIT 1");
var repository = new RecordRepository(new Ohana.Server.Infrastructure.Database.DbConnectionFactory(configuration), new RecordVersion(configuration));
var result = await repository.GetAsync(new RecordKey(sample.RoomNo,sample.SerialNo,sample.MoveInDate,new DateTime(2026,10,12)));
Console.WriteLine($"REAL_RECORD_READ_ONLY: meals={result.Meals.Count}; vital={result.Vital is not null}; bath={result.Bath is not null}; exactKey={result.MoveInDate==sample.MoveInDate}");
foreach(var table in new[]{"trn_vital_record","trn_bath_record"}) {
 var unique = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM (SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table AND NON_UNIQUE=0 GROUP BY INDEX_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)='room_no,serial_no,move_in_date,record_date' AND SUM(SUB_PART IS NOT NULL)=0) indexes_found",new {Table=table});
 Console.WriteLine($"REAL_RECORD_UNIQUE_READ_ONLY: {table} matchingUnique={unique}; no DB write attempted");
}
} }
