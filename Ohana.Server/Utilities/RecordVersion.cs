using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ohana.Server.DTOs.Records;

namespace Ohana.Server.Utilities;

public class RecordVersion(IConfiguration configuration)
{
    public string Create(RecordAuditDto value)
    {
        // Token covers the contents as well as second-resolution updated_at.
        // Exclude the token itself and use the concrete record type.
        var original = value.ConcurrencyToken;
        value.ConcurrencyToken = "";
        try {
            var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value, value.GetType()));
            return Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!), bytes));
        } finally { value.ConcurrencyToken = original; }
    }
    public void Check(RecordAuditDto? current, string? expected)
    {
        if (expected == "new" && current is null) return;
        if (expected is not null && (current is null || !string.Equals(Create(current), expected, StringComparison.Ordinal)))
            throw new Ohana.Server.Services.RecordOperationException(409, "別の操作で記録が更新されています。入力内容を控え、再取得してから保存してください。");
    }
}
