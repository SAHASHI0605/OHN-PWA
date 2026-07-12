using Ohana.Server.DTOs.Staff;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Services;

public class StaffService : IStaffService
{
    private readonly IStaffRepository _staffRepository;

    public StaffService(
        IStaffRepository staffRepository)
    {
        _staffRepository = staffRepository;
    }

    public async Task<IEnumerable<StaffOptionDto>>
        GetLoginOptionsAsync()
    {
        var staffList =
            await _staffRepository.GetActiveStaffAsync();

        return staffList.Select(staff =>
            new StaffOptionDto
            {
                EmployeeNumber = staff.StaffCode,
                Name = staff.StaffName
            }
        );
    }
}
