using System.Globalization;
using Ohana.Server.DTOs.Residents;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Services;

public class ResidentMaintenanceService(IResidentMaintenanceRepository repository, ResidentVersion version) : IResidentMaintenanceService
{
    private ResidentDetailDto ToDto(Tenant value) => new(value.RoomNo, value.SerialNo,
        value.TenantName, value.MoveInDate, value.MoveOutDate, version.Create(value));

    private static void ValidateSlot(string roomNo, string serialNo)
    {
        if (!TenantRooms.IsValid(roomNo)) throw new ResidentOperationException(400, "指定された部屋番号は利用できません。");
        if (serialNo is not ("1" or "2")) throw new ResidentOperationException(400, "連番は1または2を選択してください。");
    }
    private static ResidentKey Key(string roomNo, string serialNo, string moveInDate)
    {
        ValidateSlot(roomNo, serialNo);
        // Preserve the exact existing DATETIME primary key, including legacy time values.
        // Do not convert local calendar dates through UTC.
        if (!DateTime.TryParseExact(moveInDate, "yyyy-MM-dd'T'HH:mm:ss", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var date)) throw new ResidentOperationException(400, "入居日時の指定が不正です。");
        return new(roomNo, serialNo, DateTime.SpecifyKind(date, DateTimeKind.Unspecified));
    }
    private static string Name(string value)
    {
        var name = value.Trim();
        if (name.Length is 0 or > 20) throw new ResidentOperationException(400, "入居者名は1～20文字で入力してください。");
        return name;
    }
    private static void CheckActor(Staff? actor)
    {
        if (actor is null || !actor.IsActive) throw new ResidentOperationException(401, "認証が無効です。再度ログインしてください。");
        if (actor.Role != 0) throw new ResidentOperationException(403, "管理者権限が必要です。");
    }
    private static void ValidatePeriod(Tenant value, IReadOnlyList<Tenant> history, Tenant? excluded)
    {
        if (value.MoveOutDate?.Date < value.MoveInDate.Date)
            throw new ResidentOperationException(400, "退居日は入居日以降の日付を指定してください。");
        var end = value.MoveOutDate?.Date ?? DateTime.MaxValue.Date;
        if (value.MoveInDate.Year < 1000 || value.MoveOutDate?.Year < 1000)
            throw new ResidentOperationException(400, "日付は1000年以降で指定してください。");
        // The repository resolves this slot using the database's actual collation.
        if (history.Any(other => !(excluded is not null && other.MoveInDate == excluded.MoveInDate)
            && other.MoveInDate.Date <= end && value.MoveInDate.Date <= (other.MoveOutDate?.Date ?? DateTime.MaxValue.Date)))
            throw new ResidentOperationException(409, "同じ部屋番号・連番の入居期間が重複しています。退居日と入居日を確認してください。");
    }
    public async Task<ResidentPageDto> SearchAsync(ResidentSearchDto search)
    {
        if (!string.IsNullOrEmpty(search.RoomNo) && !TenantRooms.IsValid(search.RoomNo))
            throw new ResidentOperationException(400, "指定された部屋番号は利用できません。");
        if (search.Status is not ("current" or "departed" or "all"))
            throw new ResidentOperationException(400, "入居状況の指定が不正です。");
        var result = await repository.SearchAsync(search);
        return new(result.Items.Select(ToDto).ToList(), result.TotalCount, result.Page, 20);
    }
    public async Task<ResidentDetailDto> GetDetailAsync(string roomNo, string serialNo, string moveInDate) =>
        ToDto(await repository.GetDetailAsync(Key(roomNo, serialNo, moveInDate))
            ?? throw new ResidentOperationException(404, "入居者情報が存在しません。"));

    public async Task CreateAsync(string actorCode, CreateResidentDto request)
    {
        ValidateSlot(request.RoomNo, request.SerialNo);
        if (request.MoveInDate is null) throw new ResidentOperationException(400, "入居日を入力してください。");
        var value = new Tenant { RoomNo = request.RoomNo, SerialNo = request.SerialNo, TenantName = Name(request.TenantName),
            MoveInDate = request.MoveInDate.Value.ToDateTime(TimeOnly.MinValue),
            MoveOutDate = request.MoveOutDate?.ToDateTime(TimeOnly.MinValue) };
        await repository.MutateAsync(actorCode, new(value.RoomNo, value.SerialNo, value.MoveInDate), (actor, target, history) => {
            CheckActor(actor);
            if (target is not null) throw new ResidentOperationException(409, "同じ部屋番号・連番・入居日の情報は既に登録されています。");
            ValidatePeriod(value, history, null);
            return new(true, value);
        });
    }
    public Task UpdateAsync(string actorCode, string roomNo, string serialNo, string moveInDate, UpdateResidentDto request) =>
        repository.MutateAsync(actorCode, Key(roomNo, serialNo, moveInDate), (actor, target, history) => {
            CheckActor(actor);
            if (target is null) throw new ResidentOperationException(404, "入居者情報が存在しません。");
            if (version.Create(target) != request.Version)
                throw new ResidentOperationException(409, "他の操作で入居者情報が更新されています。編集を開き直して確認してください。");
            var value = new Tenant { RoomNo = target.RoomNo, SerialNo = target.SerialNo, MoveInDate = target.MoveInDate,
                TenantName = Name(request.TenantName), MoveOutDate = request.MoveOutDate?.ToDateTime(TimeOnly.MinValue) };
            ValidatePeriod(value, history, target);
            return new(false, value);
        });
}
