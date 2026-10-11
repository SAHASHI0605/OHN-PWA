using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ohana.Server.Models;

namespace Ohana.Server.Utilities;

public class ResidentVersion(IConfiguration configuration)
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("JWT key is required."));
    public string Create(Tenant tenant) => Convert.ToHexString(HMACSHA256.HashData(_key,
        Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { tenant.RoomNo, tenant.SerialNo,
            tenant.MoveInDate, tenant.TenantName, tenant.MoveOutDate, tenant.UpdatedAt }))));
}
