namespace Ohana.Server.Models.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;

    public string EmployeeName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}
