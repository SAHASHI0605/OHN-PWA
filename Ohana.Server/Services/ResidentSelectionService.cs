using Ohana.Server.DTOs.Residents;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Services;

public class ResidentSelectionService(IResidentSelectionRepository repository) : IResidentSelectionService
{
    public async Task<IReadOnlyList<ResidentSelectionDto>> GetByFloorAsync(int floor)
    {
        if (floor is not (1 or 2)) throw new ResidentOperationException(400, "対象の階は1階または2階です。");
        var residents = (await repository.GetByFloorAsync(floor)).Select(value => value with { RoomNo = value.RoomNo.ToUpperInvariant() }).ToList();
        // Do not silently choose one history row when the master has overlapping
        // active entries for a slot: that could select the wrong person for care.
        if (residents.GroupBy(value => (value.RoomNo, value.SerialNo)).Any(group => group.Count() > 1))
            throw new ResidentOperationException(409, "同じ部屋番号・連番に複数の入居中データがあります。管理者に入居者マスタの確認を依頼してください。");
        return residents;
    }
}
