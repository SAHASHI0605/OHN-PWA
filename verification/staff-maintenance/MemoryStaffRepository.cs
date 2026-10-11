using Ohana.Server.DTOs.Staff;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;

// Verification data only. No connection to MySQL and no production credentials.
public sealed class MemoryStaffRepository : IStaffRepository, IStaffMaintenanceRepository
{
    private readonly SemaphoreSlim _mutex = new(1);
    public Dictionary<string, Staff> Rows { get; } = new(StringComparer.OrdinalIgnoreCase);
    public bool FailReads { get; set; }

    public MemoryStaffRepository()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("test-password", workFactor: 4);
        Rows["ADMIN01"] = new Staff { StaffCode = "ADMIN01", StaffName = "確認用管理者", Role = 0, IsActive = true, PasswordHash = hash };
        Rows["ADMIN02"] = new Staff { StaffCode = "ADMIN02", StaffName = "第二管理者", Role = 0, IsActive = true, PasswordHash = hash };
        for (var i = 1; i <= 43; i++)
        {
            var code = $"S{i:000}";
            Rows[code] = new Staff { StaffCode = code, StaffName = $"確認用スタッフ{i:00}", Role = 1,
                IsActive = i != 43, PasswordHash = hash, LastLoginAt = i % 2 == 0 ? new DateTime(2026, 10, 11, 9, 30, 0) : null };
        }
    }
    private static Staff Copy(Staff value) => new() { StaffCode = value.StaffCode, StaffName = value.StaffName,
        Role = value.Role, IsActive = value.IsActive, PasswordHash = value.PasswordHash, LastLoginAt = value.LastLoginAt, UpdatedAt = value.UpdatedAt };
    public Task<Staff?> GetByStaffCodeAsync(string staffCode)
    {
        if (FailReads) throw new InvalidOperationException("Verification read failure.");
        return Task.FromResult(Rows.TryGetValue(staffCode, out var value) && value.IsActive ? Copy(value) : null);
    }
    public Task<IEnumerable<Staff>> GetActiveStaffAsync() => Task.FromResult<IEnumerable<Staff>>(Rows.Values.Where(value => value.IsActive).Select(Copy).ToList());
    public Task UpdateLastLoginAsync(string staffCode) { Rows[staffCode].LastLoginAt = DateTime.Now; return Task.CompletedTask; }
    public Task<Staff?> GetDetailAsync(string staffCode) => Task.FromResult(Rows.TryGetValue(staffCode, out var value) ? Copy(value) : null);
    public Task<StaffSearchResult> SearchAsync(StaffSearchDto search)
    {
        var keyword = (search.Keyword ?? "").Trim();
        var values = Rows.Values.Where(value => (value.StaffCode.Contains(keyword, StringComparison.OrdinalIgnoreCase) || value.StaffName.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            && (search.Role is null || value.Role == search.Role) && (search.IsActive is null || value.IsActive == search.IsActive))
            .OrderBy(value => value.StaffCode, StringComparer.Ordinal).ToList();
        var page = Math.Clamp(search.Page, 1, Math.Max(1, (int)Math.Ceiling(values.Count / 20d)));
        return Task.FromResult(new StaffSearchResult(values.Skip((page - 1) * 20).Take(20).Select(Copy).ToList(), values.Count, page));
    }
    public async Task MutateAsync(string actorCode, string? targetCode, Func<Staff?, Staff?, IReadOnlyList<Staff>, StaffMutation> prepare)
    {
        await _mutex.WaitAsync();
        try
        {
            Rows.TryGetValue(actorCode, out var actor);
            Staff? target = null;
            if (targetCode is not null) Rows.TryGetValue(targetCode, out target);
            var mutation = prepare(actor is null ? null : Copy(actor), target is null ? null : Copy(target), Rows.Values.Select(Copy).ToList());
            Rows[mutation.Value.StaffCode] = Copy(mutation.Value);
        }
        finally { _mutex.Release(); }
    }
}
