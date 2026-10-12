using Ohana.Server.DTOs.Records;

namespace Ohana.Server.Services.Interfaces;

public interface IRecordService
{
    Task<RecordsDto> GetAsync(RecordQueryDto query);
    Task<IReadOnlyList<CaregiverDto>> GetCaregiversAsync();
    Task<RecordSaveResult> SaveMealAsync(string actorCode, string mealType, MealSaveDto request);
    Task<RecordSaveResult> SaveVitalAsync(string actorCode, VitalSaveDto request);
    Task<RecordSaveResult> SaveBathAsync(string actorCode, BathSaveDto request);
}
