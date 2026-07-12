using Ohana.Server.Models;

namespace Ohana.Server.Repositories.Interfaces;

public interface IStaffRepository
{
    Task<Staff?> GetByStaffCodeAsync(string staffCode);

    Task<IEnumerable<Staff>> GetActiveStaffAsync();

    Task UpdateLastLoginAsync(string staffCode);
}
