using System.Data;
using Dapper;
using Ohana.Server.DTOs.Residents;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Repositories;

public class ResidentMaintenanceRepository(IDbConnectionFactory connectionFactory) : IResidentMaintenanceRepository
{
    private const string Columns = "room_no AS RoomNo, serial_no AS SerialNo, tenant_name AS TenantName, move_in_date AS MoveInDate, move_out_date AS MoveOutDate, updated_at AS UpdatedAt";
    private const string KeyWhere = " WHERE room_no = @RoomNo AND serial_no = @SerialNo AND move_in_date = @MoveInDate";
    // Only constant, allowlisted room names are used to build this ORDER BY expression.
    private static readonly string RoomOrder = "CASE room_no " + string.Join(" ", TenantRooms.Ordered.Select((room, index) => $"WHEN '{room}' THEN {index}")) + " ELSE 42 END";

    public async Task<ResidentSearchResult> SearchAsync(ResidentSearchDto search)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var name = (search.Name ?? "").Trim();
        var pattern = "%" + name.Replace("!", "!!").Replace("%", "!%").Replace("_", "!_") + "%";
        const string where = " WHERE (@RoomNo IS NULL OR @RoomNo = '' OR room_no = @RoomNo) AND (@Name = '' OR tenant_name LIKE @Pattern ESCAPE '!') AND (@Status = 'all' OR (@Status = 'current' AND move_out_date IS NULL) OR (@Status = 'departed' AND move_out_date IS NOT NULL))";
        var count = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM mst_tenant" + where,
            new { search.RoomNo, Name = name, Pattern = pattern, search.Status }, transaction);
        var page = Math.Min(search.Page, Math.Max(1, (int)Math.Ceiling(count / 20d)));
        var items = (await connection.QueryAsync<Tenant>("SELECT " + Columns + " FROM mst_tenant" + where
            + " ORDER BY " + RoomOrder + ", room_no, serial_no ASC, move_in_date DESC LIMIT @Limit OFFSET @Offset",
            new { search.RoomNo, Name = name, Pattern = pattern, search.Status, Limit = 20, Offset = (page - 1) * 20 }, transaction)).ToList();
        await transaction.CommitAsync();
        return new(items, count, page);
    }
    public async Task<Tenant?> GetDetailAsync(ResidentKey key)
    {
        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Tenant>("SELECT " + Columns + " FROM mst_tenant" + KeyWhere, key);
    }
    public async Task MutateAsync(string actorCode, ResidentKey key,
        Func<Staff?, Tenant?, IReadOnlyList<Tenant>, ResidentMutation> prepare)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        var actor = await connection.QuerySingleOrDefaultAsync<Staff>(
            "SELECT staff_code AS StaffCode, role AS Role, is_active AS IsActive FROM mst_staff WHERE staff_code = @ActorCode FOR UPDATE",
            new { ActorCode = actorCode }, transaction);
        // Lock rows AND insertion gaps in primary-key order, including an empty table.
        // All admin tenant writes follow this protocol, so simultaneous first arrivals
        // in an empty slot cannot both pass the overlap check. Deadlocks are retriable conflicts.
        await connection.QueryAsync<Tenant>("SELECT " + Columns
            + " FROM mst_tenant ORDER BY room_no, serial_no, move_in_date FOR UPDATE", transaction: transaction);
        var history = (await connection.QueryAsync<Tenant>("SELECT " + Columns
            + " FROM mst_tenant WHERE room_no = @RoomNo AND serial_no = @SerialNo FOR UPDATE", key, transaction)).ToList();
        var target = await connection.QuerySingleOrDefaultAsync<Tenant>("SELECT " + Columns + " FROM mst_tenant" + KeyWhere + " FOR UPDATE", key, transaction);
        var mutation = prepare(actor, target, history);
        var sql = mutation.IsCreate
            ? "INSERT INTO mst_tenant (room_no, serial_no, tenant_name, move_in_date, move_out_date) VALUES (@RoomNo, @SerialNo, @TenantName, @MoveInDate, @MoveOutDate)"
            : "UPDATE mst_tenant SET tenant_name = @TenantName, move_out_date = @MoveOutDate, updated_at = NOW()" + KeyWhere;
        await connection.ExecuteAsync(sql, mutation.Value, transaction);
        await transaction.CommitAsync();
    }
}
