using Dapper;
using Ohana.Server.DTOs.Residents;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Repositories;

public class ResidentSelectionRepository(IDbConnectionFactory connectionFactory) : IResidentSelectionRepository
{
    public async Task<IReadOnlyList<ResidentSelectionDto>> GetByFloorAsync(int floor)
    {
        await using var connection = connectionFactory.CreateConnection();
        var rooms = (floor == 1 ? TenantRooms.Ordered.Take(19) : TenantRooms.Ordered.Skip(19)).ToArray();
        const string sql = "SELECT room_no AS RoomNo, serial_no AS SerialNo, tenant_name AS TenantName, move_in_date AS MoveInDate FROM mst_tenant WHERE move_out_date IS NULL AND room_no IN @Rooms AND serial_no IN @Serials ORDER BY room_no, serial_no, move_in_date DESC";
        return (await connection.QueryAsync<ResidentSelectionDto>(sql, new { Rooms = rooms, Serials = new[] { "1", "2" } })).ToList();
    }
}
