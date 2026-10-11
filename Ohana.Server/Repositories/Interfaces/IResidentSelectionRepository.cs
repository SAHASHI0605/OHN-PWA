using Ohana.Server.DTOs.Residents;

namespace Ohana.Server.Repositories.Interfaces;

public interface IResidentSelectionRepository
{
    Task<IReadOnlyList<ResidentSelectionDto>> GetByFloorAsync(int floor);
}
