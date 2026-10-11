namespace Ohana.Server.Utilities;

public static class TenantRooms
{
    public static readonly IReadOnlyList<string> Ordered = Array.AsReadOnly(new[] {
        "101", "102", "103", "105", "106", "107", "108", "110", "111", "112", "113", "115", "116", "117", "118", "120", "121", "122", "VIP",
        "201", "202", "203", "205", "206", "207", "208", "210", "211", "212", "213", "215", "216", "217", "218", "220", "221", "222", "223", "225", "226", "227", "228"
    });
    public static bool IsValid(string value) => Ordered.Contains(value, StringComparer.Ordinal);
}
