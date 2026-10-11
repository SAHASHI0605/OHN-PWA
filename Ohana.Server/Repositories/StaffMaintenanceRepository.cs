using System.Data;
using Dapper;
using Ohana.Server.DTOs.Staff;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;

namespace Ohana.Server.Repositories;

public class StaffMaintenanceRepository(IDbConnectionFactory connectionFactory) : IStaffMaintenanceRepository
{
    private const string Columns = "staff_code AS StaffCode, staff_name AS StaffName, password_hash AS PasswordHash, role AS Role, is_active AS IsActive, last_login_at AS LastLoginAt, updated_at AS UpdatedAt";
    private const int PageSize = 20;

    public async Task<StaffSearchResult> SearchAsync(StaffSearchDto search)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        // Escape LIKE wildcards so the keyword is a literal substring, not a pattern.
        var keyword = (search.Keyword ?? "").Trim();
        var pattern = "%" + keyword.Replace("!", "!!").Replace("%", "!%").Replace("_", "!_") + "%";
        const string where = " WHERE (@Keyword = '' OR staff_code LIKE @Pattern ESCAPE '!' OR staff_name LIKE @Pattern ESCAPE '!') AND (@Role IS NULL OR role = @Role) AND (@IsActive IS NULL OR is_active = @IsActive)";
        var filter = new { Keyword = keyword, Pattern = pattern, search.Role, search.IsActive };
        var count = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM mst_staff" + where, filter, transaction);
        var page = Math.Min(search.Page, Math.Max(1, (int)Math.Ceiling(count / (double)PageSize)));
        var items = (await connection.QueryAsync<Staff>("SELECT " + Columns + " FROM mst_staff" + where + " ORDER BY staff_code ASC LIMIT @Limit OFFSET @Offset",
            new { Keyword = keyword, Pattern = pattern, search.Role, search.IsActive, Limit = PageSize, Offset = (page - 1) * PageSize }, transaction)).ToList();
        await transaction.CommitAsync();
        return new StaffSearchResult(items, count, page);
    }

    public async Task<Staff?> GetDetailAsync(string staffCode)
    {
        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Staff>("SELECT " + Columns + " FROM mst_staff WHERE staff_code = @StaffCode", new { StaffCode = staffCode });
    }

    public async Task MutateAsync(string actorCode, string? targetCode,
        Func<Staff?, Staff?, IReadOnlyList<Staff>, StaffMutation> prepare)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        // Lock the staff set in primary-key order. Every maintenance write follows
        // this protocol, preventing concurrent changes from removing the last admin.
        var staff = (await connection.QueryAsync<Staff>("SELECT " + Columns + " FROM mst_staff ORDER BY staff_code FOR UPDATE", transaction: transaction)).ToList();
        // Resolve codes with MySQL's actual collation, including case/accent variants.
        var actor = await connection.QuerySingleOrDefaultAsync<Staff>("SELECT " + Columns + " FROM mst_staff WHERE staff_code = @Code FOR UPDATE", new { Code = actorCode }, transaction);
        var target = targetCode is null ? null : await connection.QuerySingleOrDefaultAsync<Staff>("SELECT " + Columns + " FROM mst_staff WHERE staff_code = @Code FOR UPDATE", new { Code = targetCode }, transaction);
        var mutation = prepare(actor, target, staff);
        var value = mutation.Value;
        var sql = mutation.Kind switch
        {
            StaffMutationKind.Create => "INSERT INTO mst_staff (staff_code, staff_name, password_hash, role, is_active) VALUES (@StaffCode, @StaffName, @PasswordHash, @Role, @IsActive)",
            StaffMutationKind.Update => "UPDATE mst_staff SET staff_name = @StaffName, role = @Role, is_active = @IsActive, updated_at = NOW() WHERE staff_code = @StaffCode",
            StaffMutationKind.ResetPassword => "UPDATE mst_staff SET password_hash = @PasswordHash, updated_at = NOW() WHERE staff_code = @StaffCode",
            _ => throw new InvalidOperationException("Unsupported staff mutation.")
        };
        await connection.ExecuteAsync(sql, value, transaction);
        await transaction.CommitAsync();
    }
}
