using Ohana.Server.DTOs.Residents;
using Ohana.Server.Models;

namespace Ohana.Server.Repositories.Interfaces;

public record ResidentKey(string RoomNo, string SerialNo, DateTime MoveInDate);
public record ResidentSearchResult(IReadOnlyList<Tenant> Items, int TotalCount, int Page);
public record ResidentMutation(bool IsCreate, Tenant Value);
public interface IResidentMaintenanceRepository
{
    Task<ResidentSearchResult> SearchAsync(ResidentSearchDto search);
    Task<Tenant?> GetDetailAsync(ResidentKey key);
    Task MutateAsync(string actorCode, ResidentKey key,
        Func<Staff?, Tenant?, IReadOnlyList<Tenant>, ResidentMutation> prepare);
}
