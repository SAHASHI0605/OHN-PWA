using System.Data;
using Dapper;
using MySqlConnector;
using Ohana.Server.DTOs.Records;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services;
using Ohana.Server.Utilities;

namespace Ohana.Server.Repositories;

public class RecordRepository(IDbConnectionFactory factory, RecordVersion version) : IRecordRepository
{
    // All identifiers are fixed by this allowlist. Only values come from requests.
    private record Spec(string Table, string Id, (string Column, string Property)[] Fields);
    private static readonly Dictionary<string, Spec> Specs = new() {
        ["meal"] = new("trn_meal_record", "meal_record_id", [("performed_at","PerformedAt"),("rice_amount","RiceAmount"),("side_dish_amount","SideDishAmount"),("medication_type","MedicationType"),("eye_drops","EyeDrops"),("oral_care","OralCare"),("memo","Memo")]),
        ["vital"] = new("trn_vital_record", "vital_record_id", [("measured_at","MeasuredAt"),("height_cm","HeightCm"),("weight_kg","WeightKg"),("systolic_blood_pressure","SystolicBloodPressure"),("diastolic_blood_pressure","DiastolicBloodPressure"),("temperature_c","TemperatureC"),("respiration_rate","RespirationRate"),("pulse_rate","PulseRate"),("spo2_percent","Spo2Percent")]),
        ["bath"] = new("trn_bath_record", "bath_record_id", [("bathed_at","BathedAt"),("caregiver_code","CaregiverCode"),("systolic_blood_pressure","SystolicBloodPressure"),("diastolic_blood_pressure","DiastolicBloodPressure"),("bath_method","BathMethod")])
    };
    private const string TenantWhere = "room_no=@RoomNo AND serial_no=@SerialNo AND move_in_date=@MoveInDate";
    private static string SelectSql(string kind)
    {
        var spec = Specs[kind];
        return "SELECT r." + spec.Id + " AS RecordId, " + string.Join(", ", spec.Fields.Select(field => $"r.{field.Column} AS {field.Property}"))
            + (kind == "meal" ? ", r.meal_type AS MealType" : "")
            + ", r.updated_by AS UpdatedBy, COALESCE(s.staff_name, r.updated_by) AS UpdatedByName, r.updated_at AS UpdatedAt"
            + (kind == "bath" ? ", COALESCE(c.staff_name,r.caregiver_code) AS CaregiverName" : "")
            + $" FROM {spec.Table} r LEFT JOIN mst_staff s ON s.staff_code=r.updated_by"
            + (kind == "bath" ? " LEFT JOIN mst_staff c ON c.staff_code=r.caregiver_code" : "")
            + " WHERE r.room_no=@RoomNo AND r.serial_no=@SerialNo AND r.move_in_date=@MoveInDate AND r.record_date=@RecordDate";
    }
    private async Task<RecordsDto> Read(MySqlConnection connection, MySqlTransaction transaction, RecordKey key)
    {
        var tenantName = await connection.QuerySingleOrDefaultAsync<string>("SELECT tenant_name FROM mst_tenant WHERE " + TenantWhere, key, transaction)
            ?? throw new RecordOperationException(404, "対象の入居者が存在しません。入居者選択画面から選び直してください。");
        var meals = (await connection.QueryAsync<MealRecordDto>(SelectSql("meal"), key, transaction)).ToList();
        var vitals = (await connection.QueryAsync<VitalRecordDto>(SelectSql("vital"), key, transaction)).ToList();
        var baths = (await connection.QueryAsync<BathRecordDto>(SelectSql("bath"), key, transaction)).ToList();
        if (meals.Any(value => !new[] { "朝食", "昼食", "おやつ", "夕食" }.Contains(value.MealType)) || meals.Count > 4 || meals.GroupBy(value => value.MealType).Any(group => group.Count() > 1) || vitals.Count > 1 || baths.Count > 1)
            throw new RecordOperationException(409, "対象日に重複した記録があります。管理者に既存データの確認を依頼してください。");
        foreach (var row in meals.Cast<RecordAuditDto>().Concat(vitals).Concat(baths)) row.ConcurrencyToken = version.Create(row);
        var order = new[] { "朝食", "昼食", "おやつ", "夕食" };
        return new(key.RoomNo, key.SerialNo, key.MoveInDate, key.RecordDate.ToString("yyyy-MM-dd"), tenantName,
            meals.OrderBy(value => Array.IndexOf(order, value.MealType)).ToList(), vitals.SingleOrDefault(), baths.SingleOrDefault());
    }
    public async Task<RecordsDto> GetAsync(RecordKey key)
    {
        await using var connection = factory.CreateConnection(); await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var result = await Read(connection, transaction, key); await transaction.CommitAsync(); return result;
    }
    private static async Task CheckUnique(MySqlConnection connection, Spec spec, bool meal)
    {
        var expected = "room_no,serial_no,move_in_date,record_date" + (meal ? ",meal_type" : "");
        var matches = await connection.ExecuteScalarAsync<int>("""
            SELECT COUNT(*) FROM (
                SELECT INDEX_NAME FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table AND NON_UNIQUE=0
                GROUP BY INDEX_NAME
                HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)=@Expected
                  AND SUM(SUB_PART IS NOT NULL)=0
            ) matching_indexes
            """, new { spec.Table, Expected = expected });
        if (matches == 0) throw new RecordOperationException(409, "保存に必要なUNIQUE制約が未適用です。管理者に記録テーブルの設定を依頼してください。");
    }
    public async Task<RecordSaveResult> SaveAsync(string actorCode, RecordMutation mutation)
    {
        var spec = Specs[mutation.Kind];
        await using var connection = factory.CreateConnection(); await connection.OpenAsync();
        await CheckUnique(connection, spec, mutation.Kind == "meal");
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        var activeActor = await connection.ExecuteScalarAsync<int>("SELECT is_active FROM mst_staff WHERE staff_code=@ActorCode FOR UPDATE", new { ActorCode = actorCode }, transaction);
        if (activeActor != 1) throw new RecordOperationException(401, "認証が無効です。再度ログインしてください。");
        // Serialize all care-record writes for this exact tenant, including the first insertion.
        var tenant = await connection.QuerySingleOrDefaultAsync<string>("SELECT tenant_name FROM mst_tenant WHERE " + TenantWhere + " FOR UPDATE", mutation.Key, transaction);
        if (tenant is null) throw new RecordOperationException(404, "対象の入居者が存在しません。");
        if (mutation.Value is BathSaveDto bath) {
            var caregiver = await connection.QuerySingleOrDefaultAsync<int?>("SELECT is_active FROM mst_staff WHERE staff_code=@Code FOR UPDATE", new { Code = bath.CaregiverCode }, transaction);
            if (caregiver != 1) throw new RecordOperationException(400, "有効な介護者を選択してください。", "caregiverCode");
        }
        var before = await Read(connection, transaction, mutation.Key);
        RecordAuditDto? current = mutation.Kind switch { "meal" => before.Meals.SingleOrDefault(value => value.MealType == mutation.MealType), "vital" => before.Vital, _ => before.Bath };
        version.Check(current, mutation.Value.ConcurrencyToken);
        var parameters = new DynamicParameters(mutation.Value);
        parameters.Add("RoomNo", mutation.Key.RoomNo); parameters.Add("SerialNo", mutation.Key.SerialNo);
        parameters.Add("MoveInDate", mutation.Key.MoveInDate); parameters.Add("RecordDate", mutation.Key.RecordDate);
        parameters.Add("ActorCode", actorCode); parameters.Add("MealType", mutation.MealType);
        parameters.Add(spec.Fields[0].Property, mutation.RecordedAt);
        var fields = spec.Fields;
        var sql = $"INSERT INTO {spec.Table} (room_no,serial_no,move_in_date,record_date"
            + (mutation.Kind == "meal" ? ",meal_type" : "") + "," + string.Join(",", fields.Select(field => field.Column)) + ",created_by,updated_by)"
            + " VALUES (@RoomNo,@SerialNo,@MoveInDate,@RecordDate" + (mutation.Kind == "meal" ? ",@MealType" : "")
            + "," + string.Join(",", fields.Select(field => "@" + field.Property)) + ",@ActorCode,@ActorCode)"
            + " ON DUPLICATE KEY UPDATE " + string.Join(",", fields.Select(field => field.Column + "=@" + field.Property)) + ",updated_by=@ActorCode,updated_at=CURRENT_TIMESTAMP";
        await connection.ExecuteAsync(sql, parameters, transaction);
        var id = await connection.ExecuteScalarAsync<ulong>($"SELECT {spec.Id} FROM {spec.Table} WHERE " + TenantWhere + " AND record_date=@RecordDate" + (mutation.Kind == "meal" ? " AND meal_type=@MealType" : ""), parameters, transaction);
        await transaction.CommitAsync(); return new(id, current is null);
    }
}
