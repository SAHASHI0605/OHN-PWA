namespace Ohana.Server.DTOs.VitalReports;

public sealed class VitalReportQueryDto { public int Floor { get; set; } public int Year { get; set; } public int Month { get; set; } }
public sealed class VitalReportExportDto { public int Floor { get; set; } public int Year { get; set; } public int Month { get; set; } public List<string>? Dates { get; set; } }
public record VitalReportDayDto(string Date, int RecordCount, bool CanSelect);
public record VitalReportDaysDto(int Floor, int Year, int Month, IReadOnlyList<VitalReportDayDto> Days);
public record VitalReportArchive(byte[] Content, string FileName);
public sealed class ReportTenant {
    public string RoomNo { get; set; } = "";
    public string SerialNo { get; set; } = "";
    public string TenantName { get; set; } = "";
    public DateTime MoveInDate { get; set; }
    public DateTime? MoveOutDate { get; set; }
}
public sealed class ReportVital {
    public string RoomNo { get; set; } = "";
    public string SerialNo { get; set; } = "";
    public DateTime MoveInDate { get; set; }
    public DateTime RecordDate { get; set; }
    public decimal? TemperatureC { get; set; }
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Spo2Percent { get; set; }
}
public record VitalReportSnapshot(IReadOnlyList<ReportTenant> Tenants, IReadOnlyList<ReportVital> Vitals);
public record VitalReportRow(string RoomNo, string? TenantName, ReportVital? Vital);
