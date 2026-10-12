using Ohana.Server.DTOs.VitalReports;
namespace Ohana.Server.Repositories.Interfaces;
public interface IVitalReportRepository {
    Task<VitalReportSnapshot> ReadAsync(IReadOnlyList<string> rooms, DateTime start, DateTime end, CancellationToken cancellationToken);
}
