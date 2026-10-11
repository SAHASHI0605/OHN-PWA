using Ohana.Server.DTOs.Residents;

namespace Ohana.Server.Services.Interfaces;

public interface IResidentMaintenanceService
{
    Task<ResidentPageDto> SearchAsync(ResidentSearchDto search);
    Task<ResidentDetailDto> GetDetailAsync(string roomNo, string serialNo, string moveInDate);
    Task CreateAsync(string actorCode, CreateResidentDto request);
    Task UpdateAsync(string actorCode, string roomNo, string serialNo, string moveInDate, UpdateResidentDto request);
}
