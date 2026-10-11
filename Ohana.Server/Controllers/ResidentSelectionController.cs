using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/residents/floors/{floor:int}")]
[Authorize]
public class ResidentSelectionController(IResidentSelectionService service, ILogger<ResidentSelectionController> logger) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetByFloor(int floor)
    {
        try { return Ok(await service.GetByFloorAsync(floor)); }
        catch (ResidentOperationException error) { return StatusCode(error.StatusCode, new { message = error.Message }); }
        catch (Exception error) {
            logger.LogError("Resident selection failed: {Type}", error.GetType().Name);
            return StatusCode(500, new { message = "入居者情報を取得できませんでした。時間をおいて再取得してください。" });
        }
    }
}
