using System.Globalization;
using System.IO.Compression;
using System.Text;
using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;
namespace Ohana.Server.Services;

public sealed class VitalReportException(int statusCode, string message) : Exception(message) { public int StatusCode { get; } = statusCode; }
public sealed class VitalReportService(IVitalReportRepository repository, VitalReportExcelBuilder excel) : IVitalReportService {
    private static (string[] Rooms, DateTime Start, DateTime End) Validate(int floor, int year, int month) {
        if (floor is not (1 or 2) || year is < 1000 or > 9999 || month is < 1 or > 12)
            throw new VitalReportException(400, "階と対象年月を正しく指定してください（年は1000～9999）。");
        var start = new DateTime(year, month, 1);
        var end = year == 9999 && month == 12 ? DateTime.MaxValue : start.AddMonths(1);
        return ((floor == 1 ? TenantRooms.Ordered.Take(19) : TenantRooms.Ordered.Skip(19)).ToArray(), start, end);
    }
    // This single resolver owns the occupancy/count/export predicate. Departure day is inclusive.
    public static IReadOnlyList<VitalReportRow> Resolve(VitalReportSnapshot snapshot, IReadOnlyList<string> rooms, DateTime date) {
        var active = snapshot.Tenants.Where(t => rooms.Contains(t.RoomNo) && t.SerialNo is "1" or "2"
            && t.MoveInDate.Date <= date && (t.MoveOutDate is null || t.MoveOutDate.Value.Date >= date)).ToList();
        if (active.GroupBy(t => (t.RoomNo, t.SerialNo)).Any(g => g.Count() != 1))
            throw new VitalReportException(409, "対象日の入居期間に重複があります。入居者情報を確認して再検索してください。");
        var byKey = snapshot.Vitals.Where(v => v.RecordDate.Date == date)
            .ToLookup(v => (v.RoomNo, v.SerialNo, v.MoveInDate));
        var rows = new List<VitalReportRow>();
        foreach (var room in rooms) {
            var occupants = active.Where(t => t.RoomNo == room).OrderBy(t => t.SerialNo).ToList();
            if (occupants.Count == 0) rows.Add(new(room, null, null));
            foreach (var tenant in occupants) {
                var records = byKey[(room, tenant.SerialNo, tenant.MoveInDate)].ToList();
                if (records.Count > 1) throw new VitalReportException(409, "対象日のバイタル記録に重複があります。データを確認して再検索してください。");
                rows.Add(new(room, tenant.TenantName, records.SingleOrDefault()));
            }
        }
        return rows;
    }
    public async Task<VitalReportDaysDto> DaysAsync(VitalReportQueryDto query, CancellationToken cancellationToken) {
        var (rooms, start, end) = Validate(query.Floor, query.Year, query.Month);
        var snapshot = await repository.ReadAsync(rooms, start, end, cancellationToken);
        var days = new List<VitalReportDayDto>();
        foreach (var day in Enumerable.Range(0, DateTime.DaysInMonth(query.Year, query.Month)).Select(offset => start.AddDays(offset))) {
            var count = Resolve(snapshot, rooms, day).Count(r => r.Vital is not null);
            days.Add(new(day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), count, count > 0));
        }
        return new(query.Floor, query.Year, query.Month, days);
    }
    public async Task<VitalReportArchive> ExportAsync(VitalReportExportDto request, CancellationToken cancellationToken) {
        var (rooms, start, end) = Validate(request.Floor, request.Year, request.Month);
        if (request.Dates is null || request.Dates.Count is < 1 or > 31 || request.Dates.Distinct(StringComparer.Ordinal).Count() != request.Dates.Count)
            throw new VitalReportException(400, "出力日を重複なく1日以上選択してください。");
        var dates = new List<DateTime>();
        foreach (var text in request.Dates) {
            if (!DateTime.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) || date < start || date >= end)
                throw new VitalReportException(400, "出力日は対象月の日付を指定してください。");
            dates.Add(date);
        }
        // Re-read at export time; all selected days are resolved from the same snapshot.
        var snapshot = await repository.ReadAsync(rooms, start, end, cancellationToken);
        var reports = dates.Order().Select(date => (Date: date, Rows: Resolve(snapshot, rooms, date))).ToList();
        if (reports.Any(report => report.Rows.All(r => r.Vital is null)))
            throw new VitalReportException(409, "バイタル記録が0件になった日があります。再検索して選択し直してください。");
        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, true, Encoding.UTF8)) {
            foreach (var report in reports) {
                cancellationToken.ThrowIfCancellationRequested();
                var entry = archive.CreateEntry($"バイタル記録表_{request.Floor}F_{report.Date:yyyyMMdd}.xlsx", CompressionLevel.Fastest);
                using var stream = entry.Open();
                excel.Write(stream, request.Floor, report.Date, report.Rows);
            }
        }
        return new(output.ToArray(), $"バイタル記録表_{request.Floor}F_{start:yyyyMM}.zip");
    }
}
