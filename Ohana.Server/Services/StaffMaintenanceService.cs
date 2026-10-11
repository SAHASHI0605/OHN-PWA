using Ohana.Server.DTOs.Staff;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Services;

public class StaffMaintenanceService(IStaffMaintenanceRepository repository, StaffVersion version) : IStaffMaintenanceService
{
    private StaffDetailDto ToDto(Staff staff) => new(staff.StaffCode, staff.StaffName,
        staff.Role, staff.IsActive, staff.LastLoginAt, version.Create(staff));

    public async Task<StaffPageDto> SearchAsync(StaffSearchDto search)
    {
        var result = await repository.SearchAsync(search);
        return new StaffPageDto(result.Items.Select(ToDto).ToList(), result.TotalCount, result.Page, 20);
    }

    public async Task<StaffDetailDto> GetDetailAsync(string staffCode) => ToDto(
        await repository.GetDetailAsync(staffCode) ?? throw new StaffOperationException(404, "スタッフが存在しません。"));

    private static void CheckActor(Staff? actor)
    {
        if (actor is null || !actor.IsActive) throw new StaffOperationException(401, "認証が無効です。再度ログインしてください。");
        if (actor.Role != 0) throw new StaffOperationException(403, "管理者権限が必要です。");
    }

    private Staff CheckTarget(Staff? target, string expectedVersion)
    {
        if (target is null) throw new StaffOperationException(404, "スタッフが存在しません。");
        if (!string.Equals(version.Create(target), expectedVersion, StringComparison.Ordinal))
            throw new StaffOperationException(409, "他の操作でスタッフ情報が更新されています。編集を開き直して確認してください。");
        return target;
    }

    private static string RequiredText(string text, int maxLength, string label)
    {
        var result = text.Trim();
        if (result.Length == 0 || result.Length > maxLength)
            throw new StaffOperationException(400, $"{label}は1～{maxLength}文字で入力してください。");
        return result;
    }

    private static string HashPassword(string password, string confirmation)
    {
        // Match the existing BCrypt.Verify login implementation; preserve spaces/case.
        if (password.Length is < 8 or > 64 || password != confirmation)
            throw new StaffOperationException(400, "パスワードは8～64文字で入力し、確認用と一致させてください。");
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public async Task CreateAsync(string actorCode, CreateStaffDto request)
    {
        var value = new Staff { StaffCode = RequiredText(request.StaffCode, 8, "スタッフコード"),
            StaffName = RequiredText(request.StaffName, 20, "スタッフ名"), Role = request.Role,
            IsActive = request.IsActive, PasswordHash = HashPassword(request.Password, request.PasswordConfirmation) };
        await repository.MutateAsync(actorCode, value.StaffCode, (actor, existing, _) =>
        {
            CheckActor(actor);
            if (existing is not null) throw new StaffOperationException(409, "スタッフコードは既に登録されています。");
            return new StaffMutation(StaffMutationKind.Create, value);
        });
    }

    public Task UpdateAsync(string actorCode, string staffCode, UpdateStaffDto request) =>
        repository.MutateAsync(actorCode, staffCode, (actor, target, staff) =>
        {
            CheckActor(actor);
            var current = CheckTarget(target, request.Version);
            var losesAdmin = !request.IsActive || request.Role != 0;
            if (actor!.StaffCode == current.StaffCode && losesAdmin)
                throw new StaffOperationException(409, "自分自身の無効化・一般スタッフへの変更はできません。");
            if (current.IsActive && current.Role == 0 && losesAdmin && staff.Count(item => item.IsActive && item.Role == 0) <= 1)
                throw new StaffOperationException(409, "最後の有効な管理者を無効化・一般スタッフへ変更することはできません。");
            current.StaffName = RequiredText(request.StaffName, 20, "スタッフ名");
            current.Role = request.Role;
            current.IsActive = request.IsActive;
            return new StaffMutation(StaffMutationKind.Update, current);
        });

    public async Task ResetPasswordAsync(string actorCode, string staffCode, ResetStaffPasswordDto request)
    {
        var hash = HashPassword(request.Password, request.PasswordConfirmation);
        await repository.MutateAsync(actorCode, staffCode, (actor, target, _) =>
        {
            CheckActor(actor);
            var current = CheckTarget(target, request.Version);
            current.PasswordHash = hash;
            return new StaffMutation(StaffMutationKind.ResetPassword, current);
        });
    }
}
