using Ohana.Server.DTOs.Staff;

namespace Ohana.Server.Services.Interfaces;

public interface IStaffMaintenanceService
{
    Task<StaffPageDto> SearchAsync(StaffSearchDto search);
    Task<StaffDetailDto> GetDetailAsync(string staffCode);
    Task CreateAsync(string actorCode, CreateStaffDto request);
    Task UpdateAsync(string actorCode, string staffCode, UpdateStaffDto request);
    Task ResetPasswordAsync(string actorCode, string staffCode, ResetStaffPasswordDto request);
}
