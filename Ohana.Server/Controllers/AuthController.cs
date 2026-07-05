using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using Ohana.Server.Models.Auth;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        await using var connection = new MySqlConnection(
            _configuration.GetConnectionString("DefaultConnection")
        );

        await connection.OpenAsync();

        const string sql = @"
            SELECT
                staff_code,
                staff_name,
                password_hash,
                role
            FROM mst_staff
            WHERE staff_code = @staff_code
              AND is_active = 1
            LIMIT 1;
        ";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@staff_code", request.EmployeeNumber);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return Unauthorized(new
            {
                message = "社員番号またはパスワードが違います。"
            });
        }

        var staffCode = reader.GetString("staff_code");
        var staffName = reader.GetString("staff_name");
        var passwordHash = reader.GetString("password_hash");
        var role = reader.GetInt32("role");

        var isValidPassword = BCrypt.Net.BCrypt.Verify(
            request.Password,
            passwordHash
        );

        if (!isValidPassword)
        {
            return Unauthorized(new
            {
                message = "社員番号またはパスワードが違います。"
            });
        }

        var token = GenerateJwtToken(staffCode, staffName, role);

        return Ok(new LoginResponse
        {
            Token = token,
            EmployeeName = staffName,
            Role = role.ToString()
        });
    }

    private string GenerateJwtToken(
        string staffCode,
        string staffName,
        int role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, staffCode),
            new Claim(ClaimTypes.Name, staffName),
            new Claim(ClaimTypes.Role, role.ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var expires = DateTime.Now.AddMinutes(
            Convert.ToDouble(_configuration["Jwt:ExpiresMinutes"])
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
