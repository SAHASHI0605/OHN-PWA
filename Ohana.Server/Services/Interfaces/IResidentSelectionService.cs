using Ohana.Server.DTOs.Residents;

namespace Ohana.Server.Services.Interfaces;

public interface IResidentSelectionService
{
    Task<IReadOnlyList<ResidentSelectionDto>> GetByFloorAsync(int floor);
}
