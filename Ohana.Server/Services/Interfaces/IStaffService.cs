using Ohana.Server.DTOs.Staff;

namespace Ohana.Server.Services.Interfaces;

public interface IStaffService
{
    Task<IEnumerable<StaffOptionDto>>
        GetLoginOptionsAsync();
}
