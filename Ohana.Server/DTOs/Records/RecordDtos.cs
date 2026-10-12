namespace Ohana.Server.DTOs.Records;

public record RecordKey(string RoomNo, string SerialNo, DateTime MoveInDate, DateTime RecordDate);
public class RecordQueryDto
{
    public string RoomNo { get; set; } = "";
    public string SerialNo { get; set; } = "";
    public string MoveInDate { get; set; } = "";
    public string RecordDate { get; set; } = "";
}
public class RecordSaveDto : RecordQueryDto
{
    // Optional for API callers; the UI sends the token returned by the last GET.
    public string? ConcurrencyToken { get; set; }
}
public class MealSaveDto : RecordSaveDto
{
    public string PerformedAt { get; set; } = "";
    public int? RiceAmount { get; set; }
    public int? SideDishAmount { get; set; }
    public string? MedicationType { get; set; }
    public string? EyeDrops { get; set; }
    public string? OralCare { get; set; }
    public string? Memo { get; set; }
}
public class VitalSaveDto : RecordSaveDto
{
    public string MeasuredAt { get; set; } = "";
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public decimal? TemperatureC { get; set; }
    public int? RespirationRate { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Spo2Percent { get; set; }
}
public class BathSaveDto : RecordSaveDto
{
    public string BathedAt { get; set; } = "";
    public string CaregiverCode { get; set; } = "";
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public string BathMethod { get; set; } = "";
}
public class RecordAuditDto
{
    public ulong RecordId { get; set; }
    public string UpdatedBy { get; set; } = "";
    public string UpdatedByName { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
    public string ConcurrencyToken { get; set; } = "";
}
public class MealRecordDto : RecordAuditDto
{
    public string MealType { get; set; } = "";
    public DateTime? PerformedAt { get; set; }
    public int? RiceAmount { get; set; }
    public int? SideDishAmount { get; set; }
    public string? MedicationType { get; set; }
    public string? EyeDrops { get; set; }
    public string? OralCare { get; set; }
    public string? Memo { get; set; }
}
public class VitalRecordDto : RecordAuditDto
{
    public DateTime? MeasuredAt { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public decimal? TemperatureC { get; set; }
    public int? RespirationRate { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Spo2Percent { get; set; }
}
public class BathRecordDto : RecordAuditDto
{
    public DateTime BathedAt { get; set; }
    public string CaregiverCode { get; set; } = "";
    public string CaregiverName { get; set; } = "";
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public string BathMethod { get; set; } = "";
}
public record RecordsDto(string RoomNo, string SerialNo, DateTime MoveInDate, string RecordDate,
    string TenantName, IReadOnlyList<MealRecordDto> Meals, VitalRecordDto? Vital, BathRecordDto? Bath);
public record CaregiverDto(string StaffCode, string StaffName);
public record RecordSaveResult(ulong RecordId, bool Created, string Message = "記録を保存しました。");
public record RecordMutation(string Kind, RecordKey Key, DateTime RecordedAt, RecordSaveDto Value, string? MealType = null);
