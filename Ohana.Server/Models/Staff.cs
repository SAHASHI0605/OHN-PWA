namespace Ohana.Server.Models;

public class Staff
{
    public string StaffCode { get; set; } = string.Empty;

    public string StaffName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public int Role { get; set; }

    public bool IsActive { get; set; }

    public DateTime? LastLoginAt { get; set; }
}
