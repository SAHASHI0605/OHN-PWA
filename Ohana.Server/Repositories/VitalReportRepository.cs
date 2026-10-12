using System.Data;
using Dapper;
using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Repositories.Interfaces;
namespace Ohana.Server.Repositories;

public sealed class VitalReportRepository(IDbConnectionFactory factory) : IVitalReportRepository {
    public async Task<VitalReportSnapshot> ReadAsync(IReadOnlyList<string> rooms, DateTime start, DateTime end, CancellationToken cancellationToken) {
        await using var connection = factory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        // Both bulk reads use one InnoDB repeatable-read snapshot, including multi-day exports.
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.RepeatableRead, true, cancellationToken);
        var parameters = new { Rooms = rooms, Start = start, End = end, Serials = new[] { "1", "2" } };
        var tenants = (await connection.QueryAsync<ReportTenant>(new CommandDefinition("""
            SELECT room_no RoomNo, serial_no SerialNo, tenant_name TenantName,
                   move_in_date MoveInDate, move_out_date MoveOutDate
            FROM mst_tenant WHERE room_no IN @Rooms AND serial_no IN @Serials
              AND move_in_date < @End AND (move_out_date IS NULL OR move_out_date >= @Start)
            """, parameters, transaction, cancellationToken: cancellationToken))).ToList();
        // Exact legacy move_in_date timestamps are preserved; matching and period checks are shared by both APIs.
        var vitals = (await connection.QueryAsync<ReportVital>(new CommandDefinition("""
            SELECT v.room_no RoomNo, v.serial_no SerialNo, v.move_in_date MoveInDate, v.record_date RecordDate,
                   v.temperature_c TemperatureC, v.systolic_blood_pressure SystolicBloodPressure,
                   v.diastolic_blood_pressure DiastolicBloodPressure, v.pulse_rate PulseRate, v.spo2_percent Spo2Percent
            FROM trn_vital_record v INNER JOIN mst_tenant t
              ON t.room_no=v.room_no AND t.serial_no=v.serial_no AND t.move_in_date=v.move_in_date
            WHERE v.room_no IN @Rooms AND v.serial_no IN @Serials AND v.record_date >= @Start AND v.record_date < @End
              AND DATE(t.move_in_date) <= v.record_date
              AND (t.move_out_date IS NULL OR t.move_out_date >= v.record_date)
            """, parameters, transaction, cancellationToken: cancellationToken))).ToList();
        await transaction.CommitAsync(cancellationToken);
        return new(tenants, vitals);
    }
}
