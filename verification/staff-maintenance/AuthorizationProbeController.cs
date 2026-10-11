using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// A verification-only generic authenticated API; never included in Ohana.Server.
[ApiController]
[Route("api/verification/protected")]
[Authorize]
public class AuthorizationProbeController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { authenticated = true });
}
