using Microsoft.AspNetCore.Mvc;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "OK",
            message = "Ohana API Running"
        });
    }
}
