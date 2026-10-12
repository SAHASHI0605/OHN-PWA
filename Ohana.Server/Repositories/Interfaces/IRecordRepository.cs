using Ohana.Server.DTOs.Records;

namespace Ohana.Server.Repositories.Interfaces;

public interface IRecordRepository
{
    Task<RecordsDto> GetAsync(RecordKey key);
    Task<RecordSaveResult> SaveAsync(string actorCode, RecordMutation mutation);
}
