using Dapper;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Models;
using Ohana.Server.Repositories.Interfaces;

namespace Ohana.Server.Repositories;

public class StaffRepository : IStaffRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public StaffRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<Staff?> GetByStaffCodeAsync(string staffCode)
    {
        await using var connection = _dbConnectionFactory.CreateConnection();

        const string sql = @"
            SELECT
                staff_code AS StaffCode,
                staff_name AS StaffName,
                password_hash AS PasswordHash,
                role AS Role,
                is_active AS IsActive,
                last_login_at AS LastLoginAt
            FROM mst_staff
            WHERE staff_code = @StaffCode
              AND is_active = 1
            LIMIT 1;
        ";

        return await connection.QuerySingleOrDefaultAsync<Staff>(
            sql,
            new { StaffCode = staffCode }
        );
    }

    public async Task UpdateLastLoginAsync(string staffCode)
    {
        await using var connection = _dbConnectionFactory.CreateConnection();

        const string sql = @"
            UPDATE mst_staff
            SET last_login_at = NOW()
            WHERE staff_code = @StaffCode;
        ";

        await connection.ExecuteAsync(
            sql,
            new { StaffCode = staffCode }
        );
    }
}
