using Ohana.Server.DTOs.Residents;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

public sealed class MemoryResidentSelectionRepository(MemoryResidentRepository residents) : IResidentSelectionRepository
{
    public bool FailReads { get; set; }
    public int DelayMs { get; set; }
    public async Task<IReadOnlyList<ResidentSelectionDto>> GetByFloorAsync(int floor)
    {
        if (DelayMs > 0) await Task.Delay(DelayMs);
        if (FailReads) throw new InvalidOperationException("Private SQL details must not escape");
        return residents.Rows.Where(value => value.MoveOutDate is null
            && (floor == 1 ? TenantRooms.Ordered.Take(19) : TenantRooms.Ordered.Skip(19)).Contains(value.RoomNo) && value.SerialNo is "1" or "2")
            .OrderBy(value => value.RoomNo).ThenBy(value => value.SerialNo).Select(value => new ResidentSelectionDto(value.RoomNo, value.SerialNo, value.TenantName, value.MoveInDate)).ToList();
    }
}
