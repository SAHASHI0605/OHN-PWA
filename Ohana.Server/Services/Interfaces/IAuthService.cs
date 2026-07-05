using Ohana.Server.DTOs.Auth;

namespace Ohana.Server.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
}
