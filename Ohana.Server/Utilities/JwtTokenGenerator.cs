using Microsoft.IdentityModel.Tokens;
using Ohana.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ohana.Server.Utilities;

public class JwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string Generate(Staff staff)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, staff.StaffCode),
            new Claim(ClaimTypes.Name, staff.StaffName),
            new Claim(ClaimTypes.Role, staff.Role.ToString())
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
