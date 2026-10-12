using Ohana.Server.DTOs.VitalReports;
namespace Ohana.Server.Services.Interfaces;
public interface IVitalReportService {
    Task<VitalReportDaysDto> DaysAsync(VitalReportQueryDto query, CancellationToken cancellationToken);
    Task<VitalReportArchive> ExportAsync(VitalReportExportDto request, CancellationToken cancellationToken);
}
