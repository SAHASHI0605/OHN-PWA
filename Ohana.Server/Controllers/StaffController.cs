using Microsoft.AspNetCore.Mvc;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(
        IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet("login-options")]
    public async Task<IActionResult> GetLoginOptions()
    {
        var result =
            await _staffService.GetLoginOptionsAsync();

        return Ok(result);
    }
}
