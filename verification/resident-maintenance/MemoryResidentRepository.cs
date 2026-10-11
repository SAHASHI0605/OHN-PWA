using Ohana.Server.DTOs.Residents;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

public sealed class MemoryResidentRepository(MemoryStaffRepository staff) : IResidentMaintenanceRepository
{
    private readonly SemaphoreSlim _mutex = new(1);
    public List<Tenant> Rows { get; } = TenantRooms.Ordered.Select(room => new Tenant {
        RoomNo = room, SerialNo = "1", TenantName = "確認用入居者" + room,
        MoveInDate = new DateTime(2026, 4, 1), UpdatedAt = new DateTime(2026, 10, 11)
    }).Concat(new[] {
        new Tenant { RoomNo = "101", SerialNo = "1", TenantName = "過去の入居者", MoveInDate = new DateTime(2025, 1, 1, 14, 30, 0), MoveOutDate = new DateTime(2026, 3, 31, 15, 0, 0) },
        new Tenant { RoomNo = "101", SerialNo = "2", TenantName = "二人目の入居者", MoveInDate = new DateTime(2026, 5, 1) }
    }).ToList();
    public bool FailReads { get; set; }
    private static Tenant Copy(Tenant value) => new() { RoomNo = value.RoomNo, SerialNo = value.SerialNo,
        TenantName = value.TenantName, MoveInDate = value.MoveInDate, MoveOutDate = value.MoveOutDate, UpdatedAt = value.UpdatedAt };
    private static bool SameSlot(Tenant value, string room, string serial) => string.Equals(value.RoomNo, room, StringComparison.OrdinalIgnoreCase) && value.SerialNo == serial;
    public Task<ResidentSearchResult> SearchAsync(ResidentSearchDto search)
    {
        if (FailReads) throw new InvalidOperationException("Verification error");
        var name = (search.Name ?? "").Trim();
        var rows = Rows.Where(value => (string.IsNullOrEmpty(search.RoomNo) || value.RoomNo == search.RoomNo)
            && value.TenantName.Contains(name, StringComparison.OrdinalIgnoreCase)
            && (search.Status == "all" || (search.Status == "current" ? value.MoveOutDate is null : value.MoveOutDate is not null)))
            .OrderBy(value => TenantRooms.Ordered.IndexOf(value.RoomNo)).ThenBy(value => value.SerialNo).ThenByDescending(value => value.MoveInDate).ToList();
        var page = Math.Clamp(search.Page, 1, Math.Max(1, (int)Math.Ceiling(rows.Count / 20d)));
        return Task.FromResult(new ResidentSearchResult(rows.Skip((page - 1) * 20).Take(20).Select(Copy).ToList(), rows.Count, page));
    }
    public Task<Tenant?> GetDetailAsync(ResidentKey key) => Task.FromResult(Rows.Where(value => SameSlot(value, key.RoomNo, key.SerialNo) && value.MoveInDate == key.MoveInDate).Select(Copy).SingleOrDefault());
    public async Task MutateAsync(string actorCode, ResidentKey key, Func<Staff?, Tenant?, IReadOnlyList<Tenant>, ResidentMutation> prepare)
    {
        await _mutex.WaitAsync();
        try {
            var target = Rows.SingleOrDefault(value => SameSlot(value, key.RoomNo, key.SerialNo) && value.MoveInDate == key.MoveInDate);
            staff.Rows.TryGetValue(actorCode, out var actor);
            var mutation = prepare(actor, target is null ? null : Copy(target), Rows.Where(value => SameSlot(value, key.RoomNo, key.SerialNo)).Select(Copy).ToList());
            if (!mutation.IsCreate) Rows.Remove(target!);
            mutation.Value.UpdatedAt = new DateTime(2026, 10, 11); // Same-second concurrency checks.
            Rows.Add(Copy(mutation.Value));
        } finally { _mutex.Release(); }
    }
}

static class RoomIndex
{
    public static int IndexOf(this IReadOnlyList<string> values, string value) {
        for (var index = 0; index < values.Count; index++) if (values[index] == value) return index;
        return values.Count;
    }
}
