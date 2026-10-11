using Ohana.Server.DTOs.Staff;
using Ohana.Server.Models;

namespace Ohana.Server.Repositories.Interfaces;

public enum StaffMutationKind { Create, Update, ResetPassword }
public record StaffMutation(StaffMutationKind Kind, Staff Value);
public record StaffSearchResult(IReadOnlyList<Staff> Items, int TotalCount, int Page);

public interface IStaffMaintenanceRepository
{
    Task<StaffSearchResult> SearchAsync(StaffSearchDto search);
    Task<Staff?> GetDetailAsync(string staffCode);
    Task MutateAsync(string actorCode, string? targetCode,
        Func<Staff?, Staff?, IReadOnlyList<Staff>, StaffMutation> prepare);
}
