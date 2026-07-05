namespace Ohana.Server.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;

    public string EmployeeName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}
