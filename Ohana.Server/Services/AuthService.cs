using BCrypt.Net;
using Ohana.Server.DTOs.Auth;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Services;

public class AuthService : IAuthService
{
    private readonly IStaffRepository _staffRepository;
    private readonly JwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IStaffRepository staffRepository,
        JwtTokenGenerator jwtTokenGenerator)
    {
        _staffRepository = staffRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var staff = await _staffRepository.GetByStaffCodeAsync(
            request.EmployeeNumber
        );

        if (staff is null)
        {
            throw new UnauthorizedAccessException(
                "社員番号またはパスワードが違います。"
            );
        }

        var isValidPassword = BCrypt.Net.BCrypt.Verify(
            request.Password,
            staff.PasswordHash
        );

        if (!isValidPassword)
        {
            throw new UnauthorizedAccessException(
                "社員番号またはパスワードが違います。"
            );
        }

        await _staffRepository.UpdateLastLoginAsync(staff.StaffCode);

        var token = _jwtTokenGenerator.Generate(staff);

        return new LoginResponseDto
        {
            Token = token,
            EmployeeName = staff.StaffName,
            Role = staff.Role.ToString()
        };
    }
}
