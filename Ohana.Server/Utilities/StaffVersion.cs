using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ohana.Server.Models;

namespace Ohana.Server.Utilities;

// An opaque concurrency token also detects updates within the same DATETIME second.
// Never expose password_hash or use it as the token directly.
public class StaffVersion(IConfiguration configuration)
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("JWT key is required."));

    public string Create(Staff staff)
    {
        var data = JsonSerializer.Serialize(new { staff.StaffCode, staff.StaffName,
            staff.Role, staff.IsActive, staff.UpdatedAt, staff.PasswordHash });
        return Convert.ToHexString(HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(data)));
    }
}
