using Microsoft.AspNetCore.Mvc;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Content("Ohana API Running", "text/plain");
    }
}
