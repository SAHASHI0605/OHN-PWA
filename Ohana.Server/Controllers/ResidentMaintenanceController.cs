using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Ohana.Server.DTOs.Residents;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/admin/residents")]
[Authorize(Roles = "0")]
public class ResidentMaintenanceController(IResidentMaintenanceService service, ILogger<ResidentMaintenanceController> logger) : ControllerBase
{
    private string ActorCode => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (ResidentOperationException error) { return StatusCode(error.StatusCode, new { message = error.Message }); }
        catch (MySqlException error) when (error.Number == 1062)
        { return Conflict(new { message = "同じ部屋番号・連番・入居日の情報は既に登録されています。" }); }
        catch (MySqlException error) when (error.Number is 1213 or 1205)
        { return Conflict(new { message = "他の更新操作と競合しました。最新情報を確認して再実行してください。" }); }
        catch (Exception error)
        {
            logger.LogError("Resident operation failed: {Type}", error.GetType().Name);
            return StatusCode(500, new { message = "入居者情報の処理に失敗しました。時間をおいて再度お試しください。" });
        }
    }
    [HttpGet]
    public Task<IActionResult> Search([FromQuery] ResidentSearchDto search) => Execute(async () => Ok(await service.SearchAsync(search)));
    [HttpGet("{roomNo}/{serialNo}")]
    public Task<IActionResult> Detail(string roomNo, string serialNo, [FromQuery] string moveInDate) =>
        Execute(async () => Ok(await service.GetDetailAsync(roomNo, serialNo, moveInDate)));
    [HttpPost]
    public Task<IActionResult> Create(CreateResidentDto request) => Execute(async () => {
        await service.CreateAsync(ActorCode, request);
        return StatusCode(201, new { message = "入居者情報を登録しました。" });
    });
    [HttpPut("{roomNo}/{serialNo}")]
    public Task<IActionResult> Update(string roomNo, string serialNo, [FromQuery] string moveInDate, UpdateResidentDto request) => Execute(async () => {
        await service.UpdateAsync(ActorCode, roomNo, serialNo, moveInDate, request);
        return Ok(new { message = "入居者情報を更新しました。" });
    });
}
